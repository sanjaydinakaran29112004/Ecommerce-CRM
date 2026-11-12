import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { mockDb } from '@/services/mock/mockDb';
import { RotateCcw, AlertTriangle, CheckCircle, ShieldCheck, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const INITIAL_RETURNS = [
  {
    id: 'ret_1',
    returnNumber: 'RET-2026-041',
    orderNumber: 'ORD-2026-9041',
    customer: 'Ananya Krishnan',
    item: 'Aura Pro Wireless ANC Headphones',
    reason: 'Defective Bluetooth pairing on Left Cup',
    status: 'INSPECTION_PENDING',
    refundAmount: '₹ 14,999.00',
    inspectionNotes: 'Awaiting warehouse inspection of device hardware.',
  },
  {
    id: 'ret_2',
    returnNumber: 'RET-2026-039',
    orderNumber: 'ORD-2026-8910',
    customer: 'Karthik Rao',
    item: '100W GaN Fast Charger',
    reason: 'Incorrect item ordered by mistake',
    status: 'REFUND_APPROVED',
    refundAmount: '₹ 3,499.00',
    inspectionNotes: 'Sealed box returned in brand new condition. Restocked.',
  },
];

export function ReturnsPage() {
  const [returns, setReturns] = useState(() => {
    return mockDb.get('returns').length ? mockDb.get('returns') : INITIAL_RETURNS;
  });

  const [inspectingReturn, setInspectingReturn] = useState(null);
  const [inspectionVerdict, setInspectionVerdict] = useState('RESTOCKED');
  const [inspectionNotes, setInspectionNotes] = useState('Hardware verified. Device eligible for refund.');
  const [successToast, setSuccessToast] = useState('');

  const handleApproveRefund = () => {
    if (!inspectingReturn) return;
    const updated = returns.map((r) => {
      if (r.id === inspectingReturn.id) {
        return {
          ...r,
          status: 'REFUND_APPROVED',
          inspectionNotes,
        };
      }
      return r;
    });

    setReturns(updated);
    mockDb.set('returns', updated);
    setSuccessToast(`Refund of ${inspectingReturn.refundAmount} approved via Razorpay for ${inspectingReturn.returnNumber}`);
    setInspectingReturn(null);

    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleRejectReturn = () => {
    if (!inspectingReturn) return;
    const updated = returns.map((r) => {
      if (r.id === inspectingReturn.id) {
        return {
          ...r,
          status: 'REJECTED',
          inspectionNotes,
        };
      }
      return r;
    });

    setReturns(updated);
    mockDb.set('returns', updated);
    setSuccessToast(`Return request ${inspectingReturn.returnNumber} marked as Rejected.`);
    setInspectingReturn(null);

    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Returns, Replacements & Refund Gateway
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            After-sales inspection workflow, reverse pickup tracking, and payment gateway refund settlement.
          </p>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="space-y-3">
        {returns.map((r) => (
          <Card key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-600 text-xs">{r.returnNumber}</span>
                <span className="text-slate-400 text-xs">for {r.orderNumber}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    r.status === 'REFUND_APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : r.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {r.status.replace(/_/g, ' ')}
                </span>
              </div>
              <h4 className="font-semibold text-slate-800 text-xs mt-1.5">{r.item}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Customer: <strong>{r.customer}</strong> | Reason: {r.reason}
              </p>
              {r.inspectionNotes && (
                <p className="text-[11px] text-slate-400 mt-1 italic">Inspection Note: {r.inspectionNotes}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Refund</span>
                <div className="font-bold text-slate-900 text-sm">{r.refundAmount}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingReturn(r)}
                className="text-xs"
              >
                Inspect Return
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Inspect Return Modal */}
      <Modal
        isOpen={!!inspectingReturn}
        onClose={() => setInspectingReturn(null)}
        title={`Inspect Return — ${inspectingReturn?.returnNumber}`}
        description={`Order Reference: ${inspectingReturn?.orderNumber} | Customer: ${inspectingReturn?.customer}`}
      >
        {inspectingReturn && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <p>
                <span className="text-slate-500 font-medium">Returned Item: </span>
                <span className="font-bold text-slate-800">{inspectingReturn.item}</span>
              </p>
              <p>
                <span className="text-slate-500 font-medium">Customer Stated Reason: </span>
                <span className="text-slate-700">{inspectingReturn.reason}</span>
              </p>
              <p>
                <span className="text-slate-500 font-medium">Refund Amount: </span>
                <span className="font-bold text-brand-600">{inspectingReturn.refundAmount}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Physical Inspection Verdict
              </label>
              <select
                value={inspectionVerdict}
                onChange={(e) => setInspectionVerdict(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium"
              >
                <option value="RESTOCKED">Verified Defect - Approve Full Gateway Refund</option>
                <option value="EXCHANGE">Device Operational - Restock to Catalog</option>
                <option value="REJECTED">Customer Damaged - Reject Return</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Inspection & Warehouse Notes
              </label>
              <textarea
                rows={3}
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                placeholder="Details of package condition, physical inspection, and gateway approval..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-sans"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRejectReturn}
              >
                Reject Request
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setInspectingReturn(null)}>
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleApproveRefund}
                  leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                >
                  Approve Refund (Razorpay)
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
