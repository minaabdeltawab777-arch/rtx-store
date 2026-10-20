import React, { useState } from 'react';
import { Invoice, StoreSettings } from '../types';
import { formatEGP, formatDateArabic, formatTimeOnly, getCairoDateString, getCairoYesterdayString } from '../utils/formatters';
import { ReceiptModal } from '../components/ReceiptModal';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  Smartphone,
  Calendar,
  Layers,
  Printer,
  ShoppingBag,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface DailySalesViewProps {
  invoices: Invoice[];
  settings: StoreSettings;
}

export const DailySalesView: React.FC<DailySalesViewProps> = ({ invoices, settings }) => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filter completed invoices only
  const completedInvoices = invoices.filter(inv => inv.status === 'completed');

  // Dates for comparison in Africa/Cairo timezone
  const cairoToday = getCairoDateString(new Date());
  const cairoYesterday = getCairoYesterdayString();
  const weekAgoTime = Date.now() - 7 * 86400000;

  const filteredInvoices = completedInvoices.filter(inv => {
    const invCairoDate = getCairoDateString(new Date(inv.createdAt));
    const invTime = new Date(inv.createdAt).getTime();

    if (period === 'today') {
      return invCairoDate === cairoToday;
    }
    if (period === 'yesterday') {
      return invCairoDate === cairoYesterday;
    }
    if (period === 'week') {
      return invTime >= weekAgoTime;
    }
    if (period === 'custom') {
      if (customStartDate && invCairoDate < customStartDate) return false;
      if (customEndDate && invCairoDate > customEndDate) return false;
      return true;
    }
    return true;
  });

  // Calculate Metrics
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalInvoicesCount = filteredInvoices.length;
  const totalItemsSold = filteredInvoices.reduce(
    (sum, inv) => sum + inv.items.reduce((acc, item) => acc + item.quantity, 0),
    0
  );
  const averageInvoiceValue = totalInvoicesCount > 0 ? totalSales / totalInvoicesCount : 0;

  // Breakdown by payment method
  const paymentBreakdown = {
    cash: filteredInvoices
      .filter(i => i.paymentMethod === 'cash')
      .reduce((s, i) => s + i.total, 0),
    card: filteredInvoices
      .filter(i => i.paymentMethod === 'card')
      .reduce((s, i) => s + i.total, 0),
    bank_transfer: filteredInvoices
      .filter(i => i.paymentMethod === 'bank_transfer')
      .reduce((s, i) => s + i.total, 0),
    other: filteredInvoices
      .filter(i => i.paymentMethod === 'other')
      .reduce((s, i) => s + i.total, 0)
  };

  const periodLabels = {
    today: 'اليوم',
    yesterday: 'أمس',
    week: 'آخر 7 أيام',
    custom: 'فترة مخصصة'
  };

  const exportSalesCSV = () => {
    if (filteredInvoices.length === 0) {
      alert('لا توجد مبيعات في هذه الفترة لتصديرها');
      return;
    }

    const headers = ['رقم الفاتورة', 'التاريخ والوقت', 'اسم العميل', 'طريقة الدفع', 'المجموع الفرعي', 'الخصم', 'الصافي النهائي'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      formatDateArabic(inv.createdAt),
      inv.customerName || 'عميل نقدي',
      inv.paymentMethod,
      inv.subtotal,
      inv.discount,
      inv.total
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RTX_Sales_${period}_${cairoToday}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Period Selector */}
      <div className="bg-[#131722] border border-[#262c3e] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">تقرير مبيعات الكاشير اليومية</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                إحصائيات دقيقة محسوبة من فواتير البيع المكتملة الفعالة بتوقيت القاهرة.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector buttons */}
          <div className="bg-[#0d1017] p-1 rounded-xl border border-[#262c3e] flex items-center">
            {(['today', 'yesterday', 'week', 'custom'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  period === p
                    ? 'bg-[#76b900] text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>

          <button
            onClick={exportSalesCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#76b900]" />
            تصدير تقرير CSV
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {period === 'custom' && (
        <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-4 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">من تاريخ:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="bg-[#0d1017] border border-[#272f44] text-white rounded-lg px-2.5 py-1.5 font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">إلى تاريخ:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="bg-[#0d1017] border border-[#272f44] text-white rounded-lg px-2.5 py-1.5 font-mono"
            />
          </div>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Sales */}
        <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي قيمة المبيعات ({periodLabels[period]}):</span>
            <span className="w-8 h-8 rounded-lg bg-[#76b900]/20 text-[#76b900] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-[#76b900]">
            {formatEGP(totalSales)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            صافي المبالغ المحصلة فعلياً
          </div>
        </div>

        {/* Metric 2: Invoices Count */}
        <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">عدد الفواتير المكتملة:</span>
            <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {totalInvoicesCount} <span className="text-sm font-normal text-slate-400">فاتورة</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            لا تشمل الفواتير الملغاة
          </div>
        </div>

        {/* Metric 3: Items Sold */}
        <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">عدد القطع والأجهزة المباعة:</span>
            <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {totalItemsSold} <span className="text-sm font-normal text-slate-400">قطعة</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            مجموع كميات كافة الأصناف
          </div>
        </div>

        {/* Metric 4: Average Basket */}
        <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">متوسط قيمة الفاتورة:</span>
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatEGP(averageInvoiceValue)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            متوسط إنفاق العميل للعملية الواحدة
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown Grid */}
      <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#76b900]" />
          توزيع المبيعات بحسب طريقة الدفع
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Cash */}
          <div className="p-3.5 bg-[#0d1017] rounded-xl border border-[#242b3d] flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                نقدي (كاش في الدرج)
              </div>
              <div className="text-base font-bold font-mono text-white">
                {formatEGP(paymentBreakdown.cash)}
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-slate-500">
              {totalSales > 0 ? Math.round((paymentBreakdown.cash / totalSales) * 100) : 0}%
            </div>
          </div>

          {/* Card */}
          <div className="p-3.5 bg-[#0d1017] rounded-xl border border-[#242b3d] flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                بطاقات بنكية (POS فيزا)
              </div>
              <div className="text-base font-bold font-mono text-white">
                {formatEGP(paymentBreakdown.card)}
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-slate-500">
              {totalSales > 0 ? Math.round((paymentBreakdown.card / totalSales) * 100) : 0}%
            </div>
          </div>

          {/* InstaPay / Transfer */}
          <div className="p-3.5 bg-[#0d1017] rounded-xl border border-[#242b3d] flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                تحويل بنكي / InstaPay
              </div>
              <div className="text-base font-bold font-mono text-white">
                {formatEGP(paymentBreakdown.bank_transfer)}
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-slate-500">
              {totalSales > 0 ? Math.round((paymentBreakdown.bank_transfer / totalSales) * 100) : 0}%
            </div>
          </div>

          {/* Other */}
          <div className="p-3.5 bg-[#0d1017] rounded-xl border border-[#242b3d] flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                طرق دفع أخرى
              </div>
              <div className="text-base font-bold font-mono text-white">
                {formatEGP(paymentBreakdown.other)}
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-slate-500">
              {totalSales > 0 ? Math.round((paymentBreakdown.other / totalSales) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Feed for Selected Period */}
      <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-[#181d2a] border-b border-[#262c3d] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#76b900]" />
            فواتير مبيعات الفترة المحددة ({filteredInvoices.length} فاتورة)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#141824] border-b border-[#262c3d] text-slate-300 font-bold">
                <th className="py-3 px-4 font-mono">رقم الفاتورة</th>
                <th className="py-3 px-4">الوقت</th>
                <th className="py-3 px-4">العميل</th>
                <th className="py-3 px-4 text-center">القطع المباعة</th>
                <th className="py-3 px-4 text-left">طريقة الدفع</th>
                <th className="py-3 px-4 text-left">الصافي</th>
                <th className="py-3 px-4 text-center">إعادة طباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202534]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    لا توجد عمليات بيع مسجلة في هذه الفترة.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const itemsCount = inv.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr key={inv.id} className="hover:bg-[#161a26]/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {formatTimeOnly(inv.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {inv.customerName || 'عميل نقدي'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {itemsCount} قطعة
                      </td>
                      <td className="py-3 px-4 text-left text-slate-300">
                        {inv.paymentMethod === 'cash'
                          ? 'نقدي'
                          : inv.paymentMethod === 'card'
                          ? 'فيزا'
                          : inv.paymentMethod === 'bank_transfer'
                          ? 'انستاباي'
                          : 'أخرى'}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-black text-[#76b900]">
                        {formatEGP(inv.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 bg-[#76b900]/15 hover:bg-[#76b900] text-[#76b900] hover:text-black font-bold text-[11px] rounded-lg transition-colors border border-[#76b900]/30"
                        >
                          طباعة
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedInvoice && (
        <ReceiptModal
          invoice={selectedInvoice}
          settings={settings}
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
