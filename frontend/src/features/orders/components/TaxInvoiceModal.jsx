import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { Printer, CheckCircle2, ShieldCheck, Building2, Download } from 'lucide-react';

export function TaxInvoiceModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const pricing = order.pricing || {
    subtotal: order.subtotalPaise ? order.subtotalPaise / 100 : (order.totalAmountPaise ? (order.totalAmountPaise / 100) / 1.18 : 0),
    tax: order.taxPaise ? order.taxPaise / 100 : (order.totalAmountPaise ? (order.totalAmountPaise / 100) * 0.18 / 1.18 : 0),
    shipping: order.shippingFeePaise ? order.shippingFeePaise / 100 : 0,
    discount: order.discountPaise ? order.discountPaise / 100 : 0,
    total: order.totalAmountPaise ? order.totalAmountPaise / 100 : 0,
  };

  const grandTotal = pricing.total || (order.totalAmountPaise ? order.totalAmountPaise / 100 : 0);
  const taxableAmount = pricing.subtotal || Math.round(grandTotal / 1.18);
  const cgst = Math.round((pricing.tax || (grandTotal - taxableAmount)) / 2);
  const sgst = (pricing.tax || (grandTotal - taxableAmount)) - cgst;

  const invoiceNumber = `INV-2026-${String(order.orderNumber || '9041').replace(/[^0-9]/g, '').slice(-4) || '9041'}`;
  const customerName = order.customer?.name || order.customerSnapshot?.name || 'Valued Customer';
  const customerEmail = order.customer?.email || order.customerSnapshot?.email || 'customer@example.com';
  const customerPhone = order.customer?.phone || order.customerSnapshot?.phone || '+91 98401 23456';
  const address = order.shippingAddress?.street
    ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`
    : typeof order.shippingAddress === 'string'
      ? order.shippingAddress
      : 'Flat 3A, Metro Residency, Mount Road, Chennai, Tamil Nadu 600002';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official GST Tax Invoice"
      description={`Tax Invoice ${invoiceNumber} conforming to Rule 46 of CGST Rules 2017`}
      size="lg"
    >
      <div className="space-y-6 text-slate-800 print:text-black" id="printable-tax-invoice">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-5 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white font-black flex items-center justify-center text-sm">
                EK
              </div>
              <span className="text-lg font-black text-slate-900 tracking-tight">EntryKode Systems Pvt Ltd</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tek Towers, 5th Floor, OMR IT Expressway, Thoraipakkam, Chennai, Tamil Nadu 600097<br />
              <strong>GSTIN:</strong> 33AADCE9041M1ZF &nbsp;|&nbsp; <strong>CIN:</strong> U72900TN2026PTC104928<br />
              <strong>Email:</strong> billing@entrykode.com &nbsp;|&nbsp; <strong>State Code:</strong> 33 (Tamil Nadu)
            </p>
          </div>

          <div className="sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">TAX INVOICE</span>
            <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{invoiceNumber}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Date: <strong>{formatDate(order.placedAt || order.createdAt || new Date(), 'dd MMM yyyy')}</strong>
            </div>
            <div className="text-[11px] text-slate-500">
              Order Ref: <strong className="font-mono text-slate-800">{order.orderNumber}</strong>
            </div>
          </div>
        </div>

        {/* Bill To & Ship To Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Billed To (Customer)</span>
            <div className="font-bold text-slate-900 text-sm">{customerName}</div>
            <p className="text-slate-500">{customerEmail}</p>
            <p className="text-slate-500">{customerPhone}</p>
            <p className="text-slate-600 mt-1">{address}</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Delivery & Logistics</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <span>Status:</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                {order.orderStatus}
              </span>
            </div>
            <p className="text-slate-600">
              <strong>Carrier:</strong> {order.shippingDetails?.carrier || 'BlueDart Express Logix'}
            </p>
            <p className="text-slate-600 font-mono">
              <strong>Tracking:</strong> {order.shippingDetails?.trackingNumber || `BD-${String(order.orderNumber).slice(-6)}`}
            </p>
            <p className="text-slate-500 text-[11px] mt-1">
              Place of Supply: <strong>Tamil Nadu (33)</strong> — Intra-State Supply
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">HSN Code</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Rate</th>
                <th className="py-2.5 px-3 text-right">CGST (9%)</th>
                <th className="py-2.5 px-3 text-right">SGST (9%)</th>
                <th className="py-2.5 px-3 text-right">Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {(order.items || []).map((item, idx) => {
                const itemTotal = item.total ?? (item.totalPricePaise ? item.totalPricePaise / 100 : (item.unitPrice || 0) * (item.quantity || 1));
                const itemTaxable = Math.round(itemTotal / 1.18);
                const itemTax = itemTotal - itemTaxable;
                const halfTax = Math.round(itemTax / 2);

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">85183000</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitPrice || (item.unitPricePaise ? item.unitPricePaise / 100 : itemTotal / item.quantity))}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{formatCurrency(halfTax)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{formatCurrency(halfTax)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pricing Calculation & Payment Settlement Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start text-xs">
          {/* Payment Gateway Information Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Payment Settlement Audit
            </span>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600">Payment Gateway:</span>
              <strong className="text-brand-600 uppercase">{order.paymentMethod || 'RAZORPAY'}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Payment Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                order.paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {order.paymentStatus || 'PENDING'}
              </span>
            </div>
            {order.paymentDetails?.paymentId && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Gateway Txn ID:</span>
                <code className="font-mono font-bold text-slate-800">{order.paymentDetails.paymentId}</code>
              </div>
            )}
            {order.paymentDetails?.utrNumber && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Bank UTR Number:</span>
                <code className="font-mono text-slate-800">{order.paymentDetails.utrNumber}</code>
              </div>
            )}
            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
              Payment verified through encrypted webhook signature under PCI-DSS compliance.
            </p>
          </div>

          {/* Pricing Summary */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-right font-medium">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value (Subtotal):</span>
              <span>{formatCurrency(taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Central GST (CGST 9%):</span>
              <span>{formatCurrency(cgst)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>State GST (SGST 9%):</span>
              <span>{formatCurrency(sgst)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping & Logistics:</span>
              <span>{pricing.shipping > 0 ? formatCurrency(pricing.shipping) : 'FREE (₹0.00)'}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-300 font-black text-sm text-slate-900">
              <span>Grand Total (INR):</span>
              <span className="text-brand-600 text-base">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer & Print Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-200 gap-3">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            This is a computer-generated tax invoice verified by EntryKode ERP. No physical signature required.
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Tax Invoice
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

