import React, { useState, useRef, useEffect } from 'react';
import { Product, Category, InvoiceItem, Invoice, StoreSettings, AppUser } from '../types';
import { formatEGP } from '../utils/formatters';
import { sound } from '../services/sound';
import { storage } from '../services/storage';
import { CategoryIllustration } from '../components/CategoryIllustration';
import {
  Search,
  ScanLine,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
  ArrowRight,
  User,
  Phone,
  FileText,
  Keyboard,
  Sparkles,
  Printer
} from 'lucide-react';

interface CashierViewProps {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  currentUser?: AppUser;
  onCheckoutSuccess: (invoice: Invoice) => void;
  onScanUnknownBarcode?: (barcode: string) => void;
  scannedBarcodeEvent?: { code: string; timestamp: number } | null;
}

export const CashierView: React.FC<CashierViewProps> = ({
  products,
  categories,
  settings,
  currentUser,
  onCheckoutSuccess,
  onScanUnknownBarcode,
  scannedBarcodeEvent
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'other'>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [showCustomerFields, setShowCustomerFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notifications / Scanner feedback
  const [scanNotice, setScanNotice] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);

  // Focus search input on mount and F2
  useEffect(() => {
    searchInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F4') {
        if (cartItems.length > 0 && confirm('هل تريد تفريغ سلة الكاشير الحالية؟')) {
          setCartItems([]);
          setInvoiceDiscount(0);
          setAmountReceived('');
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isSubmitting]);

  // Handle global scanner scan events directly into the cart
  useEffect(() => {
    if (!scannedBarcodeEvent?.code) return;
    const foundProduct = storage.findProductByBarcode(scannedBarcodeEvent.code);
    if (foundProduct) {
      addProductToCart(foundProduct);
      sound.playScanSuccess();
      setScanNotice({
        type: 'success',
        message: `تم إضافة (${foundProduct.name}) إلى السلة بالمسح الضوئي`
      });
      setTimeout(() => setScanNotice(null), 3000);
    }
  }, [scannedBarcodeEvent]);

  // Barcode / Search Enter handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Direct exact barcode / SKU lookup
    const foundProduct = storage.findProductByBarcode(query);

    if (foundProduct) {
      addProductToCart(foundProduct);
      setSearchQuery('');
      sound.playScanSuccess();
      setScanNotice({
        type: 'success',
        message: `تم إضافة (${foundProduct.name}) إلى السلة بنجاح`
      });
      setTimeout(() => setScanNotice(null), 3000);
    } else {
      sound.playScanError();
      setScanNotice({
        type: 'warning',
        message: `الباركود (${query}) غير مسجل في المخزون!`
      });
      setTimeout(() => setScanNotice(null), 4000);
      if (onScanUnknownBarcode) {
        onScanUnknownBarcode(query);
      }
    }
  };

  // Add product to cart
  const addProductToCart = (product: Product, serialNumber?: string) => {
    // Check available stock
    if (product.stockTracking && product.stockQuantity <= 0) {
      sound.playScanError();
      alert(`المنتج (${product.name}) نافد من المخزون!`);
      return;
    }

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id);

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        // Serialized product check: can't sell multiple of same serial
        if (product.isSerialized) {
          alert('هذا الجهاز يملك رقماً تسلسلياً (Serial Number) ويتم بيعه كوحدة منفصلة.');
          return prev;
        }

        // Stock limit check
        if (product.stockTracking && existing.quantity >= product.stockQuantity) {
          alert(`لا يمكن إضافة المزيد! الكمية المتوفرة بالمخزون: ${product.stockQuantity} فقط.`);
          return prev;
        }

        const updated = [...prev];
        const newQty = existing.quantity + 1;
        const lineTotal = (existing.unitPrice - existing.discount) * newQty;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          lineTotal
        };
        return updated;
      }

      // Format specs summary for receipt
      const specsSummary = Object.entries(product.specs || {})
        .slice(0, 3)
        .map(([_, v]) => v)
        .join(' / ');

      const chosenSerial = serialNumber || (product.serialNumbers && product.serialNumbers[0]);

      const newItem: InvoiceItem = {
        productId: product.id,
        name: product.name,
        brand: product.brand,
        model: product.model,
        sku: product.sku,
        barcode: product.barcodeToUse === 'manufacturer' && product.manufacturerBarcode
          ? product.manufacturerBarcode
          : product.internalBarcode,
        serialNumber: product.isSerialized ? chosenSerial : undefined,
        unitPrice: product.price,
        quantity: 1,
        discount: 0,
        lineTotal: product.price,
        specsSummary,
        image: product.image
      };

      return [...prev, newItem];
    });
  };

  // Update item quantity
  const updateItemQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (prod && prod.stockTracking && newQty > prod.stockQuantity) {
      alert(`الكمية المتاحة في المخزون: ${prod.stockQuantity} فقط!`);
      return;
    }

    setCartItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const lineTotal = (item.unitPrice - item.discount) * newQty;
          return { ...item, quantity: newQty, lineTotal };
        }
        return item;
      })
    );
  };

  // Remove item
  const removeItem = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId));
  };

  // Filter products for Catalog Picker
  const filteredProducts = products.filter(p => {
    if (p.isArchived) return false;
    const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.internalBarcode.toLowerCase().includes(q) ||
      (p.manufacturerBarcode && p.manufacturerBarcode.toLowerCase().includes(q)) ||
      p.sku.toLowerCase().includes(q) ||
      Object.values(p.specs || {}).some(val => String(val).toLowerCase().includes(q));

    return matchCat && matchSearch;
  });

  // Totals calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = Math.max(0, subtotal - invoiceDiscount);
  const paid = parseFloat(amountReceived) || 0;
  const changeToReturn = paid > total ? paid - total : 0;
  const remainingDebt = paid < total ? total - paid : 0;

  // Checkout Execution
  const handleCheckout = () => {
    if (isSubmitting) return;

    if (cartItems.length === 0) {
      alert('سلة البيع فارغة! قم بمسح أو إضافة منتجات أولاً.');
      return;
    }

    setIsSubmitting(true);

    try {
      // For non-cash payment (card, bank transfer), amount received defaults to exact total
      const finalPaid = paymentMethod === 'cash'
        ? (amountReceived === '' ? total : paid)
        : total;

      const result = storage.completeCheckout({
        items: cartItems,
        subtotal,
        discount: invoiceDiscount,
        total,
        amountReceived: finalPaid,
        changeToReturn: finalPaid > total ? finalPaid - total : 0,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        cashierName: currentUser ? currentUser.displayName : settings.cashierDisplayName,
        cashierId: currentUser ? currentUser.id : undefined,
        notes: notes.trim() || undefined,
        format: settings.defaultReceiptFormat || 'thermal80',
        status: 'completed'
      });

      if (result.success && result.invoice) {
        sound.playCheckoutSuccess();
        onCheckoutSuccess(result.invoice);
        // Reset cart
        setCartItems([]);
        setInvoiceDiscount(0);
        setAmountReceived('');
        setCustomerName('');
        setCustomerPhone('');
        setNotes('');
        setShowCustomerFields(false);
        searchInputRef.current?.focus();
      } else {
        sound.playScanError();
        alert(result.error || 'فشل إتمام عملية البيع');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[680px]">
      {/* ================= RIGHT (RTL): POS CART & CHECKOUT (5 COLS) ================= */}
      <div className="lg:col-span-5 flex flex-col bg-[#12151e] border border-[#262c3d] rounded-2xl shadow-2xl overflow-hidden order-1 lg:order-2">
        {/* Cart Header */}
        <div className="p-4 bg-[#181d2a] border-b border-[#262c3d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#76b900]/20 text-[#76b900] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                سلة البيع الحالية
                <span className="text-xs bg-[#76b900] text-black font-black px-2 py-0.5 rounded-full font-mono">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              </h2>
            </div>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={() => {
                if (confirm('تفريغ السلة بالكامل؟')) {
                  setCartItems([]);
                  setInvoiceDiscount(0);
                }
              }}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
              title="تفريغ السلة (F4)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              تفريغ (F4)
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-[#202636]/60">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-slate-500 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-[#171b26] flex items-center justify-center mb-3 text-slate-600">
                <ScanLine className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-300">السلة فارغة حالياً</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                امسح باركود المنتج بالمسدس أو اضغط على أي جهاز من القائمة لإضافته للفاتورة مباشرة.
              </p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.productId} className="pt-2 first:pt-0 flex items-start gap-3">
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-[#1a1f2c] border border-[#283045] flex items-center justify-center overflow-hidden shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Layers className="w-5 h-5 text-slate-500" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate leading-snug">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {item.barcode} {item.model && `• ${item.model}`}
                  </div>
                  {item.serialNumber && (
                    <div className="text-[10px] text-[#76b900] font-mono font-bold">
                      S/N: {item.serialNumber}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-1.5">
                    {/* Quantity controls */}
                    <div className="flex items-center bg-[#171c28] rounded-lg border border-[#2b3447] overflow-hidden">
                      <button
                        onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:bg-white/10 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:bg-white/10 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Price & Remove */}
                    <div className="flex items-center gap-2">
                      <div className="text-left font-mono">
                        <div className="text-xs font-black text-[#76b900]">
                          {formatEGP(item.lineTotal)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[9px] text-slate-500">
                            {formatEGP(item.unitPrice)} / وحدة
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Notes Collapsible */}
        <div className="px-4 py-2 bg-[#161a25] border-t border-[#262c3d]">
          <button
            type="button"
            onClick={() => setShowCustomerFields(!showCustomerFields)}
            className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-[#76b900]" />
              بيانات العميل والملاحظات (اختياري)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {showCustomerFields ? '▲ إخفاء' : '▼ إظهار'}
            </span>
          </button>

          {showCustomerFields && (
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#262c3d]">
              <div>
                <input
                  type="text"
                  placeholder="اسم العميل..."
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-lg px-2.5 py-1.5 focus:border-[#76b900] focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="رقم الهاتف..."
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-lg px-2.5 py-1.5 focus:border-[#76b900] focus:outline-none font-mono"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="ملاحظات تظهر بالفاتورة..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-lg px-2.5 py-1.5 focus:border-[#76b900] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Payment & Calculations Footer */}
        <div className="p-4 bg-[#141824] border-t border-[#262c3d] space-y-3">
          {/* Subtotal & Discount */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>المجموع الفرعي:</span>
              <span className="font-mono font-bold text-white">{formatEGP(subtotal)}</span>
            </div>
            {settings.enableDiscounts && (
              <div className="flex items-center justify-between text-slate-400">
                <span>خصم إضافي بالفاتورة:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={invoiceDiscount || ''}
                    onChange={e => setInvoiceDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-lg px-2 py-0.5 text-left font-mono focus:border-[#76b900] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">ج.م</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-[#262c3d]">
              <span className="text-sm font-bold text-white">إجمالي الفاتورة:</span>
              <span className="text-xl font-black font-mono text-[#76b900]">
                {formatEGP(total)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'cash', label: 'نقدي', icon: Banknote },
                { id: 'card', label: 'فيزا', icon: CreditCard },
                { id: 'bank_transfer', label: 'انستاباي', icon: Smartphone },
                { id: 'other', label: 'أخرى', icon: Layers }
              ].map(pm => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                      paymentMethod === pm.id
                        ? 'bg-[#76b900]/20 border-[#76b900] text-[#76b900]'
                        : 'bg-[#0d1017] border-[#252c3e] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount received & Egyptian Cash Quick Buttons (if cash) */}
          {paymentMethod === 'cash' && (
            <div className="space-y-2 bg-[#0d1017] p-2.5 rounded-xl border border-[#22283a]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">المبلغ المستلم من العميل:</span>
                <input
                  type="number"
                  placeholder={total.toString()}
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  className="w-28 bg-[#171b26] border border-[#2e374d] text-white text-xs rounded-lg px-2.5 py-1 text-left font-mono font-bold focus:border-[#76b900] focus:outline-none"
                />
              </div>

              {/* Quick EGP Bills */}
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[10px] text-slate-500">فئات سريعة:</span>
                {[50, 100, 200, 500].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(amountReceived) || 0;
                      setAmountReceived((cur + val).toString());
                    }}
                    className="px-2 py-0.5 bg-[#1a1f2d] hover:bg-[#252c40] text-slate-300 text-[10px] font-mono rounded border border-[#2c354a]"
                  >
                    +{val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmountReceived(total.toString())}
                  className="px-2 py-0.5 bg-[#76b900]/20 text-[#76b900] text-[10px] font-bold rounded border border-[#76b900]/30"
                >
                  المبلغ بالضبط
                </button>
              </div>

              {/* Change to return */}
              {changeToReturn > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-400 pt-1 border-t border-[#22283a]">
                  <span>المتبقي للعميل (فكة):</span>
                  <span className="font-mono text-sm">{formatEGP(changeToReturn)}</span>
                </div>
              )}
              {remainingDebt > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-amber-400 pt-1 border-t border-[#22283a]">
                  <span>المبلغ الناقص:</span>
                  <span className="font-mono text-sm">{formatEGP(remainingDebt)}</span>
                </div>
              )}
            </div>
          )}

          {/* Primary Action Button */}
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isSubmitting}
            className="w-full py-3.5 bg-[#76b900] hover:bg-[#88d400] disabled:opacity-40 disabled:pointer-events-none text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-[#76b900]/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {isSubmitting ? 'جاري تسجيل الفاتورة والطباعة...' : 'إتمام البيع والطباعة (F9)'}
          </button>
        </div>
      </div>

      {/* ================= LEFT (RTL): PRODUCT SEARCH, SCANNER & QUICK PICK (7 COLS) ================= */}
      <div className="lg:col-span-7 flex flex-col bg-[#12151e] border border-[#262c3d] rounded-2xl shadow-2xl overflow-hidden order-2 lg:order-1">
        {/* Top Scanner & Search Bar */}
        <div className="p-4 bg-[#181d2a] border-b border-[#262c3d] space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="امسح الباركود بالمسدس الآن، أو ابحث بالاسم والموديل والمواصفات... (F2)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d1017] border-2 border-[#2b344a] focus:border-[#76b900] text-white text-xs sm:text-sm rounded-xl pr-10 pl-4 py-2.5 focus:outline-none font-medium placeholder:text-slate-500 shadow-inner"
              />
              <ScanLine className="w-5 h-5 text-[#76b900] absolute right-3 top-3 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              بحث
            </button>
          </form>

          {/* Fast Scan Notification Banner */}
          {scanNotice && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 transition-all ${
                scanNotice.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
              }`}
            >
              {scanNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#76b900] shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="font-semibold">{scanNotice.message}</span>
            </div>
          )}

          {/* Category Horizontal Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#76b900] text-black shadow-sm'
                  : 'bg-[#0d1017] text-slate-400 hover:text-white border border-[#272f44]'
              }`}
            >
              الكل ({products.filter(p => !p.isArchived).length})
            </button>
            {categories.map(cat => {
              const count = products.filter(p => p.categoryId === cat.id && !p.isArchived).length;
              if (count === 0 && selectedCategory !== cat.id) return null;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#76b900] text-black shadow-sm'
                      : 'bg-[#0d1017] text-slate-400 hover:text-white border border-[#272f44]'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
              <Search className="w-10 h-10 stroke-1 mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-400">لا توجد منتجات مطابقة للبحث</p>
              <p className="text-xs text-slate-600 mt-1">تأكد من كتابة الاسم أو الباركود بشكل صحيح</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stockTracking && product.stockQuantity <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addProductToCart(product)}
                    className={`bg-[#151924] border border-[#262c3e] hover:border-[#76b900]/70 rounded-xl p-3 flex flex-col justify-between transition-all group cursor-pointer relative shadow-sm hover:shadow-lg hover:shadow-[#76b900]/5 ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Top row: Brand & Condition badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {product.brand}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          product.condition === 'new'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : product.condition === 'renewed'
                            ? 'bg-blue-950 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {product.condition === 'new'
                          ? 'جديد'
                          : product.condition === 'renewed'
                          ? 'مجدد'
                          : 'مستعمل'}
                      </span>
                    </div>

                    {/* Product Image & Name */}
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="w-14 h-14 rounded-lg bg-[#0d1017] border border-[#262c3e] flex items-center justify-center overflow-hidden shrink-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <CategoryIllustration categoryId={product.categoryId} size={40} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-[#76b900] transition-colors line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {product.internalBarcode}
                        </div>
                      </div>
                    </div>

                    {/* Key Specs snippet */}
                    {product.specs && Object.keys(product.specs).length > 0 && (
                      <div className="text-[10px] text-slate-400 bg-[#0d1017] p-1.5 rounded-lg mb-2 font-mono truncate border border-[#1e2333]">
                        {Object.values(product.specs)[0]}
                      </div>
                    )}

                    {/* Bottom row: Price & Stock */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#232838]">
                      <div>
                        <div className="text-xs font-black font-mono text-[#76b900]">
                          {formatEGP(product.price)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {product.stockTracking ? (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                              product.stockQuantity <= (product.minStockAlert || 1)
                                ? 'bg-red-950 text-red-400 border border-red-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            مخزون: {product.stockQuantity}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">متوفر</span>
                        )}

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          className="w-7 h-7 rounded-lg bg-[#76b900]/20 hover:bg-[#76b900] text-[#76b900] hover:text-black flex items-center justify-center transition-colors font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
