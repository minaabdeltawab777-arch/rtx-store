import React, { useState, useEffect } from 'react';
import { Product, Category, Invoice, StoreSettings, ActiveTab, AppUser, CloudSyncStatus } from './types';
import { storage, DEFAULT_SETTINGS } from './services/storage';
import { cloudService } from './services/supabase';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { sound } from './services/sound';
import { formatTimeOnly } from './utils/formatters';

// Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { CashierView } from './views/CashierView';
import { ProductsView } from './views/ProductsView';
import { LabelPrintingView } from './views/LabelPrintingView';
import { InvoicesView } from './views/InvoicesView';
import { DailySalesView } from './views/DailySalesView';
import { UsersManagementView } from './views/UsersManagementView';
import { SettingsView } from './views/SettingsView';

// Modals
import { ReceiptModal } from './components/ReceiptModal';
import { ProductFormModal } from './components/ProductFormModal';
import { OnboardingModal } from './components/OnboardingModal';
import { LinkBarcodeModal } from './components/LinkBarcodeModal';
import { InitialAdminSetupModal } from './components/InitialAdminSetupModal';
import { CloudSyncSettingsModal } from './components/CloudSyncSettingsModal';

// Icons
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Printer,
  FileText,
  TrendingUp,
  Settings,
  ScanLine,
  Zap,
  Clock,
  User,
  Users,
  Menu,
  X,
  LogOut,
  Cloud,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(cloudService.getLocalSession());
  const [activeTab, setActiveTab] = useState<ActiveTab>('cashier');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(cloudService.getSyncStatus());

  // Active modals
  const [activeReceipt, setActiveReceipt] = useState<Invoice | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [bulkLabelProduct, setBulkLabelProduct] = useState<Product | null>(null);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isInitialAdminSetupOpen, setIsInitialAdminSetupOpen] = useState(false);

  // Live Cairo Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Subscribe to cloud sync status
    const unsub = cloudService.subscribe(setSyncStatus);

    // Refresh storage data
    refreshAllData();

    // Clock ticker
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const refreshAllData = () => {
    storage.init();
    const prods = storage.getProducts();
    const cats = storage.getCategories();
    const invs = storage.getInvoices();
    const sets = storage.getSettings();

    setProducts(prods);
    setCategories(cats);
    setInvoices(invs);
    setSettings(sets);

    if (prods.length === 0) {
      setShowOnboarding(true);
    }
  };

  const handleLogout = async () => {
    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من النظام؟')) {
      await cloudService.logout();
      setCurrentUser(null);
    }
  };

  const [scannedBarcode, setScannedBarcode] = useState<{ code: string; timestamp: number } | null>(null);

  // Global USB Barcode Scanner Hook
  useBarcodeScanner({
    enabled: Boolean(currentUser),
    playSound: settings.scannerAudioFeedback ?? true,
    onScan: (scannedCode) => {
      const product = storage.findProductByBarcode(scannedCode);

      if (product) {
        sound.playScanSuccess();
        setScannedBarcode({ code: scannedCode, timestamp: Date.now() });
        if (activeTab !== 'cashier') {
          setActiveTab('cashier');
        }
      } else {
        sound.playScanError();
        setUnknownBarcode(scannedCode);
      }
    }
  });

  // If no user is logged in, show professional Arabic Login Screen
  if (!currentUser) {
    return (
      <>
        <LoginView
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab('cashier');
            refreshAllData();
          }}
          onOpenInitialSetup={() => setIsInitialAdminSetupOpen(true)}
          onOpenCloudConfig={() => setIsCloudModalOpen(true)}
        />

        <InitialAdminSetupModal
          isOpen={isInitialAdminSetupOpen}
          onClose={() => setIsInitialAdminSetupOpen(false)}
          onSuccess={(admin) => {
            setCurrentUser(admin);
            setActiveTab('cashier');
            refreshAllData();
          }}
        />

        <CloudSyncSettingsModal
          isOpen={isCloudModalOpen}
          onClose={() => setIsCloudModalOpen(false)}
          onRefreshLocalData={refreshAllData}
        />
      </>
    );
  }

  // Navigation Items with RBAC Role & Permission Gates
  const isSuperAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';
  const perms = currentUser.permissions;

  const ALL_NAV_ITEMS: Array<{
    id: ActiveTab;
    label: string;
    icon: any;
    hotkey?: string;
    badge?: number;
    allowed: boolean;
  }> = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      allowed: isSuperAdmin || Boolean(perms?.canViewReports)
    },
    {
      id: 'cashier',
      label: 'الكاشير',
      icon: ShoppingCart,
      hotkey: 'F2',
      allowed: true
    },
    {
      id: 'products',
      label: 'المنتجات والمخزون',
      icon: Package,
      badge: products.length,
      allowed: isSuperAdmin || Boolean(perms?.canManageProducts)
    },
    {
      id: 'labels',
      label: 'الباركود وطباعة الاستيكرات',
      icon: Printer,
      allowed: isSuperAdmin || Boolean(perms?.canPrintLabels)
    },
    {
      id: 'invoices',
      label: 'الفواتير السابقة',
      icon: FileText,
      badge: invoices.length,
      allowed: true
    },
    {
      id: 'daily_sales',
      label: 'مبيعات اليوم',
      icon: TrendingUp,
      allowed: isSuperAdmin || Boolean(perms?.canViewReports)
    },
    {
      id: 'users',
      label: 'إدارة المستخدمين',
      icon: Users,
      allowed: isSuperAdmin || Boolean(perms?.canManageUsers)
    },
    {
      id: 'settings',
      label: 'الإعدادات والسحابة',
      icon: Settings,
      allowed: isSuperAdmin
    }
  ];

  const visibleNavItems = ALL_NAV_ITEMS.filter(item => item.allowed);

  return (
    <div className="min-h-screen bg-[#0a0c11] text-slate-100 flex flex-col font-['Cairo',sans-serif] selection:bg-[#76b900]/30 selection:text-white">
      {/* ================= TOP APPLICATION HEADER ================= */}
      <header className="no-print bg-[#10131b] border-b border-[#212635] sticky top-0 z-40 px-4 sm:px-6 py-2.5 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white bg-[#161a25] rounded-xl border border-[#272e42]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => setActiveTab('cashier')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#76b900] to-[#4e7d00] text-black flex items-center justify-center font-black text-lg shadow-lg shadow-[#76b900]/25 group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6 fill-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-wider text-white font-mono">
                    RTX <span className="text-[#76b900]">STORE</span>
                  </span>
                  <span className="text-[10px] bg-[#76b900]/20 text-[#76b900] font-black px-2 py-0.5 rounded-full border border-[#76b900]/30 uppercase font-mono">
                    POS PRO
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {settings.storeTagline || 'مركز أجهزة الجيمنج واللابتوب والمحترفين'}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Live USB Barcode Scanner Status & Cloud Status */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#161a25] px-3.5 py-1.5 rounded-full border border-[#272f44]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#76b900] animate-pulse" />
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ScanLine className="w-3.5 h-3.5 text-[#76b900]" />
                مسدس USB: <span className="text-[#76b900]">متصل</span>
              </span>
            </div>

            {/* Cloud Sync Status Indicator */}
            <button
              onClick={() => setIsCloudModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                syncStatus.isConnected
                  ? 'bg-green-950/40 border-green-800 text-green-300 hover:bg-green-950/60'
                  : syncStatus.isConfigured
                  ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-950/60'
                  : 'bg-[#161a25] border-[#272f44] text-slate-400 hover:bg-[#1e2330]'
              }`}
              title="إعدادات ومزامنة السحابة"
            >
              <Cloud
                className={`w-3.5 h-3.5 ${
                  syncStatus.isConnected
                    ? 'text-green-400'
                    : syncStatus.isConfigured
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              />
              <span>
                {syncStatus.isConnected
                  ? 'السحابة متزامنة'
                  : syncStatus.isConfigured
                  ? 'جاري التحقق من السحابة'
                  : 'وضع محلي'}
              </span>
            </button>
          </div>

          {/* Right: Cairo Clock, Cashier User Chip & Logout */}
          <div className="flex items-center gap-3">
            {/* Clock */}
            <div className="hidden sm:flex items-center gap-2 bg-[#161a25] px-3 py-1.5 rounded-xl border border-[#272f44] text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-[#76b900]" />
              <span>{formatTimeOnly(currentTime.toISOString())}</span>
              <span className="text-slate-500">• القاهرة</span>
            </div>

            {/* User Account Chip */}
            <div className="flex items-center gap-2 bg-[#161a25] px-3 py-1 rounded-xl border border-[#272f44]">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  currentUser.role === 'owner'
                    ? 'bg-amber-500/20 text-amber-400'
                    : currentUser.role === 'admin'
                    ? 'bg-[#76b900]/20 text-[#76b900]'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                <User className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold text-white truncate max-w-[120px]">
                  {currentUser.displayName}
                </div>
                <div className="text-[9px] text-[#76b900] font-mono">
                  {currentUser.role === 'owner'
                    ? 'المالك'
                    : currentUser.role === 'admin'
                    ? 'مدير فرع'
                    : 'كاشير'}
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-[#202738] transition-colors cursor-pointer mr-1"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="no-print lg:hidden bg-[#0d1017] border-b border-[#252c3e] p-3 space-y-1 shadow-2xl z-40 sticky top-[61px]">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#76b900] text-black shadow-lg shadow-[#76b900]/20'
                    : 'text-slate-300 hover:bg-[#161a25]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? 'bg-black text-[#76b900]' : 'bg-[#1e2330] text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ================= SECONDARY NAVIGATION BAR (DESKTOP) ================= */}
      <nav className="no-print hidden lg:flex bg-[#0d1017] border-b border-[#1f2433] px-6 py-2 gap-1.5 shadow-inner">
        {visibleNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-[#181e2b] text-[#76b900] border border-[#76b900]/30 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#131722]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#76b900]' : 'text-slate-400'}`} />
              <span>{item.label}</span>

              {item.hotkey && (
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded font-mono border border-slate-700">
                  {item.hotkey}
                </span>
              )}

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-[#76b900] text-black' : 'bg-[#1b202c] text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#76b900] rounded-t-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ================= MAIN APPLICATION CONTENT ================= */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1700px] w-full mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            invoices={invoices}
            settings={settings}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenProductForm={() => {
              setProductToEdit(null);
              setIsProductFormOpen(true);
            }}
            onSelectInvoice={(inv) => setActiveReceipt(inv)}
          />
        )}

        {activeTab === 'cashier' && (
          <CashierView
            products={products}
            categories={categories}
            settings={settings}
            currentUser={currentUser}
            onCheckoutSuccess={(invoice) => {
              refreshAllData();
              setActiveReceipt(invoice);
            }}
            scannedBarcodeEvent={scannedBarcode}
            onScanUnknownBarcode={(code) => setUnknownBarcode(code)}
          />
        )}

        {activeTab === 'products' && (
          <ProductsView
            products={products}
            categories={categories}
            settings={settings}
            onRefreshData={refreshAllData}
            onOpenBulkLabels={(prod) => {
              setBulkLabelProduct(prod);
              setActiveTab('labels');
            }}
          />
        )}

        {activeTab === 'labels' && (
          <LabelPrintingView
            products={products}
            settings={settings}
            onUpdateSettings={(newSets) => {
              setSettings(newSets);
              refreshAllData();
            }}
            preselectedProduct={bulkLabelProduct}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesView
            invoices={invoices}
            settings={settings}
            currentUser={currentUser}
            onRefreshData={refreshAllData}
          />
        )}

        {activeTab === 'daily_sales' && (
          <DailySalesView
            invoices={invoices}
            settings={settings}
          />
        )}

        {activeTab === 'users' && (
          <UsersManagementView currentUser={currentUser} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newSets) => {
              setSettings(newSets);
              refreshAllData();
            }}
            onRefreshData={refreshAllData}
            onOpenCloudModal={() => setIsCloudModalOpen(true)}
          />
        )}
      </main>

      {/* ================= GLOBAL MODALS ================= */}

      {/* 1. Completed Invoice & Thermal Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          invoice={activeReceipt}
          settings={settings}
          isOpen={Boolean(activeReceipt)}
          onClose={() => setActiveReceipt(null)}
          onNewSale={() => {
            setActiveReceipt(null);
            setActiveTab('cashier');
          }}
        />
      )}

      {/* 2. Add / Edit Product Modal */}
      {isProductFormOpen && (
        <ProductFormModal
          isOpen={isProductFormOpen}
          onClose={() => {
            setIsProductFormOpen(false);
            setProductToEdit(null);
          }}
          onSave={() => refreshAllData()}
          productToEdit={productToEdit}
          categories={categories}
        />
      )}

      {/* 3. First Run Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onAddFirstProduct={() => {
          setShowOnboarding(false);
          setIsProductFormOpen(true);
        }}
        onLoadDemoData={() => {
          storage.loadDemoData();
          refreshAllData();
          setShowOnboarding(false);
        }}
        onGoToSettings={() => {
          setShowOnboarding(false);
          setActiveTab('settings');
        }}
        onGoToLabels={() => {
          setShowOnboarding(false);
          setActiveTab('labels');
        }}
        onClose={() => setShowOnboarding(false)}
      />

      {/* 4. Link Unknown Barcode Modal */}
      {unknownBarcode && (
        <LinkBarcodeModal
          barcode={unknownBarcode}
          isOpen={Boolean(unknownBarcode)}
          onClose={() => setUnknownBarcode(null)}
          products={products}
          onLinkedSuccess={(updated) => {
            refreshAllData();
            sound.playScanSuccess();
          }}
          onCreateNewWithBarcode={(code) => {
            setProductToEdit({
              id: '',
              name: '',
              brand: '',
              model: '',
              categoryId: categories[0]?.id || 'cat-laptops',
              sku: `SKU-${Date.now().toString().slice(-6)}`,
              internalBarcode: code,
              barcodeToUse: 'internal',
              price: 0,
              condition: 'new',
              stockTracking: true,
              stockQuantity: 1,
              specs: {},
              customSpecs: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            setIsProductFormOpen(true);
          }}
        />
      )}

      {/* 5. Cloud Synchronization & Migration Modal */}
      <CloudSyncSettingsModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        onRefreshLocalData={refreshAllData}
      />
    </div>
  );
}
