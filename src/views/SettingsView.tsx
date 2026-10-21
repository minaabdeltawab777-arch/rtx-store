import React, { useState, useRef } from 'react';
import { StoreSettings, Product } from '../types';
import { storage } from '../services/storage';
import { cloudService } from '../services/supabase';
import {
  Settings,
  Store,
  Printer,
  Download,
  Upload,
  Database,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Volume2,
  ScanLine,
  Cloud,
  ShieldCheck,
  Globe
} from 'lucide-react';

interface SettingsViewProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onRefreshData: () => void;
  onOpenCloudModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onRefreshData,
  onOpenCloudModal
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof StoreSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(formData);
    onUpdateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Backup Export
  const handleExportBackup = () => {
    const backupJson = storage.exportBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RTX_STORE_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Backup Import
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      if (!content) return;

      if (confirm('تنبيه هام: استرجاع النسخة الاحتياطية سيقوم بتحديث السجلات الحالية. هل تود المتابعة؟')) {
        const result = storage.importBackup(content);
        if (result.success) {
          onRefreshData();
          setImportStatus(`✓ تم استرجاع النسخة بنجاح (${result.count} منتج)`);
        } else {
          setImportStatus(`✗ ${result.message}`);
        }
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  // CSV Catalog Export
  const handleExportCSV = () => {
    const products = storage.getProducts();
    if (products.length === 0) {
      alert('لا توجد منتجات لتصديرها');
      return;
    }

    const headers = ['اسم المنتج', 'الماركة', 'الموديل', 'الباركود الداخلي', 'باركود الشركة', 'SKU', 'سعر البيع', 'سعر التكلفة', 'المخزون', 'الحالة'];
    const rows = products.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brand}"`,
      `"${p.model}"`,
      `"${p.internalBarcode}"`,
      `"${p.manufacturerBarcode || ''}"`,
      `"${p.sku}"`,
      p.price,
      p.costPrice || '',
      p.stockTracking ? p.stockQuantity : '',
      p.condition
    ]);

    const csvString = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RTX_Products_Catalog_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Catalog Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const content = ev.target?.result as string;
        if (!content) return;

        // Robust CSV line parser supporting quoted fields and commas
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(cur.trim());
              cur = '';
            } else {
              cur += char;
            }
          }
          result.push(cur.trim());
          return result;
        };

        const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('ملف CSV فارغ أو لا يحتوي على صفوف بيانات');
          return;
        }

        // Parse lines
        let addedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length >= 1 && cols[0]) {
            const prodName = cols[0];
            const brand = cols[1] || '';
            const model = cols[2] || '';
            let barcode = cols[3] || '';
            const mfgBarcode = cols[4] || '';
            const sku = cols[5] || `SKU-${Date.now().toString().slice(-6)}`;
            const price = parseFloat(cols[6]) || 100;
            const costPrice = cols[7] ? parseFloat(cols[7]) : undefined;
            const stockQty = cols[8] !== undefined && cols[8] !== '' ? parseInt(cols[8]) || 0 : 1;
            const conditionVal = cols[9] === 'used' || cols[9] === 'renewed' ? cols[9] : 'new';

            // Generate unique internal barcode if missing or duplicate
            if (!barcode || storage.isBarcodeDuplicate(barcode)) {
              barcode = storage.generateUniqueBarcode();
            }

            const newProd: Product = {
              id: `imported-${Date.now()}-${i}`,
              name: prodName,
              brand,
              model,
              categoryId: 'cat-other',
              sku,
              internalBarcode: barcode,
              manufacturerBarcode: mfgBarcode || undefined,
              barcodeToUse: 'internal',
              price,
              costPrice,
              condition: conditionVal,
              stockTracking: true,
              stockQuantity: stockQty,
              specs: {},
              customSpecs: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            storage.saveProduct(newProd);
            addedCount++;
          }
        }

        onRefreshData();
        setImportStatus(`✓ تم استيراد ${addedCount} منتج بنجاح وتوليد الباركودات المطلوبة!`);
        if (csvInputRef.current) csvInputRef.current.value = '';
        setTimeout(() => setImportStatus(null), 5000);
      } catch (err: any) {
        alert('حدث خطأ أثناء قراءة ملف CSV');
      }
    };
    reader.readAsText(file);
  };

  // Demo Data Actions
  const handleLoadDemo = () => {
    if (confirm('هل تريد تحميل الكتالوج التجريبي للأجهزة؟ سيتم إضافة أجهزة لابتوب وكروت شاشة حقيقية دون حذف بياناتك.')) {
      storage.loadDemoData();
      onRefreshData();
      alert('تم تحميل البيانات التجريبية بنجاح!');
    }
  };

  const handleClearDemo = () => {
    if (confirm('هل تريد إزالة السجلات التجريبية فقط والإبقاء على منتجاتك وفواتيرك الحقيقية؟')) {
      storage.clearDemoData();
      onRefreshData();
      alert('تم تنظيف البيانات التجريبية بأمان.');
    }
  };

  const handleClearAll = () => {
    if (confirm('تحذير شديد الخطورة: هل تريد مسح كافة المنتجات والفواتير والمخزون نهائياً والبدء من الصفر؟')) {
      if (confirm('تأكيد نهائي: لن يمكن التراجع عن هذه الخطوة!')) {
        storage.clearAllData();
        onRefreshData();
        alert('تم تصفير النظام.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#131722] border border-[#262c3e] rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">إعدادات المحل والنسخ الاحتياطي</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              تخصيص بيانات الفواتير، الاستيكرات، أجهزة الكاشير، والنسخ الاحتياطي الشامل.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="px-4 py-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#76b900]" />
            تم حفظ الإعدادات بنجاح!
          </div>
        )}
      </div>

      {importStatus && (
        <div className="p-3 bg-[#161a26] border border-[#2f384f] text-white text-xs font-bold rounded-xl">
          {importStatus}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Store Profile & Invoice Header */}
        <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-[#76b900]" />
            بيانات المتجر والترويسة (تظهر في الفواتير المطبوعة)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1">اسم المحل / المتجر:</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={e => handleInputChange('storeName', e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 font-bold focus:border-[#76b900] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">الشعار الفرعي (Tagline):</label>
              <input
                type="text"
                value={formData.storeTagline}
                onChange={e => handleInputChange('storeTagline', e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">أرقام الهواتف:</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 font-mono focus:border-[#76b900] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-slate-300 block mb-1">عنوان المحل بالتفصيل:</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => handleInputChange('address', e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">اسم الكاشير الافتراضي:</label>
              <input
                type="text"
                value={formData.cashierDisplayName}
                onChange={e => handleInputChange('cashierDisplayName', e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">السجل التجاري (اختياري):</label>
              <input
                type="text"
                value={formData.commercialReg || ''}
                onChange={e => handleInputChange('commercialReg', e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 font-mono focus:border-[#76b900] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">البطاقة الضريبية (اختياري):</label>
              <input
                type="text"
                value={formData.taxNumber || ''}
                onChange={e => handleInputChange('taxNumber', e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 font-mono focus:border-[#76b900] focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs text-slate-300 block mb-1">
                نص تذييل الفاتورة وشروط الضمان والاسترجاع:
              </label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={e => handleInputChange('receiptFooter', e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl p-3 focus:border-[#76b900] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hardware POS & Scanner Settings */}
        <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-[#76b900]" />
            إعدادات أجهزة الكاشير والماسح الضوئي (POS Hardware)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1">تنسيق الفاتورة الافتراضي:</label>
              <select
                value={formData.defaultReceiptFormat}
                onChange={e => handleInputChange('defaultReceiptFormat', e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none font-semibold"
              >
                <option value="thermal80">ورق حراري 80 مم (طابعة فواتير إيصالات)</option>
                <option value="a4">ورقة كاملة A4 (طابعة مكتبية قياسية)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">نمط استيكر الباركود الافتراضي:</label>
              <select
                value={formData.labelTemplate || 'phone_box'}
                onChange={e => handleInputChange('labelTemplate', e.target.value as any)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none font-semibold"
              >
                <option value="phone_box">نمط علبة الهواتف والأجهزة (بيانات + باركود + مواصفات)</option>
                <option value="barcode_first">الباركود البارز أولاً (باركود بالأعلى ثم بياناته)</option>
                <option value="compact">مختصر للمقاسات الصغيرة والإكسسوارات</option>
                <option value="dual_code">مزدوج (باركود خطي + رمز QR جانبي للموبايل)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">مقاس الاستيكر الافتراضي:</label>
              <select
                value={formData.defaultLabelPreset}
                onChange={e => handleInputChange('defaultLabelPreset', e.target.value)}
                className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none font-semibold"
              >
                <option value="40x25">40 × 25 مم (إكسسوارات)</option>
                <option value="50x25">50 × 25 مم (شائع)</option>
                <option value="50x30">50 × 30 مم (قياسي / موصى به)</option>
                <option value="60x40">60 × 40 مم (كبير شامل)</option>
                <option value="70x50">70 × 50 مم (واسع)</option>
              </select>
            </div>

            <div className="flex flex-col justify-center space-y-2 pt-2">
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.scannerAudioFeedback}
                  onChange={e => handleInputChange('scannerAudioFeedback', e.target.checked)}
                  className="accent-[#76b900] w-4 h-4"
                />
                <span>تفعيل صوت الصافرة (Beep) عند مسح الباركود بنجاح</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableDiscounts}
                  onChange={e => handleInputChange('enableDiscounts', e.target.checked)}
                  className="accent-[#76b900] w-4 h-4"
                />
                <span>السماح بخصومات إضافية في شاشة الكاشير</span>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-[#76b900] hover:bg-[#88d400] text-black font-black text-sm rounded-xl shadow-lg shadow-[#76b900]/25 transition-all cursor-pointer"
        >
          حفظ جميع الإعدادات
        </button>
      </form>

      {/* Cloud Integration & Multi-device Sync Box */}
      <div className="bg-[#12151e] border border-[#273044] rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                الربط السحابي والمزامنة بين الأجهزة (Supabase / PostgreSQL)
                {cloudService.isConfigured() ? (
                  <span className="text-[10px] bg-green-950/60 text-green-400 font-bold px-2 py-0.5 rounded-full border border-green-800">
                    مهيأ ومتصل
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-950/60 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-800">
                    وضع محلي فقط
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                مزامنة المخزون، الأسعار، الفواتير، وحسابات الكاشير بين فروع وأجهزة متعددة في الوقت الفعلي.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCloudModal}
            className="px-4 py-2 bg-[#76b900] hover:bg-[#85ce00] text-black text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Cloud className="w-4 h-4" />
            إدارة الربط والمزامنة السحابية
          </button>
        </div>
      </div>

      {/* Section 3: Backup, Restore & CSV Exchange */}
      <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-[#76b900]" />
          النسخ الاحتياطي واستيراد وتصدير البيانات
        </h3>
        <p className="text-xs text-slate-400">
          تعتمد البيانات على تخزين محلي دائم (IndexedDB/LocalStorage). نوصي بتنزيل نسخة احتياطية دورياً لحفظ بياناتك.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Full Backup Download */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-4 bg-[#0d1017] hover:bg-[#161a26] border border-[#272f44] rounded-xl flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
          >
            <Download className="w-6 h-6 text-[#76b900] group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">تنزيل نسخة احتياطية كاملة</div>
            <div className="text-[10px] text-slate-400">ملف JSON شامل الكتالوج والفواتير</div>
          </button>

          {/* Backup Restore */}
          <label className="p-4 bg-[#0d1017] hover:bg-[#161a26] border border-[#272f44] rounded-xl flex flex-col items-center text-center gap-2 transition-all cursor-pointer group">
            <Upload className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">استعادة نسخة احتياطية</div>
            <div className="text-[10px] text-slate-400">تحميل ملف JSON سابق</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          {/* CSV Export */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-4 bg-[#0d1017] hover:bg-[#161a26] border border-[#272f44] rounded-xl flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
          >
            <FileSpreadsheet className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">تصدير المنتجات لـ CSV</div>
            <div className="text-[10px] text-slate-400">ملف إكسل بالأسعار والباركود</div>
          </button>

          {/* CSV Import */}
          <label className="p-4 bg-[#0d1017] hover:bg-[#161a26] border border-[#272f44] rounded-xl flex flex-col items-center text-center gap-2 transition-all cursor-pointer group">
            <FileText className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">استيراد منتجات من CSV</div>
            <div className="text-[10px] text-slate-400">إضافة دفعات أصناف بباركود تلقائي</div>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Section 4: Demo Data Management */}
      <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-amber-400" />
          إدارة البيانات التجريبية والتصفير
        </h3>
        <p className="text-xs text-slate-400">
          يمكنك تجربة النظام أو مسح البيانات التجريبية بأمان دون المساس ببياناتك الحقيقية.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="px-4 py-2 bg-[#1a202e] hover:bg-[#222a3d] text-slate-200 text-xs font-bold rounded-xl border border-[#2e374d] transition-colors"
          >
            تحميل أجهزة وبيانات تجريبية (RTX 4090/4080 ولابتوبات)
          </button>

          <button
            type="button"
            onClick={handleClearDemo}
            className="px-4 py-2 bg-amber-950/30 hover:bg-amber-950/60 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-colors"
          >
            حذف البيانات التجريبية بأمان
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-950/30 hover:bg-red-950/60 text-red-400 text-xs font-bold rounded-xl border border-red-500/30 transition-colors mr-auto"
          >
            تصفير النظام بالكامل (مسح شامل)
          </button>
        </div>
      </div>
    </div>
  );
};
