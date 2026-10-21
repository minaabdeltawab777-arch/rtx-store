import React, { useState } from 'react';
import { Invoice, AppUser } from '../types';
import { storage } from '../services/storage';
import { cloudService } from '../services/supabase';
import { formatEGP, formatDateShort } from '../utils/formatters';
import {
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  X,
  CheckCircle2,
  Lock,
  FileText,
  User,
  Package
} from 'lucide-react';

interface CancelInvoiceModalProps {
  invoice: Invoice;
  currentUser: AppUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  invoice,
  currentUser,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [restoreStock, setRestoreStock] = useState(true);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasDirectPermission =
    currentUser.role === 'owner' ||
    currentUser.role === 'admin' ||
    currentUser.permissions?.canCancelInvoices;

  const COMMON_REASONS = [
    'مرتجع بضاعة من العميل بحالتها الأصلية مع الفاتورة',
    'خطأ في تسجيل أصناف أو كميات الفاتورة بالكاشير',
    'إلغاء العملية بناءً على رغبة العميل قبل استلام الجهاز',
    'خطأ في تحديد طريقة الدفع (كاش/فيزا/إنستاباي)'
  ];

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanReason = reason.trim();
    if (!cleanReason || cleanReason.length < 4) {
      setErrorMessage('يرجى كتابة سبب مفصل لإلغاء الفاتورة (4 أحرف على الأقل)');
      return;
    }

    setIsLoading(true);

    try {
      let cancellingUser = {
        userId: currentUser.id,
        displayName: currentUser.displayName,
        role: currentUser.role
      };

      // If user lacks permission, verify admin credentials
      if (!hasDirectPermission) {
        if (!adminUsername || !adminPassword) {
          setErrorMessage('إلغاء الفواتير يتطلب تفويضاً من المدير المسؤول (اسم المستخدم وكلمة المرور)');
          setIsLoading(false);
          return;
        }

        const verifyRes = await cloudService.login(adminUsername, adminPassword);
        if (
          verifyRes.error ||
          !verifyRes.user ||
          (verifyRes.user.role !== 'owner' &&
            verifyRes.user.role !== 'admin' &&
            !verifyRes.user.permissions?.canCancelInvoices)
        ) {
          setErrorMessage('بيانات تفويض المدير غير صحيحة أو لا يملك صلاحية الإلغاء');
          setIsLoading(false);
          return;
        }

        cancellingUser = {
          userId: verifyRes.user.id,
          displayName: `${currentUser.displayName} (بتفويض: ${verifyRes.user.displayName})`,
          role: verifyRes.user.role
        };
      }

      const res = storage.cancelInvoice(invoice.id, cleanReason, cancellingUser, restoreStock);
      if (!res.success) {
        setErrorMessage(res.error || 'تعذر إلغاء الفاتورة');
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إلغاء الفاتورة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-['Cairo',sans-serif]">
      <div className="w-full max-w-lg bg-[#111520] border border-red-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-right relative">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#242b3d] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-950/40 text-red-400 flex items-center justify-center border border-red-800/50 shadow-md">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                إلغاء فاتورة بيع معتمدة
                <span className="text-xs bg-red-950/60 text-red-300 font-mono px-2.5 py-0.5 rounded-full border border-red-800/40">
                  {invoice.invoiceNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تاريخ البيع: {formatDateShort(invoice.createdAt)} • الكاشير: {invoice.cashierName || 'غير محدد'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#1a202e]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-[#0b0e14] border border-[#21283a] rounded-2xl p-3.5 mb-5 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>إجمالي الفاتورة المطلوب إلغاؤها:</span>
            <span className="font-mono font-bold text-white text-sm">
              {formatEGP(invoice.total)}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>عدد الأصناف بالفاتورة:</span>
            <span className="font-mono text-slate-200">
              {invoice.items.length} صنف (إجمالي {invoice.items.reduce((s, i) => s + i.quantity, 0)} قطعة)
            </span>
          </div>
          {invoice.customerName && (
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>اسم العميل:</span>
              <span className="text-slate-200">{invoice.customerName}</span>
            </div>
          )}
        </div>

        {/* Warning Note */}
        <div className="mb-5 p-3.5 bg-red-950/30 border border-red-800/40 rounded-2xl flex items-start gap-2.5 text-xs text-red-200 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-red-300">تنبيه مالي وإداري:</span>
            <br />
            لا يتم مسح الفاتورة من النظام لحفظ السجلات المحاسبية. سيتم تعديل حالتها إلى «ملغاة» واستبعاد قيمتها من صافي الإيرادات اليومية وتوثيق اسم المسؤول وسبب الإلغاء.
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleConfirmCancel} className="space-y-4">
          {/* Reason Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              سبب الإلغاء (إلزامي للرقابة والمراجعة):
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="اكتب سبب إلغاء الفاتورة بالتفصيل..."
              rows={2}
              required
              className="w-full bg-[#0a0d14] border border-[#273044] focus:border-red-500 rounded-xl p-3 text-white text-xs outline-none"
            />

            {/* Quick Reason Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_REASONS.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[10px] bg-[#141a28] hover:bg-[#1f283d] text-slate-300 px-2 py-1 rounded-lg border border-[#232b3f] transition-colors cursor-pointer"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Safe Inventory Reversal Toggle */}
          <div className="p-3 bg-[#0a0d14] border border-[#21293a] rounded-2xl">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={restoreStock}
                onChange={e => setRestoreStock(e.target.checked)}
                className="w-4 h-4 accent-[#76b900] rounded"
              />
              <span className="font-bold flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#76b900]" />
                استرجاع كميات الأصناف تلقائياً إلى رصيد المخزن (توصية)
              </span>
            </label>
            <p className="text-[10px] text-slate-400 mt-1 mr-6">
              إعادة إضافة الكميات المباعة في هذه الفاتورة وتسجيل حركة مخزن من نوع «إلغاء واسترجاع».
            </p>
          </div>

          {/* Admin Override Credentials if current user is not authorized */}
          {!hasDirectPermission && (
            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <Lock className="w-4 h-4" />
                يتطلب موافقة وتفويض المدير المسؤول:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    اسم مستخدم المدير:
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={e => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    dir="ltr"
                    className="w-full bg-[#0a0d14] border border-[#273044] rounded-xl px-3 py-2 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    كلمة مرور المدير:
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full bg-[#0a0d14] border border-[#273044] rounded-xl px-3 py-2 text-white text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#242b3d]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 bg-[#181e2b] hover:bg-[#202738] text-slate-300 text-xs font-bold rounded-xl"
            >
              تراجع
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري تسجيل الإلغاء...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  تأكيد إلغاء الفاتورة رسمياً
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
