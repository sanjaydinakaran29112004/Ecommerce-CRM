import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RotateCcw, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

export function ReturnsPage() {
  const returns = [
    {
      id: 'ret_1',
      returnNumber: 'RET-2026-041',
      orderNumber: 'ORD-2026-9041',
      customer: 'Ananya Krishnan',
      item: 'Aura Pro Wireless ANC Headphones',
      reason: 'Defective Bluetooth pairing on Left Cup',
      status: 'INSPECTION_PENDING',
      refundAmount: '₹ 14,999.00',
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
    },
  ];

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

      <div className="space-y-3">
        {returns.map((r) => (
          <Card key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-600 text-xs">{r.returnNumber}</span>
                <span className="text-slate-400 text-xs">for {r.orderNumber}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  {r.status.replace(/_/g, ' ')}
                </span>
              </div>
              <h4 className="font-semibold text-slate-800 text-xs mt-1.5">{r.item}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Reason: {r.reason}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Refund</span>
                <div className="font-bold text-slate-900 text-sm">{r.refundAmount}</div>
              </div>
              <Button variant="outline" size="sm">
                Inspect Return
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
