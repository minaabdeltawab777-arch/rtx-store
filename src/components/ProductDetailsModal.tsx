import React from 'react';
import { Product, StoreSettings } from '../types';
import { formatEGP } from '../utils/formatters';
import { BarcodeRenderer } from './BarcodeRenderer';
import { QRCodeRenderer } from './QRCodeRenderer';
import { CategoryIllustration } from './CategoryIllustration';
import {
  X,
  Printer,
  ShoppingCart,
  Edit2,
  ShieldCheck,
  CheckCircle,
  Tag,
  Cpu,
  Layers,
  Box,
  Share2,
  Smartphone
} from 'lucide-react';

interface ProductDetailsModalProps {
  product: Product;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
  onPrintLabel?: (product: Product) => void;
  onEdit?: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  settings,
  isOpen,
  onClose,
  onAddToCart,
  onPrintLabel,
  onEdit
}) => {
  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rtxstore.eg';
  const qrUrl = `${baseUrl}/?p=${encodeURIComponent(product.id)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#12151e] border-2 border-[#2b354c] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 bg-[#181d2a] border-b border-[#262c3d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center font-bold">
              <Box className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">بطاقة مواصفات المنتج الكاملة</h2>
              <p className="text-[11px] text-slate-400 font-mono">{product.brand} • {product.model}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Top Hero Section: Image + Title + Price */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-[#161a26] rounded-2xl border border-[#272f44]">
            {/* Image / Illustration */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-[#0d1017] border border-[#2c354a] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <CategoryIllustration categoryId={product.categoryId} size={70} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-right space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {product.brand}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    product.condition === 'new'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : product.condition === 'renewed'
                      ? 'bg-blue-950 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {product.condition === 'new'
                    ? 'جديد بالكرتونة'
                    : product.condition === 'renewed'
                    ? 'مجدد معتمد'
                    : 'مستعمل بحالة ممتازة'}
                </span>
                {product.stockTracking && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      product.stockQuantity <= 0
                        ? 'bg-red-950 text-red-400 border border-red-500/30'
                        : 'bg-[#1e2536] text-slate-300'
                    }`}
                  >
                    رصيد المخزون: {product.stockQuantity} قطعة
                  </span>
                )}
              </div>

              <h1 className="text-base sm:text-lg font-black text-white leading-snug">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {/* Price & Warranty */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="text-xl sm:text-2xl font-black font-mono text-[#76b900]">
                  {formatEGP(product.price)}
                </div>
                {product.warrantyMonths && (
                  <div className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ضمان رسمي: {product.warrantyMonths} شهر
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dual Barcode & Smartphone QR Card */}
          <div className="p-4 bg-[#141824] rounded-2xl border border-[#272f44] flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Linear Code 128 */}
            <div className="flex-1 flex flex-col items-center sm:items-start">
              <span className="text-[10px] text-slate-400 font-mono mb-1">
                باركود الكاشير للمسدس (Code 128):
              </span>
              <div className="bg-white p-2 rounded-xl shadow-md inline-block">
                <BarcodeRenderer
                  value={product.internalBarcode}
                  height={38}
                  width={1.4}
                  fontSize={10}
                  displayValue={true}
                />
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                SKU: <span className="text-white">{product.sku}</span>
                {product.manufacturerBarcode && ` • باركود الكرتونة: ${product.manufacturerBarcode}`}
              </div>
            </div>

            {/* Smartphone QR Code */}
            <div className="flex flex-col items-center bg-[#0d1017] p-3 rounded-xl border border-[#262c3e] shrink-0">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1 font-bold">
                <Smartphone className="w-3.5 h-3.5 text-[#76b900]" />
                امسح بكاميرا الموبايل
              </span>
              <div className="bg-white p-1 rounded-lg">
                <QRCodeRenderer value={qrUrl} size={64} />
              </div>
              <span className="text-[9px] text-[#76b900] font-mono mt-1">
                عرض مباشر للمواصفات
              </span>
            </div>
          </div>

          {/* Technical Specifications List */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-[#76b900]" />
                المواصفات التقنية للهاردوير:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#0d1017] p-3.5 rounded-2xl border border-[#22283a]">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex items-baseline justify-between p-1.5 rounded-lg hover:bg-white/5 text-xs">
                    <span className="text-slate-400 text-[11px] font-semibold">{key.replace(/_/g, ' ').toUpperCase()}:</span>
                    <span className="font-mono text-white text-left font-bold truncate max-w-[65%]">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Specifications */}
          {product.customSpecs && product.customSpecs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-[#76b900]" />
                مواصفات إضافية مخصصة:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#0d1017] p-3.5 rounded-2xl border border-[#22283a]">
                {product.customSpecs.map((cs, i) => (
                  <div key={i} className="flex items-baseline justify-between p-1.5 rounded-lg text-xs">
                    <span className="text-slate-400 text-[11px]">{cs.key}:</span>
                    <span className="font-mono text-white text-left font-bold">{cs.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#181d2a] border-t border-[#262c3d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onAddToCart && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddToCart(product);
                }}
                className="px-4 py-2 bg-[#76b900] hover:bg-[#88d400] text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#76b900]/20 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                إضافة للفاتورة (الكاشير)
              </button>
            )}

            {onPrintLabel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPrintLabel(product);
                }}
                className="px-3.5 py-2 bg-[#1d2433] hover:bg-[#283247] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-[#344059] cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#76b900]" />
                طباعة الاستيكر
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
                className="px-3.5 py-2 bg-[#1d2433] hover:bg-[#283247] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-[#344059] cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-blue-400" />
                تعديل المنتج
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
