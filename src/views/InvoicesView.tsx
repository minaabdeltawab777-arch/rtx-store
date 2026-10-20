import React, { useState } from 'react';
import { Invoice, StoreSettings } from '../types';
import { formatEGP, formatDateArabic, formatDateShort, getCairoDateString, getCairoYesterdayString } from '../utils/formatters';
import { storage } from '../services/storage';
import { ReceiptModal } from '../components/ReceiptModal';
import {
  Search,
  Printer,
  FileText,
  Calendar,
  XCircle,
  Eye,
  CheckCircle,
  User,
  Phone,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface InvoicesViewProps {
  invoices: Invoice[];
  settings: StoreSettings;
  onRefreshData: () => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  settings,
  onRefreshData
}) => {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const paymentLabels: Record<string, string> = {
    cash: 'نقدي (كاش)',
    card: 'بطاقة بنكية',
    bank_transfer: 'انستاباي / تحويل',
    other: 'أخرى'
  };

  // Filter logic in Africa/Cairo timezone
  const cairoToday = getCairoDateString(new Date());
  const cairoYesterday = getCairoYesterdayString();
  const weekAgoTime = Date.now() - 7 * 86400000;

  const filteredInvoices = invoices.filter(inv => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
      (inv.customerPhone && inv.customerPhone.includes(q)) ||
      inv.items.some(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.barcode.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          (item.serialNumber && item.serialNumber.toLowerCase().includes(q))
      );

    const matchPayment = paymentFilter === 'all' || inv.paymentMethod === paymentFilter;
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;

    let matchDate = true;
    const invCairoDate = getCairoDateString(new Date(inv.createdAt));
    const invTime = new Date(inv.createdAt).getTime();

    if (dateFilter === 'today') {
      matchDate = invCairoDate === cairoToday;
    } else if (dateFilter === 'yesterday') {
      matchDate = invCairoDate === cairoYesterday;
    } else if (dateFilter === 'week') {
      matchDate = invTime >= weekAgoTime;
    }

    return matchSearch && matchPayment && matchStatus && matchDate;
  });

  const handleCancelInvoice = (invoice: Invoice) => {
    if (confirm(`هل أنت متأكد من إلغاء الفاتورة (${invoice.invoiceNumber}) واسترجاع الأصناف للمخزون؟`)) {
      const res = storage.cancelInvoice(invoice.id, true);
      if (res.success) {
        onRefreshData();
      } else {
        alert(res.error || 'فشل إلغاء الفاتورة');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-[#131722] border border-[#262c3e] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">سجل الفواتير السابقة</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                تصفح واطبع أي فاتورة سابقة بنقرة واحدة مع الحفاظ التام على الأسعار واللقطة التاريخية.
              </p>
            </div>
          </div>
        </div>

        <div className="text-right pl-3 border-l border-slate-700/60 hidden sm:block">
          <div className="text-xs text-slate-400">إجمالي الفواتير المسجلة:</div>
          <div className="text-lg font-bold font-mono text-[#76b900]">
            {invoices.length} فاتورة
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl p-4 shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة، اسم العميل، الهاتف، أو الباركود..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl pr-9 pl-3 py-2.5 focus:border-[#76b900] focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none"
            >
              <option value="all">كل التواريخ</option>
              <option value="today">فواتير اليوم</option>
              <option value="yesterday">فواتير أمس</option>
              <option value="week">آخر 7 أيام</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none"
            >
              <option value="all">جميع طرق الدفع</option>
              <option value="cash">نقدي (كاش)</option>
              <option value="card">فيزا / بطاقة</option>
              <option value="bank_transfer">انستاباي / تحويل بنكي</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#0d1017] border border-[#272f44] text-white text-xs rounded-xl px-3 py-2.5 focus:border-[#76b900] focus:outline-none"
            >
              <option value="all">جميع الحالات (مكتملة / ملغاة)</option>
              <option value="completed">مكتملة فقط</option>
              <option value="cancelled">ملغاة فقط</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#181d2a] border-b border-[#262c3d] text-slate-300 font-bold">
                <th className="py-3.5 px-4 font-mono">رقم الفاتورة</th>
                <th className="py-3.5 px-4">التاريخ والوقت</th>
                <th className="py-3.5 px-4">العميل</th>
                <th className="py-3.5 px-4 text-center">الأصناف والقطع</th>
                <th className="py-3.5 px-4 text-left">طريقة الدفع</th>
                <th className="py-3.5 px-4 text-left">إجمالي الفاتورة</th>
                <th className="py-3.5 px-4 text-center">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202534]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    لا توجد فواتير مطابقة لبحثك.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(invoice => {
                  const totalItems = invoice.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr key={invoice.id} className="hover:bg-[#161a26]/70 transition-colors">
                      {/* Invoice # */}
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        <span className="bg-[#0d1017] px-2 py-1 rounded border border-[#262c3e] text-xs">
                          {invoice.invoiceNumber}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-300">
                        {formatDateArabic(invoice.createdAt)}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">
                            {invoice.customerName || 'عميل نقدي'}
                          </span>
                          {invoice.customerPhone && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {invoice.customerPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items count & summary */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono bg-slate-800 text-slate-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                          {totalItems} قطعة ({invoice.items.length} صنف)
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 text-left">
                        <span className="text-slate-300">
                          {paymentLabels[invoice.paymentMethod] || invoice.paymentMethod}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-left font-mono">
                        <div className="font-black text-[#76b900] text-sm">
                          {formatEGP(invoice.total)}
                        </div>
                        {invoice.discount > 0 && (
                          <div className="text-[10px] text-red-400">
                            خصم: -{formatEGP(invoice.discount)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            invoice.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-950 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {invoice.status === 'completed' ? 'مكتملة' : 'ملغاة'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(invoice)}
                            className="px-3 py-1.5 bg-[#76b900]/15 hover:bg-[#76b900] text-[#76b900] hover:text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-[#76b900]/30 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            طباعة الفاتورة
                          </button>

                          {invoice.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleCancelInvoice(invoice)}
                              className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                              title="إلغاء الفاتورة واسترجاع المخزون"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
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

      {/* View & Print Modal */}
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
