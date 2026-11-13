import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

const REASON_PRESETS = [
  'Customer requested cancellation before dispatch',
  'Duplicate order placed accidentally by customer',
  'Customer changed delivery address / location unserviceable',
  'Pricing or discount voucher discrepancy',
  'Delivery timeline delayed / customer unable to wait',
  'Other / Custom reason'
];

export function CancelOrderModal({ isOpen, onClose, order, onConfirmCancel, isPending }) {
  const [selectedReason, setSelectedReason] = useState(REASON_PRESETS[0]);
  const [customNote, setCustomNote] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other / Custom reason'
      ? (customNote.trim() || 'Order cancelled by customer request')
      : selectedReason + (customNote.trim() ? ` — Notes: ${customNote.trim()}` : '');

    onConfirmCancel({
      orderId: order.id || order._id || order.orderNumber,
      reason: finalReason
    });
  };

  const wasPaid = order.paymentStatus === 'PAID';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancel Order — ${order.orderNumber}`}
      description="Authorize order cancellation and trigger automatic inventory restocking"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Important Restocking & Refund Notice</span>
            <p className="text-rose-700 leading-relaxed">
              Cancelling this order will automatically restore reserved product units back to warehouse inventory stock.
              {wasPaid && (
                <strong className="block text-rose-900 mt-1">
                  • Since this order was PAID, its payment status will transition to 'REFUNDED' under gateway reversal audit.
                </strong>
              )}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Cancellation Reason *
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium focus:outline-hidden focus:border-rose-500"
          >
            {REASON_PRESETS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Additional Audit Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Enter specific details regarding customer conversation or reason..."
            className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:outline-hidden focus:border-rose-500"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Keep Order Active
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            isLoading={isPending}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Confirm & Cancel Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}

