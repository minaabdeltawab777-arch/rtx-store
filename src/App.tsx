import React, { useState, useEffect } from 'react';
import { Product, Category, Invoice, StoreSettings, ActiveTab } from './types';
import { storage, DEFAULT_SETTINGS } from './services/storage';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { sound } from './services/sound';
import { formatTimeOnly, formatDateShort } from './utils/formatters';

// Views
import { DashboardView } from './views/DashboardView';
import { CashierView } from './views/CashierView';
import { ProductsView } from './views/ProductsView';
import { LabelPrintingView } from './views/LabelPrintingView';
import { InvoicesView } from './views/InvoicesView';
import { DailySalesView } from './views/DailySalesView';
import { SettingsView } from './views/SettingsView';

// Modals
import { ReceiptModal } from './components/ReceiptModal';
import { ProductFormModal } from './components/ProductFormModal';
import { OnboardingModal } from './components/OnboardingModal';
import { LinkBarcodeModal } from './components/LinkBarcodeModal';

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
  Cpu,
  Clock,
  User,
  Sparkles,
  Layers,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('cashier');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  // Active modals
  const [activeReceipt, setActiveReceipt] = useState<Invoice | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [bulkLabelProduct, setBulkLabelProduct] = useState<Product | null>(null);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Cairo Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Refresh storage data
    refreshAllData();

    // Clock ticker
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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

    // If no products, prompt onboarding
    if (prods.length === 0) {
      setShowOnboarding(true);
    }
  };

  const [scannedBarcode, setScannedBarcode] = useState<{ code: string; timestamp: number } | null>(null);

  // Global USB Barcode Scanner Hook
  useBarcodeScanner({
    enabled: true,
    playSound: settings.scannerAudioFeedback ?? true,
    onScan: (scannedCode) => {
      // Find matching product
      const product = storage.findProductByBarcode(scannedCode);

      if (product) {
        sound.playScanSuccess();
        setScannedBarcode({ code: scannedCode, timestamp: Date.now() });
        if (activeTab !== 'cashier') {
          setActiveTab('cashier');
        }
      } else {
        // Unknown barcode scanned
        sound.playScanError();
        setUnknownBarcode(scannedCode);
      }
    }
  });

  // Navigation Items (Arabic-first)
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'cashier', label: 'الكاشير', icon: ShoppingCart, hotkey: 'F2' },
    { id: 'products', label: 'المنتجات والمخزون', icon: Package, badge: products.length },
    { id: 'labels', label: 'الباركود وطباعة الاستيكرات', icon: Printer },
    { id: 'invoices', label: 'الفواتير السابقة', icon: FileText, badge: invoices.length },
    { id: 'daily_sales', label: 'مبيعات اليوم', icon: TrendingUp },
    { id: 'settings', label: 'الإعدادات والنسخ الاحتياطي', icon: Settings }
  ];

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

          {/* Center: Live USB Barcode Scanner Status */}
          <div className="hidden md:flex items-center gap-2 bg-[#161a25] px-3.5 py-1.5 rounded-full border border-[#272f44]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#76b900] animate-pulse" />
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ScanLine className="w-3.5 h-3.5 text-[#76b900]" />
              مسدس الباركود USB: <span className="text-[#76b900]">متصل وجاهز للعمل</span>
            </span>
          </div>

          {/* Right: Cashier, Clock & Hotkeys */}
          <div className="flex items-center gap-3">
            {/* Clock */}
            <div className="hidden sm:flex items-center gap-2 bg-[#161a25] px-3 py-1.5 rounded-xl border border-[#272f44] text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-[#76b900]" />
              <span>{formatTimeOnly(currentTime.toISOString())}</span>
              <span className="text-slate-500">• القاهرة</span>
            </div>

            {/* Cashier Badge */}
            <div className="flex items-center gap-2 bg-[#161a25] px-3 py-1.5 rounded-xl border border-[#272f44]">
              <div className="w-6 h-6 rounded-lg bg-[#76b900]/20 text-[#76b900] flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold text-white truncate max-w-[130px]">
                  {settings.cashierDisplayName || 'كاشير الفرع الرئيسي'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="no-print lg:hidden bg-[#0d1017] border-b border-[#252c3e] p-3 space-y-1 shadow-2xl z-40 sticky top-[61px]">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-[#76b900] text-black font-black'
                    : 'text-slate-300 hover:bg-[#161a25]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-mono font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ================= MAIN NAVIGATION BAR ================= */}
      <nav className="no-print bg-[#0f121a] border-b border-[#1f2533] px-4 sm:px-6 overflow-x-auto scrollbar-none sticky top-[61px] z-30">
        <div className="flex items-center gap-1 sm:gap-2 py-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  setMobileMenuOpen(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#76b900] text-black shadow-lg shadow-[#76b900]/20 font-black'
                    : 'text-slate-400 hover:text-white hover:bg-[#181d29]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.hotkey && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isActive ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.hotkey}
                  </span>
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-black text-[#76b900]' : 'bg-[#212838] text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ================= VIEW CONTAINER ================= */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1700px] w-full mx-auto">
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
            scannedBarcodeEvent={scannedBarcode}
            onCheckoutSuccess={(inv) => {
              refreshAllData();
              setActiveReceipt(inv);
            }}
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
            onRefreshData={refreshAllData}
          />
        )}

        {activeTab === 'daily_sales' && (
          <DailySalesView
            invoices={invoices}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newSets) => {
              setSettings(newSets);
              refreshAllData();
            }}
            onRefreshData={refreshAllData}
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
    </div>
  );
}
