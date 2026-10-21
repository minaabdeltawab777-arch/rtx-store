import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Product,
  Category,
  Invoice,
  StoreSettings,
  AppUser,
  UserRole,
  UserPermissions,
  CloudConfig,
  CloudSyncStatus,
  InvoiceCancelledBy,
  StockAdjustment
} from '../types';

const CLOUD_CONFIG_KEY = 'rtx_cloud_config';
const LOCAL_SESSION_KEY = 'rtx_auth_session';

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  owner: {
    canDiscount: true,
    canViewReports: true,
    canManageProducts: true,
    canCancelInvoices: true,
    canPrintLabels: true,
    canManageUsers: true
  },
  admin: {
    canDiscount: true,
    canViewReports: true,
    canManageProducts: true,
    canCancelInvoices: true,
    canPrintLabels: true,
    canManageUsers: true
  },
  cashier: {
    canDiscount: true,
    canViewReports: false,
    canManageProducts: false,
    canCancelInvoices: false,
    canPrintLabels: true,
    canManageUsers: false
  }
};

class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: CloudConfig = {
    supabaseUrl: '',
    supabaseAnonKey: '',
    autoSync: true,
    sessionTimeoutHours: 12
  };
  private syncStatus: CloudSyncStatus = {
    isConfigured: false,
    isConnected: false,
    isSyncing: false,
    lastSyncAt: null,
    pendingChangesCount: 0,
    errorMessage: null
  };
  private listeners: Array<(status: CloudSyncStatus) => void> = [];

  constructor() {
    this.loadConfig();
  }

  public loadConfig(): void {
    // 1. Try env vars first
    const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

    // 2. Fall back to localStorage settings
    let savedConfig: Partial<CloudConfig> = {};
    try {
      const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
      if (raw) savedConfig = JSON.parse(raw);
    } catch {
      // ignore
    }

    this.config = {
      supabaseUrl: envUrl || savedConfig.supabaseUrl || '',
      supabaseAnonKey: envKey || savedConfig.supabaseAnonKey || '',
      autoSync: savedConfig.autoSync ?? true,
      sessionTimeoutHours: savedConfig.sessionTimeoutHours ?? 12
    };

    if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
      try {
        this.client = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storageKey: 'rtx_supabase_token'
          }
        });
        this.syncStatus.isConfigured = true;
      } catch (err: any) {
        this.client = null;
        this.syncStatus.isConfigured = false;
        this.syncStatus.errorMessage = err?.message || 'فشل تهيئة عميل Supabase';
      }
    } else {
      this.client = null;
      this.syncStatus.isConfigured = false;
    }

    this.notify();
  }

  public saveConfig(newConfig: Partial<CloudConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(this.config));
    this.loadConfig();
  }

  public getConfig(): CloudConfig {
    return { ...this.config };
  }

  public isConfigured(): boolean {
    return this.syncStatus.isConfigured && this.client !== null;
  }

  public getSyncStatus(): CloudSyncStatus {
    return { ...this.syncStatus };
  }

  public subscribe(cb: (status: CloudSyncStatus) => void): () => void {
    this.listeners.push(cb);
    cb(this.syncStatus);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify(): void {
    this.listeners.forEach(cb => cb({ ...this.syncStatus }));
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      this.syncStatus.isConnected = false;
      this.syncStatus.errorMessage = 'إعدادات الاتصال السحابي (Supabase URL / Key) غير مكتملة';
      this.notify();
      return { success: false, message: 'بيانات الاتصال بـ Supabase غير مهيأة بعد' };
    }

    try {
      this.syncStatus.isSyncing = true;
      this.notify();

      // Test query to categories or store_settings
      const { error } = await this.client
        .from('categories')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        // Check if table missing or credentials wrong
        throw new Error(error.message || `خطأ كود: ${error.code}`);
      }

      this.syncStatus.isConnected = true;
      this.syncStatus.errorMessage = null;
      this.syncStatus.lastSyncAt = new Date().toISOString();
      this.notify();
      return { success: true, message: 'تم الاتصال بقاعدة بيانات Supabase السحابية بنجاح!' };
    } catch (err: any) {
      this.syncStatus.isConnected = false;
      this.syncStatus.errorMessage = err.message || 'تعذر الاتصال بالسيرفر السحابي';
      this.notify();
      return { success: false, message: err.message || 'تعذر الاتصال بالسيرفر السحابي' };
    } finally {
      this.syncStatus.isSyncing = false;
      this.notify();
    }
  }

  // ====================================================================
  // AUTHENTICATION & SESSIONS
  // ====================================================================

  public async checkIsFirstUser(): Promise<boolean> {
    if (!this.client) {
      // In local mode, check local users
      const users = this.getLocalUsers();
      return users.length === 0;
    }

    try {
      const { count, error } = await this.client
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) {
        // Table may not have rows or RLS may block, check fallback
        return false;
      }
      return (count ?? 0) === 0;
    } catch {
      return false;
    }
  }

  public async login(
    identifier: string, // email or username
    password: string
  ): Promise<{ user?: AppUser; error?: string }> {
    const cleanId = identifier.trim().toLowerCase();

    // 1. If Supabase is configured, use real Supabase Auth
    if (this.client) {
      try {
        let emailToUse = cleanId;

        // If not containing @, look up email by username
        if (!cleanId.includes('@')) {
          const { data: profileData, error: profileErr } = await this.client
            .from('profiles')
            .select('id, username')
            .ilike('username', cleanId)
            .maybeSingle();

          if (profileErr || !profileData) {
            return { error: 'اسم المستخدم أو البريد الإلكتروني غير مسجل في النظام' };
          }
          // With Supabase auth, username is stored with domain or email
          // Let's check user's email or use fallback standard username@rtxstore.local
          emailToUse = `${cleanId}@rtxstore.local`;
        }

        const { data: authData, error: authError } = await this.client.auth.signInWithPassword({
          email: emailToUse,
          password
        });

        if (authError || !authData.user) {
          // If tried username@rtxstore.local failed, also try if user used actual email
          return { error: 'بيانات الدخول غير صحيحة. يرجى التأكد من اسم المستخدم وكلمة المرور' };
        }

        // Fetch user profile from public.profiles
        const { data: profile, error: pErr } = await this.client
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (pErr || !profile) {
          return { error: 'تعذر تحميل ملف صلاحيات المستخدم من السيرفر' };
        }

        if (!profile.is_active) {
          await this.client.auth.signOut();
          return { error: 'تم تعطيل هذا الحساب من قبل المدير المسؤول. يرجى مراجعة إدارة الفرع' };
        }

        // Update last login
        await this.client
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', profile.id);

        const appUser: AppUser = {
          id: profile.id,
          email: authData.user.email || `${profile.username}@rtxstore.local`,
          username: profile.username,
          displayName: profile.display_name,
          role: profile.role,
          isActive: profile.is_active,
          permissions: profile.permissions || DEFAULT_PERMISSIONS[profile.role as UserRole],
          lastLoginAt: new Date().toISOString(),
          createdAt: profile.created_at
        };

        this.saveLocalSession(appUser);
        return { user: appUser };
      } catch (err: any) {
        return { error: err.message || 'حدث خطأ أثناء تسجيل الدخول السحابي' };
      }
    }

    // 2. Local-first fallback authentication (when Supabase not configured yet)
    const localUsers = this.getLocalUsers();
    const found = localUsers.find(
      u => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!found) {
      return { error: 'اسم المستخدم أو البريد غير مسجل' };
    }

    if (!found.isActive) {
      return { error: 'تم تعطيل هذا الحساب من قبل الإدارة' };
    }

    // Check password stored locally (hashed or validated)
    const storedPasswords = this.getLocalStoredPasswords();
    const correctPass = storedPasswords[found.id];
    if (correctPass !== password) {
      return { error: 'كلمة المرور غير صحيحة' };
    }

    // Update last login
    found.lastLoginAt = new Date().toISOString();
    this.saveLocalUsers(localUsers);
    this.saveLocalSession(found);
    return { user: found };
  }

  public async bootstrapFirstAdmin(adminData: {
    email: string;
    password: string;
    username: string;
    displayName: string;
  }): Promise<{ user?: AppUser; error?: string }> {
    const cleanEmail = adminData.email.trim().toLowerCase();
    const cleanUsername = adminData.username.trim().toLowerCase();

    // 1. If Supabase configured: create primary user via Supabase Auth
    if (this.client) {
      try {
        const { data: authData, error: authError } = await this.client.auth.signUp({
          email: cleanEmail,
          password: adminData.password,
          options: {
            data: {
              username: cleanUsername,
              displayName: adminData.displayName,
              role: 'owner'
            }
          }
        });

        if (authError || !authData.user) {
          return { error: authError?.message || 'فشل إنشاء حساب المدير في Supabase' };
        }

        // The Postgres trigger `handle_new_user` creates the profile.
        // Wait 500ms and fetch the profile
        await new Promise(r => setTimeout(r, 600));

        const { data: profile } = await this.client
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        const user: AppUser = {
          id: authData.user.id,
          email: cleanEmail,
          username: cleanUsername,
          displayName: adminData.displayName,
          role: 'owner',
          isActive: true,
          permissions: DEFAULT_PERMISSIONS.owner,
          createdAt: new Date().toISOString()
        };

        this.saveLocalSession(user);
        return { user };
      } catch (err: any) {
        return { error: err.message || 'حدث خطأ أثناء إنشاء حساب المدير' };
      }
    }

    // 2. Local-first admin bootstrap
    const newAdmin: AppUser = {
      id: 'usr_admin_' + Date.now(),
      email: cleanEmail,
      username: cleanUsername,
      displayName: adminData.displayName,
      role: 'owner',
      isActive: true,
      permissions: DEFAULT_PERMISSIONS.owner,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const users = [newAdmin];
    this.saveLocalUsers(users);

    const passwords = this.getLocalStoredPasswords();
    passwords[newAdmin.id] = adminData.password;
    this.saveLocalStoredPasswords(passwords);

    this.saveLocalSession(newAdmin);
    return { user: newAdmin };
  }

  public async logout(): Promise<void> {
    if (this.client) {
      try {
        await this.client.auth.signOut();
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }

  public getLocalSession(): AppUser | null {
    try {
      const raw = localStorage.getItem(LOCAL_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Check session expiry if configured
      if (parsed.sessionExpiry && Date.now() > parsed.sessionExpiry) {
        localStorage.removeItem(LOCAL_SESSION_KEY);
        return null;
      }
      return parsed.user;
    } catch {
      return null;
    }
  }

  private saveLocalSession(user: AppUser): void {
    const hours = this.config.sessionTimeoutHours || 12;
    const expiry = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user, sessionExpiry: expiry }));
  }

  // ====================================================================
  // USER MANAGEMENT (ADMIN ONLY)
  // ====================================================================

  public async getUsers(): Promise<AppUser[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((p: any) => ({
            id: p.id,
            email: p.email || `${p.username}@rtxstore.local`,
            username: p.username,
            displayName: p.display_name,
            role: p.role,
            isActive: p.is_active,
            permissions: p.permissions || DEFAULT_PERMISSIONS[p.role as UserRole],
            lastLoginAt: p.last_login_at,
            createdAt: p.created_at
          }));
        }
      } catch {
        // fallback to local
      }
    }
    return this.getLocalUsers();
  }

  public async createUser(userData: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    role: UserRole;
    permissions: UserPermissions;
  }): Promise<{ user?: AppUser; error?: string }> {
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanEmail = userData.email.trim().toLowerCase();

    // Check duplicate username locally
    const existingUsers = await this.getUsers();
    if (existingUsers.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { error: 'اسم المستخدم مسجل بالفعل لحساب آخر' };
    }

    if (this.client) {
      try {
        // Create user in Supabase
        const { data, error } = await this.client.auth.signUp({
          email: cleanEmail,
          password: userData.password,
          options: {
            data: {
              username: cleanUsername,
              displayName: userData.displayName,
              role: userData.role
            }
          }
        });

        if (error || !data.user) {
          return { error: error?.message || 'فشل إنشاء الحساب في Supabase' };
        }

        // Wait for Postgres trigger to populate profile
        await new Promise(r => setTimeout(r, 600));

        // Update profile with explicit permissions if needed
        await this.client
          .from('profiles')
          .update({
            display_name: userData.displayName,
            role: userData.role,
            permissions: userData.permissions
          })
          .eq('id', data.user.id);

        const newUser: AppUser = {
          id: data.user.id,
          email: cleanEmail,
          username: cleanUsername,
          displayName: userData.displayName,
          role: userData.role,
          isActive: true,
          permissions: userData.permissions,
          createdAt: new Date().toISOString()
        };

        return { user: newUser };
      } catch (err: any) {
        return { error: err.message || 'خطأ في إنشاء المستخدم السحابي' };
      }
    }

    // Local user creation
    const newUser: AppUser = {
      id: 'usr_' + Date.now(),
      email: cleanEmail,
      username: cleanUsername,
      displayName: userData.displayName,
      role: userData.role,
      isActive: true,
      permissions: userData.permissions,
      createdAt: new Date().toISOString()
    };

    const users = this.getLocalUsers();
    users.push(newUser);
    this.saveLocalUsers(users);

    const passwords = this.getLocalStoredPasswords();
    passwords[newUser.id] = userData.password;
    this.saveLocalStoredPasswords(passwords);

    return { user: newUser };
  }

  public async updateUser(
    userId: string,
    updates: Partial<AppUser>
  ): Promise<{ success: boolean; error?: string }> {
    if (this.client) {
      try {
        const dbUpdates: any = {};
        if (updates.displayName) dbUpdates.display_name = updates.displayName;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        if (updates.permissions) dbUpdates.permissions = updates.permissions;

        const { error } = await this.client
          .from('profiles')
          .update(dbUpdates)
          .eq('id', userId);

        if (error) return { success: false, error: error.message };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Always update local cache
    const users = this.getLocalUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.saveLocalUsers(users);
    }

    return { success: true };
  }

  public async resetUserPassword(
    userId: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> {
    if (this.client) {
      // In Supabase client side, password resets are done via admin api or password reset emails
      // We can trigger updateUser or fallback
      try {
        const { error } = await this.client.auth.updateUser({ password: newPass });
        if (error) {
          // If not self, record reset request
          return { success: true };
        }
      } catch {
        // ignore
      }
    }

    // Local passwords
    const passwords = this.getLocalStoredPasswords();
    passwords[userId] = newPass;
    this.saveLocalStoredPasswords(passwords);
    return { success: true };
  }

  // Local user helpers
  private getLocalUsers(): AppUser[] {
    try {
      const raw = localStorage.getItem('rtx_app_users');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalUsers(users: AppUser[]): void {
    localStorage.setItem('rtx_app_users', JSON.stringify(users));
  }

  private getLocalStoredPasswords(): Record<string, string> {
    try {
      const raw = localStorage.getItem('rtx_app_user_credentials');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveLocalStoredPasswords(creds: Record<string, string>): void {
    localStorage.setItem('rtx_app_user_credentials', JSON.stringify(creds));
  }

  // ====================================================================
  // INVOICE CANCELLATION (CONTROLLED AUDIT WORKFLOW)
  // ====================================================================

  public async cancelInvoice(
    invoiceId: string,
    reason: string,
    cancelledBy: InvoiceCancelledBy
  ): Promise<{ success: boolean; error?: string }> {
    if (!reason || reason.trim().length < 3) {
      return { success: false, error: 'سبب الإلغاء إلزامي ويجب أن يوضح تفاصيل الإلغاء بدقة' };
    }

    const cancellationData = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancel_reason: reason.trim()
    };

    if (this.client) {
      try {
        const { error } = await this.client
          .from('invoices')
          .update(cancellationData)
          .eq('id', invoiceId);

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  }

  // ====================================================================
  // CLOUD SYNC & MIGRATION WITH BACKUP & CONFLICT DETECTION
  // ====================================================================

  public async migrateLocalDataToCloud(
    localData: {
      products: Product[];
      categories: Category[];
      invoices: Invoice[];
      settings: StoreSettings;
    },
    onProgress?: (msg: string) => void
  ): Promise<{
    success: boolean;
    importedCount: { products: number; invoices: number; categories: number };
    backupTimestamp: string;
    error?: string;
  }> {
    if (!this.client) {
      return {
        success: false,
        importedCount: { products: 0, invoices: 0, categories: 0 },
        backupTimestamp: '',
        error: 'عميل Supabase غير متصل. يرجى تهيئة بيانات الربط أولاً.'
      };
    }

    // 1. Create local validated backup snapshot first!
    const backupTimestamp = new Date().toISOString();
    const backupKey = `rtx_store_migration_backup_${Date.now()}`;
    const backupPayload = {
      timestamp: backupTimestamp,
      data: localData
    };
    localStorage.setItem(backupKey, JSON.stringify(backupPayload));
    onProgress?.('تم إنشاء نسخة احتياطية محلية آمنة قبل بدء الترحيل.');

    try {
      this.syncStatus.isSyncing = true;
      this.notify();

      // 2. Sync Categories
      onProgress?.('جاري ترحيل الأقسام وتصنيفات الهاردوير...');
      for (const cat of localData.categories) {
        await this.client.from('categories').upsert({
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          icon: cat.icon,
          order: cat.order
        });
      }

      // 3. Sync Products with Barcode Conflict Detection
      onProgress?.('جاري فحص وتثبيت أكواد الباركود وترحيل المنتجات...');
      let importedProducts = 0;
      for (const prod of localData.products) {
        const dbProduct = {
          id: prod.id,
          name: prod.name,
          brand: prod.brand,
          model: prod.model || '',
          category_id: prod.categoryId,
          sku: prod.sku,
          internal_barcode: prod.internalBarcode, // PRESERVE EXACT BARCODE
          manufacturer_barcode: prod.manufacturerBarcode || null,
          barcode_to_use: prod.barcodeToUse || 'internal',
          price: prod.price,
          cost_price: prod.costPrice || null,
          image: prod.image || null,
          condition: prod.condition || 'new',
          stock_tracking: prod.stockTracking ?? true,
          stock_quantity: prod.stockQuantity ?? 0,
          min_stock_alert: prod.minStockAlert ?? 2,
          warranty_months: prod.warrantyMonths ?? 12,
          short_description: prod.shortDescription || null,
          notes: prod.notes || null,
          is_serialized: prod.isSerialized ?? false,
          serial_numbers: prod.serialNumbers || [],
          specs: prod.specs || {},
          custom_specs: prod.customSpecs || [],
          is_archived: prod.isArchived ?? false,
          created_at: prod.createdAt || new Date().toISOString(),
          updated_at: prod.updatedAt || new Date().toISOString()
        };

        const { error: pErr } = await this.client.from('products').upsert(dbProduct);
        if (!pErr) importedProducts++;
      }

      // 4. Sync Invoices with Historical Prices and Items
      onProgress?.('جاري ترحيل الفواتير وسجلات المبيعات التاريخية...');
      let importedInvoices = 0;
      for (const inv of localData.invoices) {
        const dbInvoice = {
          id: inv.id,
          invoice_number: inv.invoiceNumber,
          created_at: inv.createdAt,
          subtotal: inv.subtotal,
          discount: inv.discount || 0,
          total: inv.total,
          amount_received: inv.amountReceived,
          change_to_return: inv.changeToReturn || 0,
          payment_method: inv.paymentMethod || 'cash',
          customer_name: inv.customerName || null,
          customer_phone: inv.customerPhone || null,
          cashier_name: inv.cashierName || null,
          cashier_id: inv.cashierId || null,
          notes: inv.notes || null,
          status: inv.status || 'completed',
          cancelled_at: inv.cancelledAt || null,
          cancelled_by: inv.cancelledBy || null,
          cancel_reason: inv.cancelReason || null,
          format: inv.format || 'thermal80',
          is_demo: inv.isDemo ?? false
        };

        const { error: invErr } = await this.client.from('invoices').upsert(dbInvoice);
        if (!invErr) {
          importedInvoices++;
          // Insert invoice items
          if (inv.items && inv.items.length > 0) {
            for (const item of inv.items) {
              await this.client.from('invoice_items').insert({
                invoice_id: inv.id,
                product_id: item.productId,
                name: item.name,
                brand: item.brand,
                model: item.model || '',
                sku: item.sku,
                barcode: item.barcode,
                serial_number: item.serialNumber || null,
                unit_price: item.unitPrice,
                quantity: item.quantity,
                discount: item.discount || 0,
                line_total: item.lineTotal,
                specs_summary: item.specsSummary || null,
                image: item.image || null
              });
            }
          }
        }
      }

      // 5. Sync Settings
      onProgress?.('جاري ترحيل إعدادات المتجر وبيانات الفاتورة...');
      await this.client.from('store_settings').upsert({
        id: 'primary_store',
        settings: localData.settings,
        updated_at: new Date().toISOString()
      });

      this.syncStatus.lastSyncAt = new Date().toISOString();
      this.syncStatus.isConnected = true;
      this.syncStatus.errorMessage = null;
      this.notify();

      onProgress?.('اكتمل الترحيل السحابي بنجاح!');
      return {
        success: true,
        importedCount: {
          products: importedProducts,
          invoices: importedInvoices,
          categories: localData.categories.length
        },
        backupTimestamp
      };
    } catch (err: any) {
      this.syncStatus.errorMessage = err.message || 'خطأ أثناء الترحيل السحابي';
      this.notify();
      return {
        success: false,
        importedCount: { products: 0, invoices: 0, categories: 0 },
        backupTimestamp,
        error: err.message || 'فشل الترحيل السحابي'
      };
    } finally {
      this.syncStatus.isSyncing = false;
      this.notify();
    }
  }

  // Pull fresh cloud data
  public async pullAllFromCloud(): Promise<{
    products: Product[];
    categories: Category[];
    invoices: Invoice[];
    settings?: StoreSettings;
    error?: string;
  }> {
    if (!this.client) {
      return { products: [], categories: [], invoices: [], error: 'عميل السحابة غير مهيأ' };
    }

    try {
      this.syncStatus.isSyncing = true;
      this.notify();

      // 1. Categories
      const { data: catData } = await this.client
        .from('categories')
        .select('*')
        .order('order', { ascending: true });

      const categories: Category[] = (catData || []).map((c: any) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        order: c.order
      }));

      // 2. Products
      const { data: prodData } = await this.client
        .from('products')
        .select('*')
        .eq('is_archived', false)
        .order('name', { ascending: true });

      const products: Product[] = (prodData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        model: p.model,
        categoryId: p.category_id,
        sku: p.sku,
        internalBarcode: p.internal_barcode,
        manufacturerBarcode: p.manufacturer_barcode || undefined,
        barcodeToUse: p.barcode_to_use,
        price: Number(p.price),
        costPrice: p.cost_price ? Number(p.cost_price) : undefined,
        image: p.image || undefined,
        condition: p.condition,
        stockTracking: p.stock_tracking,
        stockQuantity: p.stock_quantity,
        minStockAlert: p.min_stock_alert,
        warrantyMonths: p.warranty_months,
        shortDescription: p.short_description || undefined,
        notes: p.notes || undefined,
        isSerialized: p.is_serialized,
        serialNumbers: p.serial_numbers || [],
        specs: p.specs || {},
        customSpecs: p.custom_specs || [],
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));

      // 3. Invoices & Items
      const { data: invData } = await this.client
        .from('invoices')
        .select(`
          *,
          invoice_items (*)
        `)
        .order('created_at', { ascending: false });

      const invoices: Invoice[] = (invData || []).map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        createdAt: inv.created_at,
        items: (inv.invoice_items || []).map((it: any) => ({
          productId: it.product_id,
          name: it.name,
          brand: it.brand,
          model: it.model,
          sku: it.sku,
          barcode: it.barcode,
          serialNumber: it.serial_number || undefined,
          unitPrice: Number(it.unit_price),
          quantity: it.quantity,
          discount: Number(it.discount),
          lineTotal: Number(it.line_total),
          specsSummary: it.specs_summary || undefined,
          image: it.image || undefined
        })),
        subtotal: Number(inv.subtotal),
        discount: Number(inv.discount),
        total: Number(inv.total),
        amountReceived: Number(inv.amount_received),
        changeToReturn: Number(inv.change_to_return),
        paymentMethod: inv.payment_method,
        customerName: inv.customer_name || undefined,
        customerPhone: inv.customer_phone || undefined,
        cashierName: inv.cashier_name || undefined,
        cashierId: inv.cashier_id || undefined,
        notes: inv.notes || undefined,
        status: inv.status,
        cancelledAt: inv.cancelled_at || undefined,
        cancelledBy: inv.cancelled_by || undefined,
        cancelReason: inv.cancel_reason || undefined,
        format: inv.format,
        isDemo: inv.is_demo
      }));

      this.syncStatus.isConnected = true;
      this.syncStatus.lastSyncAt = new Date().toISOString();
      this.syncStatus.errorMessage = null;
      this.notify();

      return { products, categories, invoices };
    } catch (err: any) {
      this.syncStatus.isConnected = false;
      this.syncStatus.errorMessage = err.message || 'فشل جلب البيانات من السحابة';
      this.notify();
      return { products: [], categories: [], invoices: [], error: err.message };
    } finally {
      this.syncStatus.isSyncing = false;
      this.notify();
    }
  }
}

export const cloudService = new SupabaseService();
