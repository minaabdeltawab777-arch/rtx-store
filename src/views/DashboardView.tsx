import React from 'react';
import { Product, Invoice, StoreSettings } from '../types';
import { formatEGP, formatDateArabic, formatTimeOnly, getCairoDateString } from '../utils/formatters';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  Printer,
  Plus,
  ArrowRight,
  ScanLine,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  invoices: Invoice[];
  settings: StoreSettings;
  onNavigate: (tab: any) => void;
  onOpenProductForm: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  invoices,
  settings,
  onNavigate,
  onOpenProductForm,
  onSelectInvoice
}) => {
  const cairoToday = getCairoDateString(new Date());

  const todayCompletedInvoices = invoices.filter(
    inv => inv.status === 'completed' && getCairoDateString(new Date(inv.createdAt)) === cairoToday
  );

  const todaySalesTotal = todayCompletedInvoices.reduce((sum, i) => sum + i.total, 0);

  const lowStockProducts = products.filter(
    p => p.stockTracking && p.stockQuantity <= (p.minStockAlert || 1)
  );

  const recentInvoices = invoices.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-[#11141d] via-[#161b27] to-[#121622] border border-[#262c3e] rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-transparent to-[#76b900]/5 pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#76b900]/15 border border-[#76b900]/30 rounded-full text-xs font-bold text-[#76b900]">
              <ScanLine className="w-3.5 h-3.5" />
              نظام الكاشير والباركود متصل وجاهز للعمل
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              مرحباً بك في نظام <span className="text-[#76b900]">{settings.storeName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              إدارة احترافية متكاملة لكتالوج الهاردوير واللابتوبات، طباعة استيكرات الباركود الحرارية، ومبيعات الكاشير السريعة.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('cashier')}
              className="px-5 py-3 bg-[#76b900] hover:bg-[#88d400] text-black font-black text-sm rounded-xl flex items-center gap-2 shadow-xl shadow-[#76b900]/25 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              بدء بيع جديد (الكاشير)
            </button>

            <button
              onClick={onOpenProductForm}
              className="px-4 py-3 bg-[#181d2a] hover:bg-[#202738] text-white font-bold text-xs sm:text-sm rounded-xl border border-[#2b3449] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#76b900]" />
              إضافة منتج جديد
            </button>

            <button
              onClick={() => onNavigate('labels')}
              className="px-4 py-3 bg-[#181d2a] hover:bg-[#202738] text-white font-bold text-xs sm:text-sm rounded-xl border border-[#2b3449] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              طباعة استيكرات
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today Sales */}
        <div
          onClick={() => onNavigate('daily_sales')}
          className="bg-[#12151e] border border-[#262c3d] hover:border-[#76b900]/50 rounded-2xl p-5 shadow-lg cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">مبيعات اليوم:</span>
            <span className="w-9 h-9 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-[#76b900]">
            {formatEGP(todaySalesTotal)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>من {todayCompletedInvoices.length} عمليات بيع</span>
            <span className="text-[#76b900] flex items-center gap-0.5 font-bold">
              التفاصيل <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Today Invoices */}
        <div
          onClick={() => onNavigate('invoices')}
          className="bg-[#12151e] border border-[#262c3d] hover:border-blue-500/50 rounded-2xl p-5 shadow-lg cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">فواتير اليوم:</span>
            <span className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {todayCompletedInvoices.length} <span className="text-xs font-normal text-slate-400">فاتورة</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>إجمالي الفواتير: {invoices.length}</span>
            <span className="text-blue-400 flex items-center gap-0.5 font-bold">
              السجل <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Catalog Products */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-[#12151e] border border-[#262c3d] hover:border-purple-500/50 rounded-2xl p-5 shadow-lg cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">إجمالي أصناف الكتالوج:</span>
            <span className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {products.length} <span className="text-xs font-normal text-slate-400">منتج</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>باركودات Code 128 جاهزة</span>
            <span className="text-purple-400 flex items-center gap-0.5 font-bold">
              الكتالوج <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-[#12151e] border border-[#262c3d] hover:border-amber-500/50 rounded-2xl p-5 shadow-lg cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">تنبيهات نواقص المخزون:</span>
            <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {lowStockProducts.length} <span className="text-xs font-normal text-slate-400">منتج منخفض</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>تحتاج لإعادة توريد</span>
            <span className="text-amber-400 flex items-center gap-0.5 font-bold">
              فحص <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Invoices & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Invoices Feed (7 Cols) */}
        <div className="lg:col-span-7 bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#262c3d]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#76b900]" />
              آخر الفواتير الصادرة
            </h3>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-[#76b900] hover:underline font-bold"
            >
              عرض السجل الكامل ←
            </button>
          </div>

          <div className="space-y-2.5">
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                لا توجد فواتير مسجلة حتى الآن.
              </div>
            ) : (
              recentInvoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="p-3 bg-[#0d1017] hover:bg-[#151926] rounded-xl border border-[#222738] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTimeOnly(inv.createdAt)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {inv.customerName || 'عميل نقدي'} • {inv.items.length} صنف ({inv.paymentMethod})
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <div className="text-xs font-black text-[#76b900]">
                      {formatEGP(inv.total)}
                    </div>
                    <span className="text-[10px] text-slate-500 hover:text-white underline">
                      طباعة
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Items (5 Cols) */}
        <div className="lg:col-span-5 bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#262c3d]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              أصناف قريبة من النفاد
            </h3>
            <span className="text-xs bg-amber-950 text-amber-400 px-2 py-0.5 rounded-full font-mono font-bold border border-amber-500/30">
              {lowStockProducts.length}
            </span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                جميع المنتجات المتتبعة في حدود المخزون الآمن ✓
              </div>
            ) : (
              lowStockProducts.map(p => (
                <div
                  key={p.id}
                  className="p-3 bg-[#0d1017] rounded-xl border border-[#222738] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.internalBarcode} • {formatEGP(p.price)}
                    </div>
                  </div>

                  <div className="text-center shrink-0">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        p.stockQuantity <= 0
                          ? 'bg-red-950 text-red-400 border border-red-500/30'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {p.stockQuantity} قطعة
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
