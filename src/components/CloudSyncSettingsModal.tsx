import React, { useState, useEffect } from 'react';
import { CloudConfig, CloudSyncStatus } from '../types';
import { cloudService } from '../services/supabase';
import { storage } from '../services/storage';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  ShieldCheck,
  Download,
  Key,
  Globe,
  X,
  FileCode,
  ArrowDownCircle,
  Copy,
  Check
} from 'lucide-react';

interface CloudSyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshLocalData: () => void;
}

export const CloudSyncSettingsModal: React.FC<CloudSyncSettingsModalProps> = ({
  isOpen,
  onClose,
  onRefreshLocalData
}) => {
  const [config, setConfig] = useState<CloudConfig>(cloudService.getConfig());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(cloudService.getSyncStatus());
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    importedCount: { products: number; invoices: number; categories: number };
    backupTimestamp: string;
    error?: string;
  } | null>(null);
  const [showSqlViewer, setShowSqlViewer] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const unsub = cloudService.subscribe(setSyncStatus);
    setConfig(cloudService.getConfig());
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    cloudService.saveConfig(config);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    handleSaveConfig();
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await cloudService.testConnection();
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunMigration = async () => {
    handleSaveConfig();
    setIsMigrating(true);
    setMigrationLog([]);
    setMigrationResult(null);

    const localData = {
      products: storage.getProducts(),
      categories: storage.getCategories(),
      invoices: storage.getInvoices(),
      settings: storage.getSettings()
    };

    try {
      const res = await cloudService.migrateLocalDataToCloud(localData, msg => {
        setMigrationLog(prev => [...prev, msg]);
      });
      setMigrationResult(res);
      if (res.success) {
        onRefreshLocalData();
      }
    } catch (err: any) {
      setMigrationResult({
        success: false,
        importedCount: { products: 0, invoices: 0, categories: 0 },
        backupTimestamp: '',
        error: err?.message || 'فشل الترحيل'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handlePullCloudData = async () => {
    setIsMigrating(true);
    setMigrationLog(['جاري تنزيل أحدث البيانات المشتركة من السحابة...']);
    try {
      const res = await cloudService.pullAllFromCloud();
      if (res.error) {
        setMigrationLog(prev => [...prev, `خطأ: ${res.error}`]);
      } else {
        // Save to local storage
        if (res.products.length > 0) {
          // Backup before overwrite
          storage.createMigrationSnapshot('قبل سحب بيانات السحابة');
          localStorage.setItem('rtx_store_products_v2', JSON.stringify(res.products));
          localStorage.setItem('rtx_store_categories_v2', JSON.stringify(res.categories));
          localStorage.setItem('rtx_store_invoices_v2', JSON.stringify(res.invoices));
          onRefreshLocalData();
          setMigrationLog(prev => [
            ...prev,
            `تم تحديث البيانات المحلية بنجاح: ${res.products.length} منتج و ${res.invoices.length} فاتورة.`
          ]);
        }
      }
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDownloadBackup = () => {
    const json = storage.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rtx_store_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-['Cairo',sans-serif]">
      <div className="w-full max-w-2xl bg-[#111520] border border-[#273044] rounded-3xl p-6 shadow-2xl text-right max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#21293a] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center border border-[#76b900]/30 shadow-md">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                إعدادات السحابة والمزامنة بين الأجهزة
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    syncStatus.isConnected
                      ? 'bg-green-950/60 text-green-400 border-green-800'
                      : 'bg-amber-950/60 text-amber-400 border-amber-800'
                  }`}
                >
                  {syncStatus.isConnected ? 'متصل بالسحابة' : 'وضع محلي'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ربط النظام بقاعدة بيانات PostgreSQL السحابية (Supabase) مع الحفاظ على البيانات المحلية
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

        {/* Configuration Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#76b900]" />
              رابط مشروع Supabase (Project URL):
            </label>
            <input
              type="text"
              value={config.supabaseUrl}
              onChange={e => setConfig({ ...config, supabaseUrl: e.target.value.trim() })}
              placeholder="https://xyzabcdefghijklmn.supabase.co"
              dir="ltr"
              className="w-full bg-[#0a0d14] border border-[#273044] focus:border-[#76b900] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-[#76b900]" />
              المفتاح العام / Anon Key:
            </label>
            <input
              type="password"
              value={config.supabaseAnonKey}
              onChange={e => setConfig({ ...config, supabaseAnonKey: e.target.value.trim() })}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              dir="ltr"
              className="w-full bg-[#0a0d14] border border-[#273044] focus:border-[#76b900] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !config.supabaseUrl || !config.supabaseAnonKey}
              className="px-4 py-2 bg-[#1b2538] hover:bg-[#25324c] disabled:opacity-50 text-slate-200 text-xs font-bold rounded-xl border border-[#2d3a54] flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              اختبار الاتصال الآن
            </button>

            <button
              type="button"
              onClick={() => setShowSqlViewer(!showSqlViewer)}
              className="text-xs text-[#76b900] hover:underline flex items-center gap-1.5"
            >
              <FileCode className="w-4 h-4" />
              عرض كود تهيئة قاعدة البيانات (SQL Schema)
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-green-950/40 border border-green-800 text-green-300'
                  : 'bg-red-950/40 border border-red-800 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* SQL Schema Preview Collapsible */}
        {showSqlViewer && (
          <div className="mb-6 bg-[#0a0d14] border border-[#242c3e] rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-white">
                قم بلصق هذا الكود في Supabase SQL Editor لإنشاء الجداول وسياسات الحماية (RLS):
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `-- Run supabase/migrations/20261021_initial_schema.sql`
                  );
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="text-[11px] text-[#76b900] flex items-center gap-1 bg-[#141d2c] px-2 py-1 rounded-lg"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'تم النسخ!' : 'نسخ الكود'}
              </button>
            </div>
            <pre
              className="text-[10px] text-slate-300 font-mono bg-[#05070a] p-3 rounded-xl max-h-40 overflow-y-auto leading-relaxed"
              dir="ltr"
            >
              {`-- Tables: profiles, categories, products, invoices, invoice_items, stock_adjustments
-- Row Level Security (RLS) is strictly enabled on all tables
-- Triggers for first-admin auto setup and audit trails
-- File available at: /supabase/migrations/20261021_initial_schema.sql`}
            </pre>
          </div>
        )}

        {/* Migration & Sync Section */}
        <div className="bg-[#151b28] border border-[#252f44] rounded-2xl p-4 mb-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Database className="w-4 h-4 text-[#76b900]" />
            ترحيل البيانات المحلية إلى السحابة مع النسخ الاحتياطي:
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            يقوم الترحيل بإنشاء نسخة احتياطية محلية فورية قبل أي تعديل، فحص تعارضات الباركود، تثبيت أكواد الباركود الحالية دون تغيير، ونقل المنتجات والفواتير السابقة إلى قاعدة بيانات Supabase.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleRunMigration}
              disabled={isMigrating || !syncStatus.isConfigured}
              className="px-4 py-2 bg-[#76b900] hover:bg-[#85ce00] disabled:opacity-50 text-black text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
              بدء ترحيل ومزامنة البيانات الآن
            </button>

            <button
              type="button"
              onClick={handlePullCloudData}
              disabled={isMigrating || !syncStatus.isConfigured}
              className="px-4 py-2 bg-[#1b2538] hover:bg-[#25324c] disabled:opacity-50 text-slate-200 text-xs font-bold rounded-xl border border-[#2d3a54] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-[#76b900]" />
              سحب البيانات المشتركة من السحابة
            </button>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-3.5 py-2 bg-[#171d29] hover:bg-[#21293a] text-slate-300 text-xs font-bold rounded-xl border border-[#283246] flex items-center gap-1.5 cursor-pointer mr-auto"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              تنزيل نسخة احتياطية (JSON)
            </button>
          </div>

          {/* Migration Live Log */}
          {migrationLog.length > 0 && (
            <div className="mt-3 p-3 bg-[#090c12] rounded-xl border border-[#1f2638] space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold">سجل عملية المزامنة:</span>
              {migrationLog.map((log, i) => (
                <div key={i} className="text-[11px] text-[#76b900] font-mono">
                  ✓ {log}
                </div>
              ))}
            </div>
          )}

          {migrationResult && (
            <div
              className={`p-3 rounded-xl text-xs ${
                migrationResult.success
                  ? 'bg-green-950/40 border border-green-800 text-green-300'
                  : 'bg-red-950/40 border border-red-800 text-red-300'
              }`}
            >
              {migrationResult.success ? (
                <div>
                  <div className="font-bold mb-1">✓ اكتمل الترحيل والمزامنة بنجاح تام!</div>
                  <div className="text-[11px] opacity-90">
                    تم نقل: {migrationResult.importedCount.products} منتج، {migrationResult.importedCount.invoices} فاتورة، {migrationResult.importedCount.categories} أقسام.
                    <br />
                    تم حفظ نسخة استرجاع محلية برقم: {migrationResult.backupTimestamp}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-bold mb-1">خطأ أثناء الترحيل:</div>
                  <div className="text-[11px]">{migrationResult.error}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[#21293a]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#1b212f] hover:bg-[#232b3d] text-white rounded-xl text-xs font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
