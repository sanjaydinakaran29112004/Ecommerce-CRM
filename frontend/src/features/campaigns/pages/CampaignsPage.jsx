import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Megaphone, Send, Users, Mail } from 'lucide-react';

export function CampaignsPage() {
  const campaigns = [
    {
      id: 'cmp_1',
      name: 'Diwali Festive Electronics Clearance',
      channel: 'EMAIL',
      targetSegment: 'VIP & Repeat Buyers',
      recipients: 4200,
      sentCount: 4180,
      openRate: '34.2%',
      clickRate: '8.4%',
      attributedRevenue: '₹ 4,82,000',
      status: 'COMPLETED',
    },
    {
      id: 'cmp_2',
      name: 'Cart Recovery 10% Discount Coupon',
      channel: 'EMAIL',
      targetSegment: 'Abandoned Cart (24h)',
      recipients: 840,
      sentCount: 840,
      openRate: '46.1%',
      clickRate: '18.2%',
      attributedRevenue: '₹ 1,24,500',
      status: 'ACTIVE',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Marketing & Customer Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Segment customer cohorts and broadcast targeted promotions across email and SMS.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaigns.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  {c.channel}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-2">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Audience: {c.targetSegment}</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {c.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Recipients</span>
                <div className="text-sm font-extrabold text-slate-800">{c.recipients}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Open Rate</span>
                <div className="text-sm font-extrabold text-brand-600">{c.openRate}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">GMV Generated</span>
                <div className="text-sm font-extrabold text-emerald-600">{c.attributedRevenue}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

