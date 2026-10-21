import React, { useState } from 'react';
import { AppUser } from '../types';
import { cloudService } from '../services/supabase';
import { ShieldCheck, User, Mail, Lock, CheckCircle2, AlertCircle, X, KeyRound } from 'lucide-react';

interface InitialAdminSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admin: AppUser) => void;
}

export const InitialAdminSetupModal: React.FC<InitialAdminSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [displayName, setDisplayName] = useState('المدير العام');
  const [username, setUsername] = useState('admin');
  const [email, setEmail] = useState('admin@rtxstore.local');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!displayName.trim()) {
      setErrorMessage('يرجى كتابة الاسم الكامل للمدير');
      return;
    }

    if (!username.trim() || username.length < 3) {
      setErrorMessage('اسم المستخدم يجب ألا يقل عن 3 أحرف إنجليزية');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('يرجى كتابة بريد إلكتروني صالح');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('كلمة المرور يجب ألا تقل عن 6 خانات لضمان أمان النظام');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين');
      return;
    }

    setIsLoading(true);
    try {
      const res = await cloudService.bootstrapFirstAdmin({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password
      });

      if (res.error || !res.user) {
        setErrorMessage(res.error || 'تعذر إنشاء حساب المدير');
      } else {
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-['Cairo',sans-serif]">
      <div className="w-full max-w-lg bg-[#111520] border border-[#273044] rounded-3xl p-6 sm:p-8 shadow-2xl relative text-right">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-[#21293a]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center border border-[#76b900]/30 shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                تهيئة حساب المدير المسؤول الأول (Super Admin)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تأسيس الحساب المالك للنظام بصلاحيات كاملة مع إغلاق التسجيل العام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#1a202e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Alert */}
        <div className="mb-6 p-3.5 bg-blue-950/40 border border-blue-800/50 rounded-2xl text-xs text-blue-200 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 mb-1 text-blue-300">
            <KeyRound className="w-4 h-4 text-[#76b900]" />
            حماية بيانات المتجر:
          </p>
          هذا الحساب سيمتلك الصلاحية المطلقة لإدارة الأسعار، صلاحيات الكاشير، إلغاء الفواتير، ومزامنة السحابة. لا يتم تخزين كلمات المرور كنص صريح.
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الاسم الكامل للمدير:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="مثال: م. مينا عبد التواب"
                required
                className="w-full bg-[#0a0d14] border border-[#273044] focus:border-[#76b900] rounded-xl px-3.5 py-2.5 text-white text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اسم المستخدم (Username):
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                dir="ltr"
                required
                className="w-full bg-[#0a0d14] border border-[#273044] focus:border-[#76b900] rounded-xl px-3.5 py-2.5 text-white text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              البريد الإلكتروني للإدارة:
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@rtxstore.com"
              dir="ltr"
              required
              className="w-full bg-[#0a0d14] border border-[#273044] focus:border-[#76b900] rounded-xl px-3.5 py-2.5 text-white text-xs outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                كلمة المرور:
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                required
                className="w-full bg-[#0a0d14] border border-[#273044] focus:border-[#76b900] rounded-xl px-3.5 py-2.5 text-white text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                تأكيد كلمة المرور:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                required
                className="w-full bg-[#0a0d14] border border-[#273044] focus:border-[#76b900] rounded-xl px-3.5 py-2.5 text-white text-xs outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#21293a]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 bg-[#181e2b] hover:bg-[#202738] text-slate-300 text-xs font-bold rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-[#76b900] hover:bg-[#88d400] text-black text-xs font-black rounded-xl shadow-lg shadow-[#76b900]/20 flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  جاري الإنشاء والربط...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  حفظ وتأكيد حساب المدير المسؤول
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
