import React from 'react';
import {
  PackagePlus,
  FileSpreadsheet,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ScanLine
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onAddFirstProduct: () => void;
  onLoadDemoData: () => void;
  onGoToSettings: () => void;
  onGoToLabels: () => void;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onAddFirstProduct,
  onLoadDemoData,
  onGoToSettings,
  onGoToLabels,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#12151e] border-2 border-[#2b354c] rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#76b900] via-emerald-400 to-[#76b900]" />

        <div className="text-center space-y-2 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#76b900]/20 text-[#76b900] mx-auto flex items-center justify-center font-black text-xl mb-3 shadow-lg shadow-[#76b900]/15">
            <ScanLine className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            مرحباً بك في نظام <span className="text-[#76b900]">RTX STORE</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            كتالوج المنتجات فارغ حالياً. اختر كيف تفضل البدء في إعداد متجرك ونظام الكاشير والباركود:
          </p>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          {/* Option 1: Load Demo Data */}
          <div
            onClick={onLoadDemoData}
            className="p-4 bg-[#161a26] hover:bg-[#1d2333] border border-[#2b3449] hover:border-[#76b900] rounded-2xl cursor-pointer transition-all group flex flex-col justify-between text-right"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#76b900] transition-colors">
                تجربة النظام بكتالوج واقعي
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تحميل أجهزة لابتوب جيمنج وكروت شاشة وماك بوك ومواصفات حقيقية لتجربة الكاشير والباركود فوراً.
              </p>
            </div>
            <div className="text-xs font-bold text-[#76b900] mt-3 flex items-center gap-1">
              تحميل البيانات التجريبية ←
            </div>
          </div>

          {/* Option 2: Add First Product */}
          <div
            onClick={onAddFirstProduct}
            className="p-4 bg-[#161a26] hover:bg-[#1d2333] border border-[#2b3449] hover:border-[#76b900] rounded-2xl cursor-pointer transition-all group flex flex-col justify-between text-right"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PackagePlus className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                إضافة أول منتج يدوي
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                أدخل أول جهاز أو قطعة هاردوير مع مواصفاتها وسعر البيع لتوليد باركود فريد لها.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-400 mt-3 flex items-center gap-1">
              إضافة منتج الآن ←
            </div>
          </div>

          {/* Option 3: Import CSV */}
          <div
            onClick={onGoToSettings}
            className="p-4 bg-[#161a26] hover:bg-[#1d2333] border border-[#2b3449] hover:border-[#76b900] rounded-2xl cursor-pointer transition-all group flex flex-col justify-between text-right"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                استيراد من ملف Excel / CSV
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                استيراد قائمة أصناف بأسعارها مع التوليد التلقائي للباركود الداخلي الموحد.
              </p>
            </div>
            <div className="text-xs font-bold text-purple-400 mt-3 flex items-center gap-1">
              الانتقال للاستيراد ←
            </div>
          </div>

          {/* Option 4: Setup Labels */}
          <div
            onClick={onGoToLabels}
            className="p-4 bg-[#161a26] hover:bg-[#1d2333] border border-[#2b3449] hover:border-[#76b900] rounded-2xl cursor-pointer transition-all group flex flex-col justify-between text-right"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                إعداد استيكرات الباركود
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ضبط مقاس الملصق الحراري (40x25، 50x30، أو مخصص) وشكل الباركود.
              </p>
            </div>
            <div className="text-xs font-bold text-amber-400 mt-3 flex items-center gap-1">
              إعدادات الاستيكرات ←
            </div>
          </div>
        </div>

        {/* Footer skip */}
        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
          >
            تخطي والبدء بكتالوج فارغ
          </button>
        </div>
      </div>
    </div>
  );
};
