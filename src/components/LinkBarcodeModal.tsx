import React, { useState } from 'react';
import { Product } from '../types';
import { storage } from '../services/storage';
import { BarcodeRenderer } from './BarcodeRenderer';
import { formatEGP } from '../utils/formatters';
import {
  Link,
  Plus,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  Package
} from 'lucide-react';

interface LinkBarcodeModalProps {
  barcode: string;
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onLinkedSuccess: (product: Product) => void;
  onCreateNewWithBarcode: (barcode: string) => void;
}

export const LinkBarcodeModal: React.FC<LinkBarcodeModalProps> = ({
  barcode,
  isOpen,
  onClose,
  products,
  onLinkedSuccess,
  onCreateNewWithBarcode
}) => {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (!isOpen) return null;

  const filtered = search.trim()
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.brand.toLowerCase().includes(search.toLowerCase()) ||
          p.model.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleLink = () => {
    if (!selectedProduct) return;

    const updated: Product = {
      ...selectedProduct,
      manufacturerBarcode: barcode,
      barcodeToUse: 'manufacturer'
    };

    const res = storage.saveProduct(updated);
    if (res.success) {
      onLinkedSuccess(updated);
      onClose();
    } else {
      alert(res.error || 'فشل ربط الباركود');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#181d2a] border-b border-[#262c3d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">باركود غير مسجل في المخزون</h2>
              <p className="text-xs text-slate-400 font-mono">الرمز الممسوح: <span className="text-[#76b900] font-bold">{barcode}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            الباركود <strong>({barcode})</strong> غير مرتبط بأي جهاز حالياً. يمكنك ربطه كباركود بديل لمنتج موجود، أو إنشاء منتج جديد به:
          </p>

          {/* Option A: Link to Existing Product */}
          <div className="bg-[#161a26] border border-[#272f44] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Link className="w-3.5 h-3.5 text-[#76b900]" />
              ربط الباركود بمنتج موجود بالكتالوج:
            </h3>

            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن المنتج بالاسم أو الموديل..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 pr-8 focus:border-[#76b900] focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Results dropdown */}
            {filtered.length > 0 && (
              <div className="divide-y divide-[#262c3d] bg-[#0d1017] border border-[#262c3d] rounded-xl max-h-40 overflow-y-auto">
                {filtered.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      selectedProduct?.id === p.id
                        ? 'bg-[#76b900]/20 text-[#76b900]'
                        : 'text-white hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{formatEGP(p.price)}</div>
                    </div>
                    {selectedProduct?.id === p.id && <CheckCircle className="w-4 h-4 text-[#76b900]" />}
                  </div>
                ))}
              </div>
            )}

            {selectedProduct && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block">المنتج المحدد للربط:</span>
                  <span className="font-bold text-white">{selectedProduct.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLink}
                  className="px-3 py-1.5 bg-[#76b900] text-black font-bold text-xs rounded-lg"
                >
                  تأكيد الربط ✓
                </button>
              </div>
            )}
          </div>

          {/* Option B: Create New Product */}
          <div className="bg-[#161a26] border border-[#272f44] rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white">إضافة منتج جديد بهذا الباركود</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                فتح نافذة إضافة منتج جديد مع تعيين ({barcode}) كباركود تلقائي.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onCreateNewWithBarcode(barcode);
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              إنشاء منتج +
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#181d2a] border-t border-[#262c3d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
