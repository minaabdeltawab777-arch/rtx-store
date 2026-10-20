import { Product, Category, Invoice, StoreSettings, StockAdjustment } from '../types';
import { INITIAL_CATEGORIES } from '../data/categories';
import { INITIAL_DEMO_PRODUCTS } from '../data/demoProducts';

const STORAGE_KEYS = {
  PRODUCTS: 'rtx_store_products_v2',
  CATEGORIES: 'rtx_store_categories_v2',
  INVOICES: 'rtx_store_invoices_v2',
  SETTINGS: 'rtx_store_settings_v2',
  STOCK_LOGS: 'rtx_store_stock_logs_v2',
  BARCODE_SEQ: 'rtx_barcode_sequence'
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'RTX STORE',
  storeTagline: 'مركز أجهزة الجيمنج واللابتوب والمحترفين — مصر',
  phone: '01001234567 / 01229876543',
  address: 'مول البستان التجاري — الدور الثاني — التحرير — القاهرة',
  commercialReg: '145289',
  taxNumber: '685-320-112',
  receiptFooter: 'شكراً لتعاملكم مع RTX STORE — الاسترجاع والاستبدال خلال 14 يوماً بالفاتورة وأصل الكرتونة — الضمان يسري برقم السيريال.',
  defaultReceiptFormat: 'thermal80',
  defaultLabelPreset: '50x30',
  customLabelWidthMm: 50,
  customLabelHeightMm: 30,
  labelTemplate: 'phone_box',
  qrMode: 'online',
  labelShowLogo: true,
  labelShowStoreName: true,
  labelShowPrice: true,
  labelShowSku: true,
  labelShowModel: true,
  labelShowBarcodeText: true,
  labelShowQR: true,
  labelShowSpecs: true,
  labelShowWarranty: true,
  labelShowSerial: true,
  labelFontSize: 'standard',
  labelSheetColumns: 1,
  scannerAudioFeedback: true,
  scannerSuffix: 'Enter',
  cashierDisplayName: 'كاشير الفرع الرئيسي',
  enableDiscounts: true,
  defaultStockTracking: true
};

class StorageService {
  private products: Product[] = [];
  private categories: Category[] = [];
  private invoices: Invoice[] = [];
  private settings: StoreSettings = DEFAULT_SETTINGS;
  private stockLogs: StockAdjustment[] = [];
  private initialized = false;

  public init(): void {
    if (this.initialized) return;

    try {
      // 1. Settings
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      } else {
        this.saveSettings(DEFAULT_SETTINGS);
      }

      // 2. Categories
      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (savedCategories) {
        this.categories = JSON.parse(savedCategories);
      } else {
        this.categories = INITIAL_CATEGORIES;
        this.saveCategories(this.categories);
      }

      // 3. Products
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) {
        this.products = JSON.parse(savedProducts);
      } else {
        // First run: load initial demo hardware products
        this.products = INITIAL_DEMO_PRODUCTS;
        this.saveProducts(this.products);
      }

      // 4. Invoices
      const savedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (savedInvoices) {
        this.invoices = JSON.parse(savedInvoices);
      } else {
        // Create 2 initial realistic completed invoices for initial sales stats
        this.seedInitialInvoices();
      }

      // 5. Stock logs
      const savedLogs = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
      if (savedLogs) {
        this.stockLogs = JSON.parse(savedLogs);
      }

      this.initialized = true;
    } catch (e) {
      console.error('Failed to initialize storage from localStorage:', e);
      this.products = INITIAL_DEMO_PRODUCTS;
      this.categories = INITIAL_CATEGORIES;
      this.settings = DEFAULT_SETTINGS;
      this.initialized = true;
    }
  }

  // --- Products Management ---
  public getProducts(): Product[] {
    this.init();
    return [...this.products];
  }

  public getProductById(id: string): Product | undefined {
    this.init();
    return this.products.find(p => p.id === id);
  }

  public findProductByBarcode(code: string): Product | undefined {
    this.init();
    const clean = code.trim();
    if (!clean) return undefined;
    
    return this.products.find(p => {
      if (p.isArchived) return false;
      if (p.internalBarcode && p.internalBarcode.toLowerCase() === clean.toLowerCase()) return true;
      if (p.manufacturerBarcode && p.manufacturerBarcode.toLowerCase() === clean.toLowerCase()) return true;
      if (p.sku && p.sku.toLowerCase() === clean.toLowerCase()) return true;
      if (p.serialNumbers && p.serialNumbers.some(s => s.toLowerCase() === clean.toLowerCase())) return true;
      return false;
    });
  }

  public generateUniqueBarcode(): string {
    this.init();
    let seq = parseInt(localStorage.getItem(STORAGE_KEYS.BARCODE_SEQ) || '1000120', 10);
    
    let candidate = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10000) {
      seq += 1;
      candidate = `RTX${seq}`;
      const conflict = this.products.some(
        p => p.internalBarcode === candidate || p.manufacturerBarcode === candidate
      );
      if (!conflict) {
        isUnique = true;
        break;
      }
      attempts++;
    }

    localStorage.setItem(STORAGE_KEYS.BARCODE_SEQ, seq.toString());
    return candidate;
  }

  public isBarcodeDuplicate(barcode: string, excludeProductId?: string): boolean {
    this.init();
    const clean = barcode.trim().toLowerCase();
    if (!clean) return false;

    return this.products.some(p => {
      if (excludeProductId && p.id === excludeProductId) return false;
      const internalMatch = p.internalBarcode && p.internalBarcode.toLowerCase() === clean;
      const mfgMatch = p.manufacturerBarcode && p.manufacturerBarcode.toLowerCase() === clean;
      return internalMatch || mfgMatch;
    });
  }

  public saveProduct(product: Product): { success: boolean; error?: string } {
    this.init();
    
    // Check barcode duplication
    if (this.isBarcodeDuplicate(product.internalBarcode, product.id)) {
      return { success: false, error: `الباركود الداخلي (${product.internalBarcode}) مستخدم بالفعل لمنتج آخر!` };
    }
    if (product.manufacturerBarcode && this.isBarcodeDuplicate(product.manufacturerBarcode, product.id)) {
      return { success: false, error: `باركود الشركة (${product.manufacturerBarcode}) مستخدم بالفعل لمنتج آخر!` };
    }

    const index = this.products.findIndex(p => p.id === product.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      const old = this.products[index];
      // Record stock change if modified manually
      if (product.stockTracking && old.stockTracking && product.stockQuantity !== old.stockQuantity) {
        this.addStockLog({
          id: `log-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          type: 'audit',
          quantityChange: product.stockQuantity - old.stockQuantity,
          newQuantity: product.stockQuantity,
          reason: 'تعديل يدوي للمخزون من شاشة المنتج',
          timestamp: now
        });
      }

      this.products[index] = { ...product, updatedAt: now };
    } else {
      this.products.unshift({ ...product, createdAt: now, updatedAt: now });

      if (product.stockTracking && product.stockQuantity > 0) {
        this.addStockLog({
          id: `log-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          type: 'in',
          quantityChange: product.stockQuantity,
          newQuantity: product.stockQuantity,
          reason: 'رصيد أولي عند إضافة المنتج',
          timestamp: now
        });
      }
    }

    this.saveProducts(this.products);
    return { success: true };
  }

  public deleteProduct(id: string): void {
    this.init();
    this.products = this.products.filter(p => p.id !== id);
    this.saveProducts(this.products);
  }

  public duplicateProduct(id: string): Product | null {
    this.init();
    const source = this.products.find(p => p.id === id);
    if (!source) return null;

    const newBarcode = this.generateUniqueBarcode();
    const duplicated: Product = {
      ...source,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${source.name} (نسخة)`,
      sku: `${source.sku}-COPY`,
      internalBarcode: newBarcode,
      manufacturerBarcode: undefined, // Clear manufacturer barcode to avoid collision
      barcodeToUse: 'internal',
      serialNumbers: [],
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.products.unshift(duplicated);
    this.saveProducts(this.products);
    return duplicated;
  }

  private saveProducts(products: Product[]): void {
    this.products = products;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Storage quota exceeded, attempting to save without large base64 images:', e);
      try {
        const stripped = products.map(p => ({
          ...p,
          image: p.image && p.image.length > 50000 ? undefined : p.image
        }));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(stripped));
      } catch (innerErr) {
        console.error('Critical failure saving products to localStorage:', innerErr);
      }
    }
  }

  // --- Categories Management ---
  public getCategories(): Category[] {
    this.init();
    return [...this.categories].sort((a, b) => a.order - b.order);
  }

  public saveCategory(category: Category): void {
    this.init();
    const idx = this.categories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      this.categories[idx] = category;
    } else {
      this.categories.push(category);
    }
    this.saveCategories(this.categories);
  }

  public deleteCategory(id: string, reassignToId = 'cat-other'): void {
    this.init();
    // Reassign products of this category so data is never lost
    this.products.forEach(p => {
      if (p.categoryId === id) {
        p.categoryId = reassignToId;
      }
    });
    this.saveProducts(this.products);

    this.categories = this.categories.filter(c => c.id !== id);
    this.saveCategories(this.categories);
  }

  private saveCategories(categories: Category[]): void {
    this.categories = categories;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  // --- Invoices & Checkout ---
  public getInvoices(): Invoice[] {
    this.init();
    return [...this.invoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getInvoiceById(id: string): Invoice | undefined {
    this.init();
    return this.invoices.find(inv => inv.id === id);
  }

  public generateInvoiceNumber(): string {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const count = (this.invoices.length + 1).toString().padStart(4, '0');
    return `RTX-${y}${m}${d}-${count}`;
  }

  public completeCheckout(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): {
    success: boolean;
    invoice?: Invoice;
    error?: string;
  } {
    this.init();

    // 1. Validate total stock limits for tracked products across all line items
    const productQuantities: Record<string, number> = {};
    for (const item of invoiceData.items) {
      productQuantities[item.productId] = (productQuantities[item.productId] || 0) + item.quantity;
    }

    for (const [productId, neededQty] of Object.entries(productQuantities)) {
      const prod = this.getProductById(productId);
      if (prod && prod.stockTracking) {
        if (prod.stockQuantity < neededQty) {
          return {
            success: false,
            error: `الكمية المتاحة من المنتج (${prod.name}) غير كافية! المطلوب: ${neededQty}، المتاح حالياً: ${prod.stockQuantity} فقط.`
          };
        }
      }
    }

    const now = new Date().toISOString();
    const invoiceNumber = this.generateInvoiceNumber();
    const invoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      invoiceNumber,
      createdAt: now,
      status: 'completed'
    };

    // 2. Deduct inventory and record stock logs
    for (const item of invoice.items) {
      const prodIndex = this.products.findIndex(p => p.id === item.productId);
      if (prodIndex >= 0) {
        const prod = this.products[prodIndex];
        if (prod.stockTracking) {
          const newQty = Math.max(0, prod.stockQuantity - item.quantity);
          this.products[prodIndex].stockQuantity = newQty;

          // Remove serial number if sold
          if (prod.isSerialized && item.serialNumber && prod.serialNumbers) {
            this.products[prodIndex].serialNumbers = prod.serialNumbers.filter(
              s => s !== item.serialNumber
            );
          }

          this.addStockLog({
            id: `log-${Date.now()}-${item.productId}`,
            productId: item.productId,
            productName: item.name,
            type: 'sale',
            quantityChange: -item.quantity,
            newQuantity: newQty,
            reason: `فاتورة بيع رقم ${invoiceNumber}`,
            timestamp: now
          });
        }
      }
    }

    this.saveProducts(this.products);

    // 3. Save invoice
    this.invoices.unshift(invoice);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(this.invoices));

    return { success: true, invoice };
  }

  public cancelInvoice(invoiceId: string, restoreStock = true): { success: boolean; error?: string } {
    this.init();
    const invIndex = this.invoices.findIndex(inv => inv.id === invoiceId);
    if (invIndex < 0) return { success: false, error: 'الفاتورة غير موجودة' };

    const inv = this.invoices[invIndex];
    if (inv.status === 'cancelled') return { success: false, error: 'الفاتورة ملغاة بالفعل' };

    inv.status = 'cancelled';
    const now = new Date().toISOString();

    if (restoreStock) {
      for (const item of inv.items) {
        const prodIndex = this.products.findIndex(p => p.id === item.productId);
        if (prodIndex >= 0) {
          const prod = this.products[prodIndex];
          if (prod.stockTracking) {
            prod.stockQuantity += item.quantity;
            if (prod.isSerialized && item.serialNumber) {
              prod.serialNumbers = prod.serialNumbers || [];
              if (!prod.serialNumbers.includes(item.serialNumber)) {
                prod.serialNumbers.push(item.serialNumber);
              }
            }
            this.addStockLog({
              id: `log-restore-${Date.now()}-${item.productId}`,
              productId: item.productId,
              productName: item.name,
              type: 'cancel_restore',
              quantityChange: item.quantity,
              newQuantity: prod.stockQuantity,
              reason: `إلغاء الفاتورة ${inv.invoiceNumber} واسترجاع المخزون`,
              timestamp: now
            });
          }
        }
      }
      this.saveProducts(this.products);
    }

    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(this.invoices));
    return { success: true };
  }

  // --- Settings ---
  public getSettings(): StoreSettings {
    this.init();
    return { ...this.settings };
  }

  public saveSettings(newSettings: StoreSettings): void {
    this.settings = newSettings;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  }

  // --- Stock Logs ---
  public getStockLogs(): StockAdjustment[] {
    this.init();
    return [...this.stockLogs].reverse();
  }

  private addStockLog(log: StockAdjustment): void {
    this.stockLogs.push(log);
    // Keep max 200 logs
    if (this.stockLogs.length > 200) {
      this.stockLogs.splice(0, this.stockLogs.length - 200);
    }
    localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(this.stockLogs));
  }

  // --- Demo Data Controls ---
  public loadDemoData(): void {
    this.init();
    // Add demo products without overwriting non-demo ones
    const nonDemo = this.products.filter(p => !p.isDemo);
    this.products = [...INITIAL_DEMO_PRODUCTS, ...nonDemo];
    this.saveProducts(this.products);
    this.seedInitialInvoices();
  }

  public clearDemoData(): void {
    this.init();
    this.products = this.products.filter(p => !p.isDemo);
    this.invoices = this.invoices.filter(i => !i.isDemo);
    this.saveProducts(this.products);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(this.invoices));
  }

  public clearAllData(): void {
    this.products = [];
    this.invoices = [];
    this.stockLogs = [];
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.STOCK_LOGS);
  }

  private seedInitialInvoices(): void {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    const initialInvoices: Invoice[] = [
      {
        id: 'inv-init-1',
        invoiceNumber: 'RTX-261020-0001',
        createdAt: today.toISOString(),
        items: [
          {
            productId: 'demo-prod-7',
            name: 'ماوس ألعاب لاسلكي Logitech G PRO X SUPERLIGHT 2',
            brand: 'Logitech G',
            model: 'G-PXS2-BLK',
            sku: 'MS-LOGI-GPROX2',
            barcode: 'RTX1000107',
            unitPrice: 6800,
            quantity: 1,
            discount: 0,
            lineTotal: 6800,
            specsSummary: 'حساس HERO 2 / 60 جرام'
          },
          {
            productId: 'demo-prod-8',
            name: 'كابل HDMI 2.1 Ultra High Speed 8K 60Hz (2M)',
            brand: 'UGREEN',
            model: 'HD135',
            sku: 'CAB-UGR-HDMI21-2M',
            barcode: 'RTX1000108',
            unitPrice: 450,
            quantity: 2,
            discount: 50,
            lineTotal: 850,
            specsSummary: '48Gbps 8K eARC'
          }
        ],
        subtotal: 7700,
        discount: 50,
        total: 7650,
        amountReceived: 8000,
        changeToReturn: 350,
        paymentMethod: 'cash',
        customerName: 'كابتن أحمد سامي',
        customerPhone: '01122334455',
        cashierName: 'كاشير الفرع الرئيسي',
        notes: 'العميل استلم فاتورة ضريبية مختومة',
        status: 'completed',
        format: 'thermal80',
        isDemo: true
      },
      {
        id: 'inv-init-2',
        invoiceNumber: 'RTX-261020-0002',
        createdAt: yesterday.toISOString(),
        items: [
          {
            productId: 'demo-prod-6',
            name: 'كيبورد ميكانيكي Keychron Q1 Pro QMK/VIA',
            brand: 'Keychron',
            model: 'Q1 Pro Carbon Black',
            sku: 'KB-KEY-Q1PRO-RED',
            barcode: 'RTX1000106',
            unitPrice: 8900,
            quantity: 1,
            discount: 0,
            lineTotal: 8900,
            specsSummary: 'Keychron Red / 75% ألومنيوم'
          }
        ],
        subtotal: 8900,
        discount: 0,
        total: 8900,
        amountReceived: 8900,
        changeToReturn: 0,
        paymentMethod: 'card',
        customerName: 'المهندس كريم فاروق',
        customerPhone: '01099887766',
        cashierName: 'كاشير الفرع الرئيسي',
        notes: 'دفع بالفيزا',
        status: 'completed',
        format: 'thermal80',
        isDemo: true
      }
    ];

    this.invoices = initialInvoices;
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(this.invoices));
  }

  // --- Full Backup & Restore ---
  public exportBackup(): string {
    this.init();
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      store: this.settings.storeName,
      products: this.products,
      categories: this.categories,
      invoices: this.invoices,
      settings: this.settings,
      stockLogs: this.stockLogs
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importBackup(jsonString: string): { success: boolean; message: string; count?: number } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.products || !Array.isArray(data.products)) {
        return { success: false, message: 'ملف النسخة الاحتياطية غير صالح (مفقود مصفوفة المنتجات)' };
      }

      this.products = data.products;
      this.saveProducts(this.products);

      if (data.categories && Array.isArray(data.categories)) {
        this.categories = data.categories;
        this.saveCategories(this.categories);
      }

      if (data.invoices && Array.isArray(data.invoices)) {
        this.invoices = data.invoices;
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(this.invoices));
      }

      if (data.settings && typeof data.settings === 'object') {
        this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
        this.saveSettings(this.settings);
      }

      return {
        success: true,
        message: 'تمت استعادة البيانات بنجاح تام!',
        count: this.products.length
      };
    } catch (e: any) {
      return { success: false, message: `فشل استرجاع النسخة الاحتياطية: ${e?.message || 'خطأ غير متوقع'}` };
    }
  }
}

export const storage = new StorageService();
