import React, { useState } from 'react';
import { Product, StoreSettings } from '../types';
import { PhoneBoxLabel, PhoneBoxTemplateType } from '../components/PhoneBoxLabel';
import { formatEGP } from '../utils/formatters';
import {
  Printer,
  Sliders,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle,
  HelpCircle,
  ScanLine,
  Maximize2,
  Box,
  Layers,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface LabelPrintingViewProps {
  products: Product[];
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  preselectedProduct?: Product | null;
}

interface PrintQueueItem {
  product: Product;
  quantity: number;
  selectedSerial?: string;
}

export const LabelPrintingView: React.FC<LabelPrintingViewProps> = ({
  products,
  settings,
  onUpdateSettings,
  preselectedProduct
}) => {
  // Label size presets (mm)
  const PRESETS: Record<string, { w: number; h: number; label: string }> = {
    '40x25': { w: 40, h: 25, label: '40 × 25 مم (استيكر مدمج / إكسسوارات)' },
    '50x25': { w: 50, h: 25, label: '50 × 25 مم (مقاس حراري شائع)' },
    '50x30': { w: 50, h: 30, label: '50 × 30 مم (قياسي / نمط علب الهواتف الموصى به)' },
    '60x40': { w: 60, h: 40, label: '60 × 40 مم (استيكر كبير للابتوبات والقطع)' },
    '70x50': { w: 70, h: 50, label: '70 × 50 مم (استيكر واسع شامل المواصفات الكاملة)' },
    'custom': { w: settings.customLabelWidthMm || 50, h: settings.customLabelHeightMm || 30, label: 'مقاس مخصص بالمليمتر' }
  };

  const [preset, setPreset] = useState<string>(settings.defaultLabelPreset || '50x30');
  const [customW, setCustomW] = useState<number>(settings.customLabelWidthMm || 50);
  const [customH, setCustomH] = useState<number>(settings.customLabelHeightMm || 30);
  const [template, setTemplate] = useState<PhoneBoxTemplateType>(
    (settings.labelTemplate as PhoneBoxTemplateType) || 'phone_box'
  );

  // Layout & Visibility toggles
  const [showStoreName, setShowStoreName] = useState<boolean>(settings.labelShowStoreName ?? true);
  const [showPrice, setShowPrice] = useState<boolean>(settings.labelShowPrice ?? true);
  const [showSku, setShowSku] = useState<boolean>(settings.labelShowSku ?? true);
  const [showModel, setShowModel] = useState<boolean>(settings.labelShowModel ?? true);
  const [showSpecs, setShowSpecs] = useState<boolean>(settings.labelShowSpecs ?? true);
  const [showWarranty, setShowWarranty] = useState<boolean>(settings.labelShowWarranty ?? true);
  const [showSerial, setShowSerial] = useState<boolean>(settings.labelShowSerial ?? true);
  const [showBarcodeText, setShowBarcodeText] = useState<boolean>(settings.labelShowBarcodeText ?? true);
  const [showQR, setShowQR] = useState<boolean>(settings.labelShowQR ?? false);
  const [columns, setColumns] = useState<number>(settings.labelSheetColumns || 1);

  // Queue of products to print
  const [queue, setQueue] = useState<PrintQueueItem[]>(() => {
    if (preselectedProduct) {
      return [{ product: preselectedProduct, quantity: 1 }];
    }
    return products.slice(0, 3).map(p => ({ product: p, quantity: 2 }));
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [testScannedCode, setTestScannedCode] = useState('');
  const [testScanResult, setTestScanResult] = useState<Product | null>(null);

  // Current dimensions in mm
  const activeWidth = preset === 'custom' ? customW : PRESETS[preset]?.w || 50;
  const activeHeight = preset === 'custom' ? customH : PRESETS[preset]?.h || 30;

  // Filter products for adding to queue
  const searchResults = searchQuery.trim()
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.internalBarcode.includes(searchQuery.trim()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  const addToQueue = (product: Product, quantity = 1) => {
    setQueue(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setSearchQuery('');
  };

  const updateQuantity = (productId: string, qty: number) => {
    const validQty = Math.max(1, Math.min(200, qty));
    setQueue(prev =>
      prev.map(item => (item.product.id === productId ? { ...item, quantity: validQty } : item))
    );
  };

  const removeFromQueue = (productId: string) => {
    setQueue(prev => prev.filter(item => item.product.id !== productId));
  };

  const totalLabelsCount = queue.reduce((sum, item) => sum + item.quantity, 0);

  // Build flattened array of labels to render in print view
  const flattenedLabels: { product: Product; index: number; serial?: string }[] = [];
  queue.forEach(item => {
    for (let i = 0; i < item.quantity; i++) {
      const serial = item.product.serialNumbers && item.product.serialNumbers[i]
        ? item.product.serialNumbers[i]
        : undefined;
      flattenedLabels.push({
        product: item.product,
        index: i,
        serial
      });
    }
  });

  const handlePrint = () => {
    if (flattenedLabels.length === 0) {
      alert('برجاء إضافة منتجات لقائمة الطباعة أولاً');
      return;
    }
    window.print();
  };

  const handleTestScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testScannedCode.trim()) return;
    const found = products.find(
      p =>
        p.internalBarcode === testScannedCode.trim() ||
        p.manufacturerBarcode === testScannedCode.trim() ||
        p.sku === testScannedCode.trim() ||
        (p.serialNumbers && p.serialNumbers.includes(testScannedCode.trim()))
    );
    setTestScanResult(found || null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="no-print bg-[#131722] border-2 border-[#262c3e] rounded-3xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center font-bold shadow-lg shadow-[#76b900]/10">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                مركز طباعة استيكرات الباركود — نمط علب الأجهزة الاحترافي
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                تصميم ملصق عالي التباين مستوحى من علب الهواتف الذكية مع باركود Code 128 حقيقي ومواصفات مرتبة
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right pl-3 border-l border-slate-700/60 hidden sm:block">
            <div className="text-xs text-slate-400">إجمالي ملصقات الدفعة:</div>
            <div className="text-lg font-black font-mono text-[#76b900]">
              {totalLabelsCount} ملصق
            </div>
          </div>
          <button
            onClick={handlePrint}
            disabled={totalLabelsCount === 0}
            className="px-6 py-3 bg-[#76b900] hover:bg-[#88d400] disabled:opacity-40 disabled:pointer-events-none text-black font-black text-sm rounded-2xl flex items-center gap-2 shadow-xl shadow-[#76b900]/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            طباعة الاستيكرات الآن
          </button>
        </div>
      </div>

      {/* Main Grid: Controls & Queue (Left) vs Real-Time Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Left Column: Settings and Queue (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Label Dimensions & Settings Card */}
          <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#76b900]" />
              إعدادات تصميم ومقاس الاستيكر
            </h3>

            {/* Template Selector */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                نمط تخطيط الاستيكر (Phone Box Layout):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTemplate('phone_box')}
                  className={`p-2 rounded-xl border text-right transition-all cursor-pointer ${
                    template === 'phone_box'
                      ? 'bg-[#76b900]/15 border-[#76b900] text-[#76b900] font-bold'
                      : 'bg-[#0d1017] border-[#272f44] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs">علبة الهواتف (قياسي)</div>
                  <div className="text-[10px] text-slate-400">اسم المنتج + باركود وسط + مواصفات</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplate('barcode_first')}
                  className={`p-2 rounded-xl border text-right transition-all cursor-pointer ${
                    template === 'barcode_first'
                      ? 'bg-[#76b900]/15 border-[#76b900] text-[#76b900] font-bold'
                      : 'bg-[#0d1017] border-[#272f44] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs">الباركود البارز أولاً</div>
                  <div className="text-[10px] text-slate-400">باركود بالأعلى + بيانات ومواصفات أسفله</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplate('compact')}
                  className={`p-2 rounded-xl border text-right transition-all cursor-pointer ${
                    template === 'compact'
                      ? 'bg-[#76b900]/15 border-[#76b900] text-[#76b900] font-bold'
                      : 'bg-[#0d1017] border-[#272f44] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs">مختصر / إكسسوارات</div>
                  <div className="text-[10px] text-slate-400">مخصص لـ 40×25 مم والأجهزة الصغيرة</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplate('dual_code')}
                  className={`p-2 rounded-xl border text-right transition-all cursor-pointer ${
                    template === 'dual_code'
                      ? 'bg-[#76b900]/15 border-[#76b900] text-[#76b900] font-bold'
                      : 'bg-[#0d1017] border-[#272f44] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs">مزدوج (باركود + QR)</div>
                  <div className="text-[10px] text-slate-400">باركود خطي + QR جانبي للموبايل</div>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                مقاس الملصق الحراري:
              </label>
              <select
                value={preset}
                onChange={e => setPreset(e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none font-medium"
              >
                {Object.entries(PRESETS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom dimensions if chosen */}
            {preset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#0d1017] rounded-xl border border-[#272f44]">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">العرض (مم):</label>
                  <input
                    type="number"
                    min="25"
                    max="120"
                    value={customW}
                    onChange={e => setCustomW(Number(e.target.value))}
                    className="w-full bg-[#161a26] border border-[#343d54] text-white text-xs rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">الارتفاع (مم):</label>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    value={customH}
                    onChange={e => setCustomH(Number(e.target.value))}
                    className="w-full bg-[#161a26] border border-[#343d54] text-white text-xs rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Sheet Layout (Roll vs A4 Sheet) */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                طريقة التوزيع على الورق:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setColumns(1)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    columns === 1
                      ? 'bg-[#76b900]/15 border-[#76b900] text-[#76b900]'
                      : 'bg-[#0d1017] border-[#272f44] text-slate-400 hover:text-white'
                  }`}
                >
                  بكرة حرارية (عمود واحد)
                </button>
                <button
                  type="button"
                  onClick={() => setColumns(3)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    columns > 1
                      ? 'bg-[#76b900]/15 border-[#76b900] text-[#76b900]'
                      : 'bg-[#0d1017] border-[#272f44] text-slate-400 hover:text-white'
                  }`}
                >
                  ورق A4 لاصق (3 أعمدة)
                </button>
              </div>
            </div>

            {/* Display Fields Toggles */}
            <div>
              <label className="text-xs text-slate-400 block mb-2 font-medium">
                العناصر المطبوعة على الاستيكر:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer bg-[#0d1017] p-2 rounded-lg border border-[#272f44]">
                  <input
                    type="checkbox"
                    checked={showStoreName}
                    onChange={e => setShowStoreName(e.target.checked)}
                    className="accent-[#76b900]"
                  />
                  <span>اسم المتجر</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#0d1017] p-2 rounded-lg border border-[#272f44]">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={e => setShowPrice(e.target.checked)}
                    className="accent-[#76b900]"
                  />
                  <span>السعر بالجنيه (ج.م)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#0d1017] p-2 rounded-lg border border-[#272f44]">
                  <input
                    type="checkbox"
                    checked={showModel}
                    onChange={e => setShowModel(e.target.checked)}
                    className="accent-[#76b900]"
                  />
                  <span>الموديل والبراند</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#0d1017] p-2 rounded-lg border border-[#272f44]">
                  <input
                    type="checkbox"
                    checked={showSpecs}
                    onChange={e => setShowSpecs(e.target.checked)}
                    className="accent-[#76b900]"
                  />
                  <span>مواصفات القطعة</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#0d1017] p-2 rounded-lg border border-[#272f44]">
                  <input
                    type="checkbox"
                    checked={showSku}
                    onChange={e => setShowSku(e.target.checked)}
                    className="accent-[#76b900]"
                  />
                  <span>كود SKU</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#0d1017] p-2 rounded-lg border border-[#272f44]">
                  <input
                    type="checkbox"
                    checked={showWarranty}
                    onChange={e => setShowWarranty(e.target.checked)}
                    className="accent-[#76b900]"
                  />
                  <span>فترة الضمان</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#0d1017] p-2 rounded-lg border border-[#272f44]">
                  <input
                    type="checkbox"
                    checked={showSerial}
                    onChange={e => setShowSerial(e.target.checked)}
                    className="accent-[#76b900]"
                  />
                  <span>الرقم التسلسلي S/N</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-[#0d1017] p-2 rounded-lg border border-[#272f44]">
                  <input
                    type="checkbox"
                    checked={showBarcodeText}
                    onChange={e => setShowBarcodeText(e.target.checked)}
                    className="accent-[#76b900]"
                  />
                  <span>أرقام الباركود أسفله</span>
                </label>
              </div>
            </div>
          </div>

          {/* 2. Add Products to Print Queue Card */}
          <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#76b900]" />
                إضافة منتجات لقائمة الطباعة
              </span>
              <span className="text-xs text-[#76b900] font-mono font-bold">
                {queue.length} أصناف
              </span>
            </h3>

            {/* Product search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث بالاسم، الموديل، الباركود أو SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3.5 py-2.5 pr-9 focus:border-[#76b900] focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>

            {/* Search dropdown results */}
            {searchResults.length > 0 && (
              <div className="bg-[#161a26] border border-[#272f44] rounded-xl overflow-hidden divide-y divide-[#272f44] max-h-48 overflow-y-auto">
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    onClick={() => addToQueue(p)}
                    className="p-2.5 hover:bg-[#76b900]/10 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.internalBarcode} • {p.model || p.brand}
                      </div>
                    </div>
                    <button className="px-2.5 py-1 bg-[#76b900] text-black font-bold text-[11px] rounded-lg">
                      إضافة +
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Active Queue Table */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {queue.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-[#272f44] rounded-xl">
                  لا توجد منتجات محددة للطباعة حالياً. استخدم البحث أعلاه للإضافة.
                </div>
              ) : (
                queue.map(item => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-[#0d1017] rounded-xl border border-[#222738] flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {item.product.internalBarcode} | {formatEGP(item.product.price)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-[#161a26] rounded-lg border border-[#2f384f] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-300 hover:bg-white/10 text-xs font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={item.quantity}
                          onChange={e => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                          className="w-10 text-center bg-transparent text-xs text-white font-mono font-bold focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 text-slate-300 hover:bg-white/10 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromQueue(item.product.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {queue.length > 0 && (
              <button
                type="button"
                onClick={() => setQueue([])}
                className="text-xs text-slate-500 hover:text-red-400 underline cursor-pointer"
              >
                تفريغ قائمة الاستيكرات
              </button>
            )}
          </div>

          {/* 3. Barcode Scanner Live Verification Tool */}
          <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-[#76b900]" />
              اختبار فحص الاستيكر بالمسدس الضوئي
            </h3>
            <p className="text-[11px] text-slate-400">
              بعد طباعة الاستيكر، وجه مسدس الباركود على الاستيكر للتأكد من قراءته فوراً:
            </p>
            <form onSubmit={handleTestScan} className="flex gap-2">
              <input
                type="text"
                placeholder="امسح الباركود هنا بالمسدس..."
                value={testScannedCode}
                onChange={e => setTestScannedCode(e.target.value)}
                className="flex-1 bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 font-mono focus:border-[#76b900] focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                فحص
              </button>
            </form>

            {testScanResult && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-[#76b900] shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300">نجاح قراءة الباركود بنسبة 100%!</div>
                  <div className="text-[11px] text-slate-300">{testScanResult.name} ({formatEGP(testScanResult.price)})</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Printable Labels Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-[#262c3d] mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#76b900]" />
                <h3 className="text-sm font-bold text-white">
                  معاينة حية لاستيكرات علب الأجهزة ({activeWidth} × {activeHeight} مم)
                </h3>
              </div>
              <span className="text-xs bg-[#76b900]/20 text-[#76b900] font-bold px-2.5 py-1 rounded-full font-mono">
                {flattenedLabels.length} ملصق
              </span>
            </div>

            {/* Instruction Callout */}
            <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-start gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                في نافذة الطباعة: اختر طابعة الباركود الحرارية، واضبط الهوامش على <strong>«بلا هوامش - None»</strong> ومقياس الحجم على <strong>«100%»</strong> لتتطابق أبعاد استيكر علبة الأجهزة بدقة تامة.
              </div>
            </div>

            {/* Preview Canvas */}
            <div className="flex-1 bg-[#090b10] p-4 sm:p-6 rounded-2xl border border-[#232838] overflow-y-auto max-h-[650px] flex justify-center">
              {flattenedLabels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs">
                  <Printer className="w-10 h-10 stroke-1 mb-2 opacity-50" />
                  قائمة الطباعة فارغة. اختر منتجات من القائمة الجانبية.
                </div>
              ) : (
                <div
                  className="grid gap-3 justify-center w-full"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
                  }}
                >
                  {flattenedLabels.map((lbl, idx) => (
                    <div key={idx} className="flex justify-center transition-transform hover:scale-[1.02]">
                      <PhoneBoxLabel
                        product={lbl.product}
                        settings={settings}
                        widthMm={activeWidth}
                        heightMm={activeHeight}
                        serialNumber={lbl.serial}
                        template={template}
                        showStoreName={showStoreName}
                        showPrice={showPrice}
                        showSku={showSku}
                        showModel={showModel}
                        showSpecs={showSpecs}
                        showWarranty={showWarranty}
                        showSerial={showSerial}
                        showBarcodeText={showBarcodeText}
                        showQR={showQR}
                        className="shadow-xl"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Actual Pure Print Container (Rendered exclusively during window.print) --- */}
      <div className="print-area hidden">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${activeWidth}mm ${activeHeight}mm;
                margin: 0;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
            }
          `
        }} />

        <div
          className="print-labels-wrapper"
          style={{
            display: columns > 1 ? 'grid' : 'block',
            gridTemplateColumns: columns > 1 ? `repeat(${columns}, ${activeWidth}mm)` : undefined,
            gap: columns > 1 ? '2mm' : '0'
          }}
        >
          {flattenedLabels.map((lbl, idx) => (
            <div
              key={idx}
              style={{
                pageBreakAfter: columns === 1 ? 'always' : (idx + 1) % (columns * 8) === 0 ? 'always' : 'auto',
                breakAfter: columns === 1 ? 'page' : 'auto'
              }}
            >
              <PhoneBoxLabel
                product={lbl.product}
                settings={settings}
                widthMm={activeWidth}
                heightMm={activeHeight}
                serialNumber={lbl.serial}
                template={template}
                showStoreName={showStoreName}
                showPrice={showPrice}
                showSku={showSku}
                showModel={showModel}
                showSpecs={showSpecs}
                showWarranty={showWarranty}
                showSerial={showSerial}
                showBarcodeText={showBarcodeText}
                showQR={showQR}
                isPrintVersion={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
