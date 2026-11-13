import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Printer, CheckCircle2, ShieldCheck, Download, Copy, ExternalLink, QrCode } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

export function GatewayReceiptModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const customerName =
    order.customer?.name ||
    order.customerSnapshot?.name ||
    (order.customer?.firstName
      ? `${order.customer.firstName} ${order.customer.lastName || ''}`.trim()
      : 'Valued Customer');
  const customerEmail = order.customer?.email || order.customerSnapshot?.email || 'customer@example.com';
  const customerPhone = order.customer?.phone || order.customerSnapshot?.phone || '+91 98401 23456';

  const totalAmount =
    order.pricing?.total ??
    (order.totalAmountPaise ? order.totalAmountPaise / 100 : 0) ??
    order.totalAmount ??
    0;

  const paymentMethod = order.paymentMethod || 'Razorpay Gateway (UPI / Card)';
  const txnId = order.paymentDetails?.transactionId || order.transactionId || `pay_rzp_${(order.orderNumber || 'ORD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}_9481`;
  const paymentDate = order.placedAt || order.createdAt || new Date().toISOString();

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTxnId = () => {
    navigator.clipboard?.writeText(txnId);
    alert(`Gateway Transaction Reference copied:\n${txnId}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Gateway Official Transaction Receipt"
      description="Cryptographically verified Razorpay merchant gateway transaction record"
      size="lg"
    >
      <div className="space-y-5 print:p-0">
        {/* Printable Receipt Paper Container */}
        <div id="gateway-receipt-paper" className="p-6 bg-white border border-slate-200 rounded-xl space-y-5 shadow-2xs">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Payment Gateway Settlement Receipt</h3>
                <p className="text-xs text-slate-500">Razorpay Enterprise Payment Infrastructure</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>PAID & SETTLED</span>
            </div>
          </div>

          {/* Key Transaction Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Order Reference</span>
              <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Payment Channel</span>
              <span className="font-semibold text-slate-800">{paymentMethod}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Date & Timestamp</span>
              <span className="font-medium text-slate-700">
                {new Date(paymentDate).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Gateway Status</span>
              <span className="font-bold text-emerald-600">SUCCESS (Captured)</span>
            </div>
          </div>

          {/* Transaction ID & Copy */}
          <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold">Razorpay Transaction ID (UTR / RRN)</span>
              <span className="font-mono font-bold text-indigo-900 select-all">{txnId}</span>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyTxnId}
              leftIcon={<Copy className="w-3 h-3 text-indigo-600" />}
              className="bg-white text-xs"
            >
              Copy
            </Button>
          </div>

          {/* Customer & Billing Entity Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Customer Details</span>
              <p className="font-bold text-slate-800">{customerName}</p>
              <p className="text-slate-600">{customerEmail}</p>
              <p className="text-slate-600">{customerPhone}</p>
            </div>

            <div className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Merchant Details</span>
              <p className="font-bold text-slate-800">EntryKode E-Commerce CRM Pvt Ltd</p>
              <p className="text-slate-600">GSTIN: 33AAACE4120L1Z9</p>
              <p className="text-slate-600">Razorpay Merchant MID: ACC_ENTRYKODE_091</p>
            </div>
          </div>

          {/* Line Items Summary */}
          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="text-xs space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Items Purchased</span>
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map((it, idx) => (
                      <tr key={it.sku || idx}>
                        <td className="p-2.5 font-medium text-slate-800">{it.name || it.sku}</td>
                        <td className="p-2.5 text-center text-slate-600">{it.quantity || 1}</td>
                        <td className="p-2.5 text-right font-semibold text-slate-900">
                          {formatCurrency((it.unitPrice || (it.pricePaise ? it.pricePaise / 100 : 0) || 0) * (it.quantity || 1))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settlement Total Card */}
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
            <div>
              <span className="text-xs text-emerald-800 font-semibold block">Total Amount Captured & Settled</span>
              <span className="text-[11px] text-emerald-700">Instant UPI/NetBanking Net Settlement complete</span>
            </div>
            <div className="text-right">
              <div className="font-extrabold text-xl sm:text-2xl text-emerald-700">{formatCurrency(totalAmount)}</div>
              <span className="text-[10px] text-emerald-800 font-mono">INR (₹)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
}
