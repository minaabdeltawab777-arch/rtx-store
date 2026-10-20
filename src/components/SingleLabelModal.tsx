import React, { useState } from 'react';
import { Product, StoreSettings } from '../types';
import { PhoneBoxLabel, PhoneBoxTemplateType } from './PhoneBoxLabel';
import { formatEGP } from '../utils/formatters';
import { Printer, X, Sliders, CheckCircle, Smartphone, Tag, Eye } from 'lucide-react';

interface SingleLabelModalProps {
  product: Product;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onOpenBulk?: (product: Product) => void;
}

export const SingleLabelModal: React.FC<SingleLabelModalProps> = ({
  product,
  settings,
  isOpen,
  onClose,
  onOpenBulk
}) => {
  const [quantity, setQuantity] = useState(1);
  const [sizePreset, setSizePreset] = useState<string>(settings.defaultLabelPreset || '50x30');
  const [template, setTemplate] = useState<PhoneBoxTemplateType>(
    (settings.labelTemplate as PhoneBoxTemplateType) || 'phone_box'
  );
  const [showPrice, setShowPrice] = useState(settings.labelShowPrice ?? true);
  const [showSpecs, setShowSpecs] = useState(settings.labelShowSpecs ?? true);
  const [showModel, setShowModel] = useState(settings.labelShowModel ?? true);

  const SIZES: Record<string, { w: number; h: number; label: string }> = {
    '40x25': { w: 40, h: 25, label: '40 × 25 مم (إكسسوارات وصغير)' },
    '50x25': { w: 50, h: 25, label: '50 × 25 مم (طابعات حرارية شائعة)' },
    '50x30': { w: 50, h: 30, label: '50 × 30 مم (قياسي / نمط علب الهواتف)' },
    '60x40': { w: 60, h: 40, label: '60 × 40 مم (كبير شامل المواصفات)' },
    '70x50': { w: 70, h: 50, label: '70 × 50 مم (شامل QR والمواصفات)' }
  };

  if (!isOpen) return null;

  const currentSize = SIZES[sizePreset] || { w: 50, h: 30 };

  const handlePrint = () => {
    window.print();
  };

  const labelsArray = Array.from({ length: Math.max(1, quantity) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#12151e] border-2 border-[#2b354c] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 bg-[#181d2a] border-b border-[#262c3d] flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">طباعة استيكر الباركود — نمط علب الأجهزة</h2>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Settings */}
        <div className="p-5 space-y-4 no-print overflow-y-auto max-h-[80vh]">
          {/* Layout Template Selector */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1.5">
              شكل تصميم الملصق:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTemplate('phone_box')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  template === 'phone_box'
                    ? 'bg-[#76b900]/20 border-[#76b900] text-[#76b900] font-bold'
                    : 'bg-[#0d1017] border-[#272f44] text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs">علبة الهواتف</div>
                <div className="text-[9px] opacity-75">بيانات + باركود + مواصفات</div>
              </button>
              <button
                type="button"
                onClick={() => setTemplate('barcode_first')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  template === 'barcode_first'
                    ? 'bg-[#76b900]/20 border-[#76b900] text-[#76b900] font-bold'
                    : 'bg-[#0d1017] border-[#272f44] text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs">الباركود أولاً</div>
                <div className="text-[9px] opacity-75">باركود بارز ثم بياناته</div>
              </button>
              <button
                type="button"
                onClick={() => setTemplate('compact')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  template === 'compact'
                    ? 'bg-[#76b900]/20 border-[#76b900] text-[#76b900] font-bold'
                    : 'bg-[#0d1017] border-[#272f44] text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs">مختصر / إكسسوار</div>
                <div className="text-[9px] opacity-75">للمقاسات الصغيرة</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">مقاس الملصق الحراري:</label>
              <select
                value={sizePreset}
                onChange={e => setSizePreset(e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#76b900]"
              >
                {Object.entries(SIZES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">عدد النسخ المطلوبة:</label>
              <div className="flex items-center bg-[#0d1017] rounded-xl border border-[#272f44] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-slate-300 hover:bg-white/10 text-xs font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center bg-transparent text-xs text-white font-mono font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-slate-300 hover:bg-white/10 text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Quick Quantity Chips */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">تحديد سريع:</span>
            {[1, 2, 5, 10, 20].map(qty => (
              <button
                key={qty}
                type="button"
                onClick={() => setQuantity(qty)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  quantity === qty
                    ? 'bg-[#76b900] text-black border-[#76b900]'
                    : 'bg-[#181d2a] text-slate-300 border-[#2b3347] hover:text-white'
                }`}
              >
                {qty}
              </button>
            ))}
          </div>

          {/* Quick Toggles */}
          <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={e => setShowPrice(e.target.checked)}
                className="accent-[#76b900]"
              />
              <span>إظهار السعر</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showSpecs}
                onChange={e => setShowSpecs(e.target.checked)}
                className="accent-[#76b900]"
              />
              <span>إظهار المواصفات</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showModel}
                onChange={e => setShowModel(e.target.checked)}
                className="accent-[#76b900]"
              />
              <span>الموديل</span>
            </label>
          </div>

          {/* Sticker Realistic Phone Box Preview */}
          <div className="bg-[#090b10] p-5 rounded-2xl border border-[#242b3b] flex flex-col items-center justify-center">
            <div className="flex items-center justify-between w-full mb-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <Eye className="w-3.5 h-3.5 text-[#76b900]" />
                معاينة استيكر علبة الأجهزة الحقيقي ({currentSize.w} × {currentSize.h} مم):
              </span>
              <span className="font-mono text-[#76b900]">{product.internalBarcode}</span>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
              <PhoneBoxLabel
                product={product}
                settings={settings}
                widthMm={currentSize.w}
                heightMm={currentSize.h}
                template={template}
                showPrice={showPrice}
                showSpecs={showSpecs}
                showModel={showModel}
                showBarcodeText={true}
                showStoreName={settings.labelShowStoreName ?? true}
                showSku={settings.labelShowSku ?? true}
                showWarranty={settings.labelShowWarranty ?? true}
                showSerial={settings.labelShowSerial ?? true}
                className="shadow-2xl"
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">
              كود 128 قياسي عالي التباين متوافق 100% مع كافة مسدسات وقوارئ الباركود
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#181d2a] border-t border-[#262c3d] flex items-center justify-between no-print">
          {onOpenBulk && (
            <button
              onClick={() => {
                onClose();
                onOpenBulk(product);
              }}
              className="text-xs text-[#76b900] hover:underline cursor-pointer font-bold"
            >
              فتح في الطباعة المجمعة ←
            </button>
          )}
          <div className="flex items-center gap-2 mr-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 bg-[#76b900] hover:bg-[#88d400] text-black font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-[#76b900]/25 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              طباعة {quantity} ملصق الآن
            </button>
          </div>
        </div>
      </div>

      {/* Pure Print Container (1:1 physical millimeter scaling) */}
      <div className="print-area hidden">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${currentSize.w}mm ${currentSize.h}mm;
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

        <div className="print-labels-wrapper">
          {labelsArray.map((_, idx) => (
            <div
              key={idx}
              style={{
                pageBreakAfter: 'always',
                breakAfter: 'page'
              }}
            >
              <PhoneBoxLabel
                product={product}
                settings={settings}
                widthMm={currentSize.w}
                heightMm={currentSize.h}
                template={template}
                showPrice={showPrice}
                showSpecs={showSpecs}
                showModel={showModel}
                showBarcodeText={true}
                showStoreName={settings.labelShowStoreName ?? true}
                showSku={settings.labelShowSku ?? true}
                showWarranty={settings.labelShowWarranty ?? true}
                showSerial={settings.labelShowSerial ?? true}
                isPrintVersion={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
