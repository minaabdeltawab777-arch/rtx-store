import React, { useState } from 'react';
import { Product, Category, StoreSettings } from '../types';
import { formatEGP, formatDateShort } from '../utils/formatters';
import { storage } from '../services/storage';
import { BarcodeRenderer } from '../components/BarcodeRenderer';
import { ProductFormModal } from '../components/ProductFormModal';
import { SingleLabelModal } from '../components/SingleLabelModal';
import { CategoryIllustration } from '../components/CategoryIllustration';
import {
  Search,
  Plus,
  Printer,
  Edit2,
  Copy,
  Trash2,
  Layers,
  Filter,
  AlertTriangle,
  FolderPlus,
  Box,
  Eye,
  ArrowUpDown,
  Tag
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  onRefreshData: () => void;
  onOpenBulkLabels?: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  settings,
  onRefreshData,
  onOpenBulkLabels
}) => {
  // Navigation sub-tab: 'products' | 'categories'
  const [subTab, setSubTab] = useState<'products' | 'categories'>('products');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'new' | 'used' | 'renewed'>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [singleLabelProduct, setSingleLabelProduct] = useState<Product | null>(null);
  const [previewBarcodeProduct, setPreviewBarcodeProduct] = useState<Product | null>(null);

  // Quick Stock Adjustment modal state
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('توريد بضاعة جديدة');

  // Category Management state
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Filtered Products
  const filteredProducts = products.filter(p => {
    if (p.isArchived) return false;

    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.internalBarcode.toLowerCase().includes(q) ||
      (p.manufacturerBarcode && p.manufacturerBarcode.toLowerCase().includes(q)) ||
      p.sku.toLowerCase().includes(q) ||
      Object.values(p.specs || {}).some(val => String(val).toLowerCase().includes(q));

    const matchCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
    const matchCondition = conditionFilter === 'all' || p.condition === conditionFilter;

    let matchStock = true;
    if (stockFilter === 'in_stock') {
      matchStock = !p.stockTracking || p.stockQuantity > (p.minStockAlert || 1);
    } else if (stockFilter === 'low_stock') {
      matchStock = p.stockTracking && p.stockQuantity > 0 && p.stockQuantity <= (p.minStockAlert || 1);
    } else if (stockFilter === 'out_of_stock') {
      matchStock = p.stockTracking && p.stockQuantity <= 0;
    }

    return matchSearch && matchCategory && matchCondition && matchStock;
  });

  // Action handlers
  const handleAddNew = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDuplicate = (product: Product) => {
    const dup = storage.duplicateProduct(product.id);
    if (dup) {
      onRefreshData();
      alert(`تم نسخ المنتج بنجاح مع باركود داخلي جديد: (${dup.internalBarcode})`);
    }
  };

  const handleDelete = (product: Product) => {
    if (confirm(`هل أنت متأكد من حذف المنتج (${product.name}) نهائياً؟`)) {
      storage.deleteProduct(product.id);
      onRefreshData();
    }
  };

  const handleApplyStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct) return;

    const currentQty = stockAdjustProduct.stockQuantity || 0;
    const newQty = Math.max(0, currentQty + adjustAmount);

    const updated: Product = {
      ...stockAdjustProduct,
      stockQuantity: newQty
    };

    storage.saveProduct(updated);
    onRefreshData();
    setStockAdjustProduct(null);
    setAdjustAmount(0);
  };

  // Category Actions
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      slug: newCatName.trim().toLowerCase().replace(/\s+/g, '_'),
      name: newCatName.trim(),
      icon: 'Folder',
      order: categories.length + 1
    };

    storage.saveCategory(newCat);
    setNewCatName('');
    onRefreshData();
  };

  const handleUpdateCategory = (id: string) => {
    if (!editingCatName.trim()) return;
    const cat = categories.find(c => c.id === id);
    if (cat) {
      storage.saveCategory({ ...cat, name: editingCatName.trim() });
      setEditingCatId(null);
      setEditingCatName('');
      onRefreshData();
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف تصنيف (${name})؟ سيتم تحويل منتجاته تلقائياً إلى تصنيف «أخرى» لحمايتها من الضياع.`)) {
      storage.deleteCategory(id);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Navigation Sub-tabs */}
      <div className="bg-[#131722] border border-[#262c3e] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center font-bold">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">إدارة المنتجات وكتالوج المخزون</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                تحكم كامل بالأسعار والمواصفات والباركود الداخلي دون قيود.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub tabs */}
          <div className="bg-[#0d1017] p-1 rounded-xl border border-[#262c3e] flex items-center">
            <button
              onClick={() => setSubTab('products')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                subTab === 'products'
                  ? 'bg-[#76b900] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              المنتجات ({products.length})
            </button>
            <button
              onClick={() => setSubTab('categories')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                subTab === 'categories'
                  ? 'bg-[#76b900] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              التصنيفات ({categories.length})
            </button>
          </div>

          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-[#76b900] hover:bg-[#88d400] text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#76b900]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج جديد +
          </button>
        </div>
      </div>

      {subTab === 'products' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-4 shadow-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث بالاسم، الموديل، الباركود، أو المواصفات..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl pr-9 pl-3 py-2.5 focus:border-[#76b900] focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none"
                >
                  <option value="all">جميع التصنيفات ({categories.length})</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Filter */}
              <div>
                <select
                  value={stockFilter}
                  onChange={e => setStockFilter(e.target.value as any)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none"
                >
                  <option value="all">جميع حالات المخزون</option>
                  <option value="in_stock">متوفر بالمخزون</option>
                  <option value="low_stock">مخزون منخفض (تنبيه)</option>
                  <option value="out_of_stock">نافد من المخزون (0)</option>
                </select>
              </div>

              {/* Condition Filter */}
              <div>
                <select
                  value={conditionFilter}
                  onChange={e => setConditionFilter(e.target.value as any)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none"
                >
                  <option value="all">جميع الحالات (جديد / مستعمل / مجدد)</option>
                  <option value="new">جديد (Brand New)</option>
                  <option value="used">مستعمل (Used)</option>
                  <option value="renewed">مجدد (Refurbished)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#181d2a] border-b border-[#262c3d] text-slate-300 font-bold">
                    <th className="py-3.5 px-4">الصورة والمنتج</th>
                    <th className="py-3.5 px-4 font-mono">الباركود الداخلي (Code 128)</th>
                    <th className="py-3.5 px-4">التصنيف والحالة</th>
                    <th className="py-3.5 px-4 text-left">سعر البيع (EGP)</th>
                    <th className="py-3.5 px-4 text-center">المخزون</th>
                    <th className="py-3.5 px-4 text-center">طباعة الاستيكر</th>
                    <th className="py-3.5 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202534]">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        لا توجد منتجات مطابقة لخيارات البحث المحددة.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(product => {
                      const catName = categories.find(c => c.id === product.categoryId)?.name || 'أخرى';
                      const isLowStock =
                        product.stockTracking &&
                        product.stockQuantity > 0 &&
                        product.stockQuantity <= (product.minStockAlert || 1);
                      const isOutOfStock = product.stockTracking && product.stockQuantity <= 0;

                      return (
                        <tr key={product.id} className="hover:bg-[#161a26]/70 transition-colors">
                          {/* Image & Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-[#0d1017] border border-[#272f44] overflow-hidden flex items-center justify-center shrink-0">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <CategoryIllustration categoryId={product.categoryId} size={28} />
                                )}
                              </div>
                              <div className="min-w-0 max-w-xs">
                                <div className="font-bold text-white truncate text-xs">
                                  {product.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                                  {product.brand} {product.model && `• ${product.model}`} {product.sku && `(${product.sku})`}
                                </div>
                                {product.specs && Object.keys(product.specs).length > 0 && (
                                  <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                                    {Object.values(product.specs).slice(0, 2).join(' / ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Barcode column with live vector thumbnail */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col items-start">
                              <button
                                type="button"
                                onClick={() => setPreviewBarcodeProduct(product)}
                                className="font-mono font-bold text-white bg-[#0d1017] hover:bg-[#1a2233] hover:text-[#76b900] px-2 py-0.5 rounded border border-[#272f44] text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="عرض ورسم الباركود"
                              >
                                <span>{product.internalBarcode}</span>
                                <Eye className="w-3 h-3 text-slate-500" />
                              </button>
                              {product.manufacturerBarcode && (
                                <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  كرتونة: {product.manufacturerBarcode}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Category & Condition */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-slate-300 font-medium">
                                {catName}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
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
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4 text-left font-mono">
                            <div className="font-black text-[#76b900] text-sm">
                              {formatEGP(product.price)}
                            </div>
                            {product.costPrice && (
                              <div className="text-[10px] text-slate-500">
                                تكلفة: {formatEGP(product.costPrice)}
                              </div>
                            )}
                          </td>

                          {/* Stock */}
                          <td className="py-3 px-4 text-center">
                            {product.stockTracking ? (
                              <div className="inline-flex flex-col items-center">
                                <span
                                  className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                                    isOutOfStock
                                      ? 'bg-red-950 text-red-400 border border-red-500/30'
                                      : isLowStock
                                      ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                                      : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                  }`}
                                >
                                  {product.stockQuantity} قطعة
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setStockAdjustProduct(product)}
                                  className="text-[10px] text-slate-400 hover:text-white underline mt-1"
                                >
                                  تعديل الرصيد
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">بدون تتبع</span>
                            )}
                          </td>

                          {/* Barcode Label Print Action */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSingleLabelProduct(product)}
                              className="px-3 py-1.5 bg-[#76b900]/15 hover:bg-[#76b900] text-[#76b900] hover:text-black font-bold text-xs rounded-xl flex items-center gap-1.5 mx-auto transition-all cursor-pointer border border-[#76b900]/30"
                              title="طباعة استيكر الباركود لهذا المنتج"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              طباعة استيكر
                            </button>
                          </td>

                          {/* Row Actions */}
                          <td className="py-3 px-4 text-left">
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="تعديل المنتج"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicate(product)}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-white/10 rounded-lg transition-colors"
                                title="تكرار وإنشاء نسخة بباركود جديد"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product)}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                                title="حذف المنتج"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Categories Management View */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Add Category Form (4 Cols) */}
          <div className="md:col-span-4 bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-[#76b900]" />
              إضافة تصنيف جديد
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">اسم التصنيف:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كابلات شبكات وفايبر"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-[#76b900] hover:bg-[#88d400] text-black font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                + إضافة التصنيف
              </button>
            </form>
          </div>

          {/* Categories List (8 Cols) */}
          <div className="md:col-span-8 bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>التصنيفات الحالية في النظام</span>
              <span className="text-xs text-slate-400 font-mono">{categories.length} تصنيف</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[550px] overflow-y-auto pr-1">
              {categories.map(cat => {
                const count = products.filter(p => p.categoryId === cat.id).length;
                const isEditingThis = editingCatId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="p-3 bg-[#0d1017] rounded-xl border border-[#222738] flex items-center justify-between gap-2"
                  >
                    {isEditingThis ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingCatName}
                          onChange={e => setEditingCatName(e.target.value)}
                          className="flex-1 bg-[#161a26] border border-[#272f44] text-white text-xs rounded-lg px-2.5 py-1"
                        />
                        <button
                          onClick={() => handleUpdateCategory(cat.id)}
                          className="px-2 py-1 bg-[#76b900] text-black font-bold text-[11px] rounded"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditingCatId(null)}
                          className="px-2 py-1 bg-slate-800 text-slate-300 text-[11px] rounded"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="text-xs font-bold text-white">{cat.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {count} منتجات مرتبطة
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditingCatName(cat.name);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white rounded"
                            title="تعديل اسم التصنيف"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {cat.id !== 'cat-other' && (
                            <button
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded"
                              title="حذف التصنيف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isFormOpen && (
        <ProductFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={() => onRefreshData()}
          productToEdit={editingProduct}
          categories={categories}
        />
      )}

      {/* Single Label Print Modal */}
      {singleLabelProduct && (
        <SingleLabelModal
          product={singleLabelProduct}
          settings={settings}
          isOpen={Boolean(singleLabelProduct)}
          onClose={() => setSingleLabelProduct(null)}
          onOpenBulk={p => {
            setSingleLabelProduct(null);
            if (onOpenBulkLabels) onOpenBulkLabels(p);
          }}
        />
      )}

      {/* Quick Stock Adjustment Modal */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262c3d]">
              <h3 className="text-sm font-bold text-white">تعديل كمية المخزون</h3>
              <button
                onClick={() => setStockAdjustProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-white mb-1">{stockAdjustProduct.name}</div>
              <div className="text-xs text-slate-400 font-mono">
                الرصيد الحالي: <span className="text-[#76b900] font-bold">{stockAdjustProduct.stockQuantity}</span> قطعة
              </div>
            </div>

            <form onSubmit={handleApplyStockAdjustment} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  الكمية المراد إضافتها (+) أو خصمها (-):
                </label>
                <input
                  type="number"
                  required
                  placeholder="+5 أو -2"
                  value={adjustAmount || ''}
                  onChange={e => setAdjustAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-sm font-mono font-bold rounded-xl px-3 py-2 text-center focus:border-[#76b900] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">سبب التعديل:</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 focus:border-[#76b900] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-[#0d1017] rounded-xl border border-[#272f44] text-xs flex justify-between font-mono">
                <span>الرصيد الجديد بعد التعديل:</span>
                <span className="font-bold text-[#76b900]">
                  {Math.max(0, (stockAdjustProduct.stockQuantity || 0) + adjustAmount)} قطعة
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockAdjustProduct(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#76b900] text-black font-bold text-xs rounded-xl"
                >
                  حفظ وتحديث المخزون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Barcode Quick Preview Modal */}
      {previewBarcodeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262c3d]">
              <div>
                <h3 className="text-sm font-bold text-white">معاينة باركود المنتج (Code 128)</h3>
                <p className="text-[10px] text-slate-400 truncate max-w-[220px]">{previewBarcodeProduct.name}</p>
              </div>
              <button
                onClick={() => setPreviewBarcodeProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center shadow-inner">
              <BarcodeRenderer
                value={previewBarcodeProduct.internalBarcode}
                height={55}
                width={1.6}
                fontSize={12}
                displayValue={true}
              />
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">الباركود الداخلي:</span>
                <span className="font-bold text-[#76b900]">{previewBarcodeProduct.internalBarcode}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">كود SKU:</span>
                <span>{previewBarcodeProduct.sku}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">سعر البيع:</span>
                <span className="font-bold">{formatEGP(previewBarcodeProduct.price)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262c3d]">
              <button
                type="button"
                onClick={() => {
                  const prod = previewBarcodeProduct;
                  setPreviewBarcodeProduct(null);
                  setSingleLabelProduct(prod);
                }}
                className="w-full py-2 bg-[#76b900] hover:bg-[#88d400] text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة هذا الباركود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
