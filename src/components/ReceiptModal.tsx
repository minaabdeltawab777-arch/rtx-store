import React, { useRef, useState } from 'react';
import { Invoice, StoreSettings } from '../types';
import { formatEGP, formatDateArabic } from '../utils/formatters';
import { BarcodeRenderer } from './BarcodeRenderer';
import { Printer, Download, X, CheckCircle, FileText, Smartphone } from 'lucide-react';

interface ReceiptModalProps {
  invoice: Invoice;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onNewSale?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  invoice,
  settings,
  isOpen,
  onClose,
  onNewSale
}) => {
  const [format, setFormat] = useState<'thermal80' | 'a4'>(
    invoice.format || settings.defaultReceiptFormat || 'thermal80'
  );
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const paymentLabels = {
    cash: 'نقدي (كاش)',
    card: 'بطاقة بنكية / فيزا',
    bank_transfer: 'تحويل بنكي / انستاباي InstaPay',
    other: 'أخرى'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#12151e] border border-[#262c3d] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header / Actions toolbar */}
        <div className="p-4 bg-[#181d2a] border-b border-[#262c3d] flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#76b900]/20 text-[#76b900] flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                فاتورة بيع مكتملة: <span className="font-mono text-[#76b900]">{invoice.invoiceNumber}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {formatDateArabic(invoice.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format switch */}
            <div className="flex items-center bg-[#0d1017] p-1 rounded-lg border border-[#272f44]">
              <button
                onClick={() => setFormat('thermal80')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                  format === 'thermal80'
                    ? 'bg-[#76b900] text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                حراري (80mm)
              </button>
              <button
                onClick={() => setFormat('a4')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                  format === 'a4'
                    ? 'bg-[#76b900] text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                ورقة كاملة (A4)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#76b900] hover:bg-[#88d400] text-black font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-[#76b900]/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              طباعة الفاتورة
            </button>

            {onNewSale && (
              <button
                onClick={() => {
                  onClose();
                  onNewSale();
                }}
                className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                فاتورة جديدة +
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0a0c10] flex justify-center">
          <div ref={printRef} className="print-area w-full max-w-full">
            {format === 'thermal80' ? (
              /* --- 80mm Thermal Receipt Layout --- */
              <div className="thermal-receipt-print bg-white text-black p-4 rounded-lg shadow-xl max-w-[80mm] mx-auto font-sans leading-tight border border-slate-200">
                {/* Store Header */}
                <div className="text-center pb-3 border-b-2 border-dashed border-gray-400">
                  <div className="text-2xl font-black tracking-wider text-black font-mono">
                    {settings.storeName}
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mt-0.5">
                    {settings.storeTagline}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">
                    {settings.address}
                  </div>
                  <div className="text-[11px] font-mono text-gray-800">
                    هاتف: {settings.phone}
                  </div>
                  {settings.commercialReg && (
                    <div className="text-[10px] text-gray-500">
                      س.ت: {settings.commercialReg} | ب.ض: {settings.taxNumber}
                    </div>
                  )}
                </div>

                {/* Invoice Meta */}
                <div className="py-2.5 border-b border-dashed border-gray-400 text-xs flex flex-col gap-1">
                  <div className="flex justify-between font-mono font-bold">
                    <span>رقم الفاتورة:</span>
                    <span className="text-sm">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>التاريخ:</span>
                    <span>{formatDateArabic(invoice.createdAt)}</span>
                  </div>
                  {invoice.cashierName && (
                    <div className="flex justify-between text-gray-700">
                      <span>الكاشير:</span>
                      <span>{invoice.cashierName}</span>
                    </div>
                  )}
                  {invoice.customerName && (
                    <div className="flex justify-between text-gray-800 font-semibold pt-1 border-t border-gray-200">
                      <span>العميل:</span>
                      <span>{invoice.customerName} {invoice.customerPhone && `(${invoice.customerPhone})`}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="py-2 border-b-2 border-dashed border-gray-400">
                  <div className="grid grid-cols-12 text-[11px] font-bold pb-1 text-gray-800 border-b border-gray-300">
                    <span className="col-span-6">الصنف</span>
                    <span className="col-span-2 text-center">الكمية</span>
                    <span className="col-span-2 text-left">السعر</span>
                    <span className="col-span-2 text-left">الإجمالي</span>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {invoice.items.map((item, idx) => (
                      <div key={idx} className="py-1.5 text-xs">
                        <div className="font-bold text-gray-900 leading-tight">
                          {item.name}
                        </div>
                        {item.model && (
                          <div className="text-[10px] text-gray-600 font-mono">
                            {item.model}
                          </div>
                        )}
                        {item.serialNumber && (
                          <div className="text-[10px] text-emerald-800 font-mono font-bold">
                            S/N: {item.serialNumber}
                          </div>
                        )}
                        <div className="grid grid-cols-12 text-[11px] text-gray-700 pt-0.5">
                          <span className="col-span-6 text-[10px] text-gray-500 font-mono">
                            {item.barcode}
                          </span>
                          <span className="col-span-2 text-center font-bold">
                            {item.quantity}
                          </span>
                          <span className="col-span-2 text-left font-mono">
                            {item.unitPrice}
                          </span>
                          <span className="col-span-2 text-left font-bold font-mono text-gray-900">
                            {item.lineTotal}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="py-2.5 border-b-2 border-dashed border-gray-400 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between text-gray-700">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono font-semibold">{formatEGP(invoice.subtotal)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-red-600 font-semibold">
                      <span>الخصم الممنوح:</span>
                      <span className="font-mono">- {formatEGP(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black border-t-2 border-gray-800 pt-1.5 text-black">
                    <span>الصافي النهائي:</span>
                    <span className="font-mono">{formatEGP(invoice.total)}</span>
                  </div>

                  <div className="flex justify-between text-gray-700 pt-1 border-t border-gray-200">
                    <span>طريقة الدفع:</span>
                    <span className="font-bold">{paymentLabels[invoice.paymentMethod]}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>المدفوع:</span>
                    <span className="font-mono">{formatEGP(invoice.amountReceived)}</span>
                  </div>
                  {invoice.changeToReturn > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>المتبقي للعميل (الفكة):</span>
                      <span className="font-mono">{formatEGP(invoice.changeToReturn)}</span>
                    </div>
                  )}
                </div>

                {/* Barcode & Footer */}
                <div className="pt-3 text-center flex flex-col items-center">
                  <div className="my-1">
                    <BarcodeRenderer
                      value={invoice.invoiceNumber}
                      height={32}
                      width={1.4}
                      fontSize={11}
                      displayValue={true}
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 leading-snug mt-2 text-center max-w-[90%]">
                    {settings.receiptFooter}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-2 font-mono">
                    RTX STORE POS SYSTEM • POWERED BY HARDWARE MASTERS
                  </p>
                </div>
              </div>
            ) : (
              /* --- A4 Invoice Full Sheet Layout --- */
              <div className="a4-invoice-print bg-white text-black p-8 rounded-lg shadow-xl max-w-[210mm] mx-auto font-sans leading-normal border border-slate-200">
                {/* Header */}
                <div className="flex justify-between items-start pb-6 border-b-2 border-slate-800">
                  <div>
                    <h1 className="text-3xl font-black text-black font-mono tracking-tight">
                      {settings.storeName}
                    </h1>
                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {settings.storeTagline}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      العنوان: {settings.address}
                    </p>
                    <p className="text-xs text-slate-600 font-mono">
                      خدمة العملاء والدعم الفني: {settings.phone}
                    </p>
                    {settings.commercialReg && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        سجل تجاري: {settings.commercialReg} | بطاقة ضريبية: {settings.taxNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-left flex flex-col items-end">
                    <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-sm rounded mb-2">
                      فاتورة بيع ضريبية
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900">
                      رقم: {invoice.invoiceNumber}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      التاريخ: {formatDateArabic(invoice.createdAt)}
                    </div>
                    <div className="mt-2">
                      <BarcodeRenderer
                        value={invoice.invoiceNumber}
                        height={28}
                        width={1.2}
                        fontSize={10}
                        displayValue={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Customer & Cashier Section */}
                <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-sm">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">بيانات العميل:</span>
                    <div>الاسم: {invoice.customerName || 'عميل نقدي'}</div>
                    {invoice.customerPhone && <div>الهاتف: <span className="font-mono">{invoice.customerPhone}</span></div>}
                    {invoice.notes && <div className="text-xs text-slate-500 mt-1">ملاحظات: {invoice.notes}</div>}
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">تفاصيل العملية:</span>
                    <div>الكاشير المسئول: {invoice.cashierName || 'الفرع الرئيسي'}</div>
                    <div>طريقة الدفع: <span className="font-semibold">{paymentLabels[invoice.paymentMethod]}</span></div>
                    <div>حالة الفاتورة: <span className="text-emerald-700 font-bold">مكتملة ومسددة بالكامل</span></div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-4">
                  <table className="w-full text-sm text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">المنتج / المواصفات</th>
                        <th className="py-2.5 px-3 font-mono">الباركود / SKU</th>
                        <th className="py-2.5 px-3 text-center">الكمية</th>
                        <th className="py-2.5 px-3 text-left">سعر الوحدة</th>
                        <th className="py-2.5 px-3 text-left">الخصم</th>
                        <th className="py-2.5 px-3 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {invoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            {item.model && <div className="text-xs text-slate-600">{item.brand} - {item.model}</div>}
                            {item.specsSummary && <div className="text-xs text-slate-500">{item.specsSummary}</div>}
                            {item.serialNumber && (
                              <div className="text-xs text-emerald-800 font-mono font-bold mt-0.5">
                                سيريال الجهاز: {item.serialNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-slate-600">
                            <div>{item.barcode}</div>
                            <div className="text-[10px] text-slate-400">{item.sku}</div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                          <td className="py-3 px-3 text-left font-mono">{formatEGP(item.unitPrice)}</td>
                          <td className="py-3 px-3 text-left font-mono text-red-600">
                            {item.discount > 0 ? `- ${formatEGP(item.discount)}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-left font-mono font-bold text-slate-900">
                            {formatEGP(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="flex justify-end pt-4 border-t-2 border-slate-300">
                  <div className="w-80 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>المجموع الفرعي:</span>
                      <span className="font-mono font-bold">{formatEGP(invoice.subtotal)}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-red-600 font-semibold">
                        <span>إجمالي الخصم الممنوح:</span>
                        <span className="font-mono">- {formatEGP(invoice.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-black text-slate-900 border-t-2 border-slate-900 pt-2">
                      <span>الصافي المطلوب:</span>
                      <span className="font-mono text-xl">{formatEGP(invoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-200">
                      <span>المبلغ المستلم:</span>
                      <span className="font-mono">{formatEGP(invoice.amountReceived)}</span>
                    </div>
                    {invoice.changeToReturn > 0 && (
                      <div className="flex justify-between text-xs text-emerald-700 font-bold">
                        <span>الباقي للعميل:</span>
                        <span className="font-mono">{formatEGP(invoice.changeToReturn)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms & Footer */}
                <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-600">
                  <p className="font-bold text-slate-800 mb-1">الشروط والأحكام والضمان:</p>
                  <p className="leading-relaxed">{settings.receiptFooter}</p>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-dashed border-slate-300 text-slate-400 text-[11px]">
                    <div>توقيع المستلم: ...............................</div>
                    <div>ختم وتوقيع المحل: ...............................</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
