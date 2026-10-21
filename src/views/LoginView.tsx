import React, { useState, useEffect } from 'react';
import { AppUser, CloudSyncStatus } from '../types';
import { cloudService } from '../services/supabase';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Zap,
  AlertCircle,
  Cloud,
  CheckCircle2,
  Settings,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
  onOpenInitialSetup: () => void;
  onOpenCloudConfig: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onOpenInitialSetup,
  onOpenCloudConfig
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(cloudService.getSyncStatus());

  useEffect(() => {
    const unsub = cloudService.subscribe(setSyncStatus);
    checkFirstUser();
    return unsub;
  }, []);

  const checkFirstUser = async () => {
    try {
      const isFirst = await cloudService.checkIsFirstUser();
      setIsFirstRun(isFirst);
    } catch {
      setIsFirstRun(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage('يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
      return;
    }

    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور');
      return;
    }

    setIsLoading(true);
    try {
      const res = await cloudService.login(cleanId, password);
      if (res.error || !res.user) {
        setErrorMessage(res.error || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
      } else {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col justify-center items-center p-4 selection:bg-[#76b900]/30 selection:text-white relative overflow-hidden font-['Cairo',sans-serif]">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#76b900]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Cloud & Server Status Pill */}
      <div className="mb-6 flex items-center gap-3 bg-[#111520] border border-[#222a3d] px-4 py-2 rounded-full text-xs text-slate-300 shadow-xl">
        {syncStatus.isConnected ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-[#76b900] animate-pulse" />
            <span className="font-bold flex items-center gap-1.5 text-slate-200">
              <Cloud className="w-4 h-4 text-[#76b900]" />
              متصل بقاعدة البيانات السحابية (Supabase)
            </span>
          </>
        ) : syncStatus.isConfigured ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="font-medium flex items-center gap-1.5 text-amber-300">
              <Cloud className="w-4 h-4 text-amber-400" />
              تم إعداد السحابة (جاري المزامنة / التحقق)
            </span>
          </>
        ) : (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="font-medium flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              النظام يعمل بالوضع المحلي المحمي
            </span>
          </>
        )}

        <button
          onClick={onOpenCloudConfig}
          className="text-[11px] text-[#76b900] hover:underline flex items-center gap-1 pr-2 border-r border-[#262f44] cursor-pointer"
          title="إعدادات الاتصال السحابي"
        >
          <Settings className="w-3.5 h-3.5" />
          إعدادات السحابة
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#10141f] border border-[#232b3e] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#76b900] to-[#477300] text-black flex items-center justify-center font-black shadow-xl shadow-[#76b900]/20">
            <Zap className="w-9 h-9 fill-black" />
          </div>
          <h1 className="text-2xl font-black text-white font-mono tracking-wider flex items-center justify-center gap-2">
            RTX <span className="text-[#76b900]">STORE</span>
            <span className="text-[10px] bg-[#76b900]/20 text-[#76b900] font-black px-2 py-0.5 rounded-full border border-[#76b900]/30 uppercase">
              POS PRO
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            تسجيل الدخول لنظام الكاشير وإدارة المبيعات والمخزون
          </p>
        </div>

        {/* First Run / Initial Admin Notification */}
        {isFirstRun && (
          <div className="mb-6 p-4 bg-[#142013] border border-[#2f5517] rounded-2xl">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#76b900] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white mb-1">
                  مرحباً بك! لا يوجد حساب مدير مسؤول بعد
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                  لبدء تشغيل النظام لأول مرة بأمان تام، يرجى تهيئة حساب المدير المسؤول (Owner).
                </p>
                <button
                  type="button"
                  onClick={onOpenInitialSetup}
                  className="w-full py-2 bg-[#76b900] hover:bg-[#88d400] text-black font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  إنشاء حساب المدير المسؤول الأول الآن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم المستخدم أو البريد الإلكتروني:
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="مثال: admin أو cashier1"
                autoComplete="username"
                dir="ltr"
                className="w-full bg-[#0a0d14] border border-[#262f44] focus:border-[#76b900] rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-500 text-sm outline-none transition-colors"
                disabled={isLoading}
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              كلمة المرور:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                dir="ltr"
                className="w-full bg-[#0a0d14] border border-[#262f44] focus:border-[#76b900] rounded-xl px-4 py-3 pl-10 pr-10 text-white placeholder-slate-500 text-sm outline-none transition-colors"
                disabled={isLoading}
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 bg-[#76b900] hover:bg-[#85ce00] disabled:opacity-50 text-black font-black text-sm rounded-xl shadow-lg shadow-[#76b900]/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                جاري التحقق وتسجيل الدخول...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </>
            )}
          </button>
        </form>

        {/* Security & Access Notice */}
        <div className="mt-8 pt-5 border-t border-[#1d2435] text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-[#76b900]" />
            <span>نظام محمي بصلاحيات الأدوار المشفرة (RBAC)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            لا يوجد تسجيل عام. يتم إصدار حسابات الكاشير حصرياً بواسطة مدير النظام.
          </p>
        </div>
      </div>
    </div>
  );
};
