import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { mockDb } from '@/services/mock/mockDb';
import { Plus, Megaphone, Send, Users, Mail, MessageSquare } from 'lucide-react';

const INITIAL_CAMPAIGNS = [
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

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(() => {
    return mockDb.get('campaigns').length ? mockDb.get('campaigns') : INITIAL_CAMPAIGNS;
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    channel: 'EMAIL',
    targetSegment: 'VIP & Repeat Buyers',
    promoCode: 'SAVE20',
    estimatedRecipients: 1500,
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const entry = {
      id: `cmp_${Date.now()}`,
      name: newCampaign.name,
      channel: newCampaign.channel,
      targetSegment: newCampaign.targetSegment,
      recipients: Number(newCampaign.estimatedRecipients) || 1000,
      sentCount: Number(newCampaign.estimatedRecipients) || 1000,
      openRate: '41.5%',
      clickRate: '12.8%',
      attributedRevenue: '₹ 1,85,000',
      status: 'ACTIVE',
    };

    const updated = [entry, ...campaigns];
    setCampaigns(updated);
    mockDb.set('campaigns', updated);
    setIsCreateModalOpen(false);
    setNewCampaign({
      name: '',
      channel: 'EMAIL',
      targetSegment: 'VIP & Repeat Buyers',
      promoCode: 'SAVE20',
      estimatedRecipients: 1500,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Marketing & Customer Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Segment customer cohorts and broadcast targeted promotions across email, SMS, and messaging.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map((c) => (
          <Card key={c.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  {c.channel}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {c.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-2.5">{c.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Audience: {c.targetSegment}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Audience</span>
                <div className="text-sm font-extrabold text-slate-800">{c.recipients}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Open Rate</span>
                <div className="text-sm font-extrabold text-brand-600">{c.openRate}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">GMV Boost</span>
                <div className="text-sm font-extrabold text-emerald-600">{c.attributedRevenue}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Launch Marketing Campaign"
        description="Broadcast customized offers to segmented audience cohorts"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Campaign Name"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
            placeholder="e.g. Flash Weekend 20% Off Earbuds"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Broadcast Channel</label>
              <select
                value={newCampaign.channel}
                onChange={(e) => setNewCampaign({ ...newCampaign, channel: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                <option value="EMAIL">Transactional Email (Nodemailer)</option>
                <option value="SMS">Promotional SMS</option>
                <option value="WHATSAPP">WhatsApp Business API</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Audience Segment</label>
              <select
                value={newCampaign.targetSegment}
                onChange={(e) => setNewCampaign({ ...newCampaign, targetSegment: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                <option value="VIP & Repeat Buyers">VIP & High Spenders (&gt;₹50k)</option>
                <option value="Abandoned Cart (24h)">Cart Abandoners (Last 24 Hours)</option>
                <option value="First Time Buyers">First-Time Customers</option>
                <option value="Inactive Customers">Inactive / Dormant Customers (&gt;60 days)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Promo Voucher Code"
              value={newCampaign.promoCode}
              onChange={(e) => setNewCampaign({ ...newCampaign, promoCode: e.target.value })}
              placeholder="e.g. FESTIVE20"
            />
            <Input
              label="Recipient Audience Estimate"
              type="number"
              value={newCampaign.estimatedRecipients}
              onChange={(e) => setNewCampaign({ ...newCampaign, estimatedRecipients: e.target.value })}
              placeholder="1500"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule & Queue Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
