import React, { useState } from 'react';
import { Product, StoreSettings } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { formatEGP } from '../utils/formatters';
import { Printer, X, Sliders, CheckCircle } from 'lucide-react';

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

  const SIZES: Record<string, { w: number; h: number; label: string }> = {
    '40x25': { w: 40, h: 25, label: '40 × 25 مم' },
    '50x30': { w: 50, h: 30, label: '50 × 30 مم (قياسي)' },
    '60x40': { w: 60, h: 40, label: '60 × 40 مم' },
    '70x50': { w: 70, h: 50, label: '70 × 50 مم' }
  };

  if (!isOpen) return null;

  const currentSize = SIZES[sizePreset] || { w: 50, h: 30 };

  const handlePrint = () => {
    window.print();
  };

  const labelsArray = Array.from({ length: Math.max(1, quantity) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#181d2a] border-b border-[#262c3d] flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">طباعة استيكر الباركود للمنتج</h2>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Settings */}
        <div className="p-5 space-y-4 no-print">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">مقاس الملصق:</label>
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
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold border transition-colors ${
                  quantity === qty
                    ? 'bg-[#76b900] text-black border-[#76b900]'
                    : 'bg-[#181d2a] text-slate-300 border-[#2b3347] hover:text-white'
                }`}
              >
                {qty}
              </button>
            ))}
          </div>

          {/* Sticker Realistic Preview */}
          <div className="bg-[#0a0c10] p-6 rounded-xl border border-[#242b3b] flex flex-col items-center justify-center">
            <div className="text-[10px] text-slate-500 mb-2 font-mono">معاينة الاستيكر الفعلي:</div>
            <div
              className="bg-white text-black p-2.5 rounded shadow-xl flex flex-col justify-between items-center text-center overflow-hidden border border-slate-300"
              style={{
                width: `${currentSize.w * 3.78}px`,
                minHeight: `${currentSize.h * 3.78}px`
              }}
            >
              <div className="text-[10px] font-black text-black font-mono tracking-tight leading-none mb-0.5">
                {settings.storeName}
              </div>
              <div className="text-[9px] font-bold text-gray-900 leading-tight line-clamp-2 px-1">
                {product.name}
              </div>
              {product.model && (
                <div className="text-[8px] text-gray-600 font-mono leading-none my-0.5">
                  {product.model}
                </div>
              )}
              <div className="w-full flex justify-center my-0.5">
                <BarcodeRenderer
                  value={product.internalBarcode}
                  height={currentSize.h * 1.05}
                  width={1.3}
                  fontSize={8.5}
                  displayValue={true}
                />
              </div>
              <div className="text-[10px] font-black font-mono text-black border-t border-gray-300 pt-0.5 w-full leading-none">
                {formatEGP(product.price)}
              </div>
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
              className="text-xs text-[#76b900] hover:underline cursor-pointer"
            >
              فتح في الطباعة المجمعة ←
            </button>
          )}
          <div className="flex items-center gap-2 mr-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              إلغاء
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-[#76b900] hover:bg-[#88d400] text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#76b900]/25 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              طباعة {quantity} ملصق
            </button>
          </div>
        </div>
      </div>

      {/* Media print target */}
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
              }
            }
          `
        }} />

        <div className="print-labels-wrapper">
          {labelsArray.map((_, idx) => (
            <div
              key={idx}
              className="label-sticker text-black bg-white flex flex-col justify-between items-center text-center overflow-hidden"
              style={{
                width: `${currentSize.w}mm`,
                height: `${currentSize.h}mm`,
                padding: '1.5mm',
                boxSizing: 'border-box',
                pageBreakAfter: 'always',
                breakAfter: 'page'
              }}
            >
              <div style={{ fontSize: '8pt', fontWeight: '900', lineHeight: 1, fontFamily: 'monospace' }}>
                {settings.storeName}
              </div>
              <div style={{ fontSize: '7pt', fontWeight: 'bold', lineHeight: 1.1, maxHeight: '3.5em', overflow: 'hidden' }}>
                {product.name}
              </div>
              {product.model && (
                <div style={{ fontSize: '6pt', color: '#333', lineHeight: 1, fontFamily: 'monospace' }}>
                  {product.model}
                </div>
              )}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <BarcodeRenderer
                  value={product.internalBarcode}
                  height={currentSize.h * 1.05}
                  width={1.2}
                  fontSize={8}
                  displayValue={true}
                />
              </div>
              <div style={{ fontSize: '8.5pt', fontWeight: '900', fontFamily: 'monospace', lineHeight: 1 }}>
                {formatEGP(product.price)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
