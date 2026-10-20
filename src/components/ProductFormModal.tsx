import React, { useState, useEffect } from 'react';
import { Product, Category, CustomSpec } from '../types';
import { CATEGORY_SPECS_MAP, CategorySpecField } from '../data/categories';
import { storage } from '../services/storage';
import { BarcodeRenderer } from './BarcodeRenderer';
import { formatEGP } from '../utils/formatters';
import {
  X,
  Plus,
  Trash2,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Layers,
  ShieldCheck,
  Package
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
  categories: Category[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories
}) => {
  const isEditing = Boolean(productToEdit);

  // Form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-laptops');
  const [sku, setSku] = useState('');
  const [internalBarcode, setInternalBarcode] = useState('');
  const [manufacturerBarcode, setManufacturerBarcode] = useState('');
  const [barcodeToUse, setBarcodeToUse] = useState<'internal' | 'manufacturer'>('internal');
  const [price, setPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [condition, setCondition] = useState<'new' | 'used' | 'renewed'>('new');
  const [stockTracking, setStockTracking] = useState(true);
  const [stockQuantity, setStockQuantity] = useState<number | ''>(1);
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(2);
  const [warrantyMonths, setWarrantyMonths] = useState<number | ''>(12);
  const [shortDescription, setShortDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSerialized, setIsSerialized] = useState(false);
  const [serialNumbersText, setSerialNumbersText] = useState('');

  // Dynamic specs & custom specs
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [customSpecs, setCustomSpecs] = useState<CustomSpec[]>([]);

  // Validation & alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [barcodeWarning, setBarcodeWarning] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setBrand(productToEdit.brand);
      setModel(productToEdit.model);
      setCategoryId(productToEdit.categoryId);
      setSku(productToEdit.sku);
      setInternalBarcode(productToEdit.internalBarcode);
      setManufacturerBarcode(productToEdit.manufacturerBarcode || '');
      setBarcodeToUse(productToEdit.barcodeToUse || 'internal');
      setPrice(productToEdit.price);
      setCostPrice(productToEdit.costPrice ?? '');
      setImage(productToEdit.image);
      setCondition(productToEdit.condition);
      setStockTracking(productToEdit.stockTracking);
      setStockQuantity(productToEdit.stockTracking ? productToEdit.stockQuantity : '');
      setMinStockAlert(productToEdit.minStockAlert ?? '');
      setWarrantyMonths(productToEdit.warrantyMonths ?? '');
      setShortDescription(productToEdit.shortDescription || '');
      setNotes(productToEdit.notes || '');
      setIsSerialized(Boolean(productToEdit.isSerialized));
      setSerialNumbersText((productToEdit.serialNumbers || []).join('\n'));
      setSpecs(productToEdit.specs || {});
      setCustomSpecs(productToEdit.customSpecs || []);
    } else {
      // New product: generate fresh unique internal barcode
      const newBarcode = storage.generateUniqueBarcode();
      setName('');
      setBrand('');
      setModel('');
      setCategoryId(categories[0]?.id || 'cat-laptops');
      setSku(`SKU-${Date.now().toString().slice(-6)}`);
      setInternalBarcode(newBarcode);
      setManufacturerBarcode('');
      setBarcodeToUse('internal');
      setPrice('');
      setCostPrice('');
      setImage(undefined);
      setCondition('new');
      setStockTracking(true);
      setStockQuantity(1);
      setMinStockAlert(2);
      setWarrantyMonths(12);
      setShortDescription('');
      setNotes('');
      setIsSerialized(false);
      setSerialNumbersText('');
      setSpecs({});
      setCustomSpecs([]);
    }
    setErrorMsg(null);
    setBarcodeWarning(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // Predefined specs for current selected category
  const dynamicFields: CategorySpecField[] = CATEGORY_SPECS_MAP[categoryId] || [];

  const handleSpecChange = (key: string, value: string) => {
    setSpecs(prev => ({ ...prev, [key]: value }));
  };

  const handleAddCustomSpec = () => {
    setCustomSpecs(prev => [...prev, { key: '', value: '' }]);
  };

  const handleCustomSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    setCustomSpecs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleRemoveCustomSpec = (index: number) => {
    setCustomSpecs(prev => prev.filter((_, i) => i !== index));
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        setImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Barcode Regenerate handler
  const handleRegenerateBarcode = () => {
    if (isEditing) {
      if (!confirm('تحذير: تغيير الباركود لمنتج مسجل سيجعل الاستيكرات المطبوعة مسبقاً غير متطابقة! هل أنت متأكد؟')) {
        return;
      }
    }
    const code = storage.generateUniqueBarcode();
    setInternalBarcode(code);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('برجاء كتابة اسم المنتج');
      return;
    }
    if (price === '' || isNaN(Number(price)) || Number(price) <= 0) {
      setErrorMsg('برجاء إدخال سعر بيع صحيح بالجنيه المصري');
      return;
    }
    if (!internalBarcode.trim()) {
      setErrorMsg('برجاء توليد أو كتابة باركود داخلي للمنتج');
      return;
    }

    // Check barcode duplication
    if (storage.isBarcodeDuplicate(internalBarcode, productToEdit?.id)) {
      setErrorMsg(`الباركود الداخلي (${internalBarcode}) مستخدم بالفعل لمنتج آخر!`);
      return;
    }
    if (manufacturerBarcode && storage.isBarcodeDuplicate(manufacturerBarcode, productToEdit?.id)) {
      setErrorMsg(`باركود الشركة المصنعة (${manufacturerBarcode}) مسجل لمنتج آخر!`);
      return;
    }

    // Parse serial numbers
    const serials = serialNumbersText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    // Clean specs: remove empty strings
    const cleanSpecs: Record<string, string> = {};
    Object.entries(specs).forEach(([k, v]) => {
      if (v && v.trim()) cleanSpecs[k] = v.trim();
    });

    const cleanCustomSpecs = customSpecs.filter(cs => cs.key.trim() && cs.value.trim());

    const savedProduct: Product = {
      id: productToEdit?.id || `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      brand: brand.trim(),
      model: model.trim(),
      categoryId,
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      internalBarcode: internalBarcode.trim(),
      manufacturerBarcode: manufacturerBarcode.trim() || undefined,
      barcodeToUse,
      price: Number(price),
      costPrice: costPrice !== '' ? Number(costPrice) : undefined,
      image,
      condition,
      stockTracking,
      stockQuantity: stockTracking ? Math.max(0, Number(stockQuantity) || 0) : 0,
      minStockAlert: minStockAlert !== '' ? Number(minStockAlert) : undefined,
      warrantyMonths: warrantyMonths !== '' ? Number(warrantyMonths) : undefined,
      shortDescription: shortDescription.trim() || undefined,
      notes: notes.trim() || undefined,
      isSerialized,
      serialNumbers: isSerialized ? serials : undefined,
      specs: cleanSpecs,
      customSpecs: cleanCustomSpecs,
      createdAt: productToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = storage.saveProduct(savedProduct);
    if (!res.success) {
      setErrorMsg(res.error || 'حدث خطأ أثناء حفظ المنتج');
      return;
    }

    onSave(savedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 bg-[#181d2a] border-b border-[#262c3d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'تعديل بيانات المنتج والمواصفات' : 'إضافة منتج جديد للكتالوج والمخزون'}
              </h2>
              <p className="text-xs text-slate-400">
                أدخل مواصفات الهاردوير وسعر البيع وسيتم توليد الباركود الداخلي تلقائياً.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="bg-[#151924] border border-[#252b3b] rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-[#76b900] uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4" />
              1. البيانات الأساسية والتصنيف
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  اسم المنتج الكامل <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: لابتوب ASUS ROG Strix SCAR 16 Core i9 RTX 4080"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  التصنيف <span className="text-red-400">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none font-medium"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">الماركة (Brand):</label>
                <input
                  type="text"
                  placeholder="مثال: ASUS / Apple / MSI / Razer"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 focus:border-[#76b900] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">الموديل (Model):</label>
                <input
                  type="text"
                  placeholder="مثال: G634JZ-XS96 / Pro 16 M3"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 focus:border-[#76b900] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">حالة المنتج:</label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value as any)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 focus:border-[#76b900] focus:outline-none"
                >
                  <option value="new">جديد بالكرتونة (Brand New)</option>
                  <option value="used">مستعمل بحالة ممتازة (Used)</option>
                  <option value="renewed">مجدد معتمد (Refurbished)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock */}
          <div className="bg-[#151924] border border-[#252b3b] rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-[#76b900] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              2. السعر بالجنيه المصري وإدارة المخزون
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  سعر البيع (ج.م) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="مثال: 45000"
                  value={price}
                  onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#0d1017] border-2 border-[#2b344a] focus:border-[#76b900] text-[#76b900] font-black text-sm rounded-xl px-3 py-2 text-left font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  سعر التكلفة (اختياري):
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="مثال: 41000"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 text-left font-mono focus:border-[#76b900] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">مدة الضمان (بالشهور):</label>
                <input
                  type="number"
                  min="0"
                  placeholder="مثال: 12 أو 24"
                  value={warrantyMonths}
                  onChange={e => setWarrantyMonths(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 font-mono focus:border-[#76b900] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">كود المنتج SKU:</label>
                <input
                  type="text"
                  placeholder="SKU-XXXX"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 font-mono focus:border-[#76b900] focus:outline-none"
                />
              </div>
            </div>

            {/* Stock Tracking Toggle */}
            <div className="pt-2 border-t border-[#232838] flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stockTracking}
                  onChange={e => setStockTracking(e.target.checked)}
                  className="w-4 h-4 accent-[#76b900] rounded"
                />
                <span className="text-xs font-bold text-white">
                  تفعيل تتبع كمية المخزون لهذا المنتج
                </span>
              </label>

              {stockTracking && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">الكمية المتوفرة:</span>
                    <input
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={e => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-20 bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-lg px-2.5 py-1 text-center font-mono font-bold focus:border-[#76b900] focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">تنبيه عند انخفاض المخزون لـ:</span>
                    <input
                      type="number"
                      min="0"
                      value={minStockAlert}
                      onChange={e => setMinStockAlert(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-16 bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-lg px-2 py-1 text-center font-mono focus:border-[#76b900] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Serial Number Tracking for individual laptops / GPUs */}
            <div className="pt-2 border-t border-[#232838]">
              <label className="flex items-center gap-2.5 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={isSerialized}
                  onChange={e => setIsSerialized(e.target.checked)}
                  className="w-4 h-4 accent-[#76b900] rounded"
                />
                <span className="text-xs font-bold text-white">
                  تتبع الأجهزة بأرقام تسلسلية فريدة (Serial Number) لكل جهاز
                </span>
              </label>

              {isSerialized && (
                <div className="bg-[#0d1017] p-3 rounded-xl border border-[#272f44] space-y-1.5">
                  <label className="text-[11px] text-slate-400 block font-mono">
                    أدخل السيريالات المتوفرة (سيريال واحد في كل سطر):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="SN-ROG-4080-01&#10;SN-ROG-4080-02"
                    value={serialNumbersText}
                    onChange={e => setSerialNumbersText(e.target.value)}
                    className="w-full bg-[#161a26] border border-[#2f384d] text-white text-xs rounded-lg p-2.5 font-mono focus:border-[#76b900] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">
                    عند بيع جهاز محدد برقم السيريال، يتم حذفه تلقائياً من قائمة السيريالات المتاحة.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Unique Barcode System */}
          <div className="bg-[#151924] border border-[#252b3b] rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-[#76b900] uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              3. نظام الباركود الداخلي الموحد (Code 128)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-300 font-semibold">
                      الباركود الداخلي الفريد (Code 128) <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleRegenerateBarcode}
                      className="text-[11px] text-[#76b900] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      توليد باركود جديد
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={internalBarcode}
                    onChange={e => setInternalBarcode(e.target.value.trim())}
                    className="w-full bg-[#0d1017] border-2 border-[#283144] focus:border-[#76b900] text-white text-sm font-mono font-bold rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    باركود الشركة المصنعة (إن وجد على الكرتونة الأصلية EAN/UPC):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 0197105123456"
                    value={manufacturerBarcode}
                    onChange={e => setManufacturerBarcode(e.target.value.trim())}
                    className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs font-mono rounded-xl px-3 py-2 focus:border-[#76b900] focus:outline-none"
                  />
                </div>
              </div>

              {/* Barcode Graphic Preview Card */}
              <div className="bg-[#0a0c10] border border-[#272f44] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-500 font-mono mb-1">معاينة استيكر الباركود للمسدس:</span>
                <div className="bg-white p-2 rounded shadow-md max-w-full">
                  <BarcodeRenderer
                    value={internalBarcode || 'RTX-EMPTY'}
                    height={38}
                    width={1.4}
                    fontSize={10}
                    displayValue={true}
                  />
                </div>
                <span className="text-[10px] text-emerald-400 mt-2 font-semibold">
                  ✓ مشفر بترميز Code 128 القياسي القابل للقراءة بجميع الماسحات الضوئية
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Dynamic Category Hardware Specs */}
          {dynamicFields.length > 0 && (
            <div className="bg-[#151924] border border-[#252b3b] rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-[#76b900] uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  4. مواصفات الهاردوير الذكية لـ ({categories.find(c => c.id === categoryId)?.name})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {dynamicFields.length} حقول متخصصة
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {dynamicFields.map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-slate-300 block mb-1">
                      {field.label}:
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={specs[field.key] || ''}
                      onChange={e => handleSpecChange(field.key, e.target.value)}
                      className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 focus:border-[#76b900] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Custom Specifications Builder */}
          <div className="bg-[#151924] border border-[#252b3b] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#76b900] uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" />
                5. مواصفات إضافية مخصصة (Custom Specs)
              </h3>
              <button
                type="button"
                onClick={handleAddCustomSpec}
                className="px-3 py-1 bg-[#76b900]/20 hover:bg-[#76b900]/30 text-[#76b900] font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
              >
                + إضافة مواصفة جديدة
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              يمكنك إضافة أي خاصية غير موجودة بالقائمة (مثل: اللون، نوع السويتش، التوافق، منفذ الشاحن...).
            </p>

            {customSpecs.length > 0 && (
              <div className="space-y-2 pt-2">
                {customSpecs.map((cs, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="اسم الخاصية (مثال: اللون)"
                      value={cs.key}
                      onChange={e => handleCustomSpecChange(index, 'key', e.target.value)}
                      className="w-1/3 bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 focus:border-[#76b900] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="القيمة (مثال: أبيض ثلجي)"
                      value={cs.value}
                      onChange={e => handleCustomSpecChange(index, 'value', e.target.value)}
                      className="flex-1 bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 focus:border-[#76b900] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomSpec(index)}
                      className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Image Upload & Description */}
          <div className="bg-[#151924] border border-[#252b3b] rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-[#76b900] uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              6. صورة المنتج والوصف
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Image Preview / Upload */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#0d1017] border-2 border-dashed border-[#293245] rounded-xl relative">
                {image ? (
                  <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-lg">
                    <img src={image} alt="Preview" className="max-w-full max-h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setImage(undefined)}
                      className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow"
                      title="حذف الصورة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-4 w-full">
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-300 font-bold">رفع صورة من الجهاز</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG حتى 2MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Description & Notes */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">وصف موجز للمنتج:</label>
                  <textarea
                    rows={2}
                    placeholder="وصف تسويقي أو تفاصيل إضافية تظهر للعميل..."
                    value={shortDescription}
                    onChange={e => setShortDescription(e.target.value)}
                    className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl p-2.5 focus:border-[#76b900] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">ملاحظات داخلية للمحل:</label>
                  <input
                    type="text"
                    placeholder="ملاحظات سرية للكاشير (مثال: الجهاز معه فاتورة الشراء الأصلية)..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2 focus:border-[#76b900] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-[#181d2a] border-t border-[#262c3d] flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            الباركود الحالي: <span className="text-[#76b900] font-bold">{internalBarcode}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#76b900] hover:bg-[#88d400] text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#76b900]/25 transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              {isEditing ? 'حفظ التعديلات' : 'إضافة المنتج للكتالوج'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
