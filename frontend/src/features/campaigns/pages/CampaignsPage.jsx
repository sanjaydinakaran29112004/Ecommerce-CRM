import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { mockDb } from '@/services/mock/mockDb';
import { ENDPOINTS } from '@/services/api/endpoints';
import { axiosClient } from '@/services/api/axiosClient';
import {
  Plus,
  Play,
  CheckCircle2,
  PauseCircle,
  RotateCcw,
  Sparkles,
  Calendar,
  Send,
  Radio,
  Clock,
} from 'lucide-react';

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
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
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
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export function CampaignsPage() {
  const queryClient = useQueryClient();
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED' | 'PAUSED'
  const [toastMessage, setToastMessage] = useState('');

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns-list'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get(ENDPOINTS.CAMPAIGNS.LIST);
        const list = Array.isArray(res) ? res : res?.campaigns || res?.data?.campaigns || [];
        if (list.length > 0) return list;
      } catch (err) {
        console.warn('API campaigns fetch fallback:', err);
      }
      return mockDb.get('campaigns').length ? mockDb.get('campaigns') : INITIAL_CAMPAIGNS;
    },
    staleTime: 60 * 1000,
  });

  const campaigns = campaignsData || (mockDb.get('campaigns').length ? mockDb.get('campaigns') : INITIAL_CAMPAIGNS);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    channel: 'EMAIL',
    targetSegment: 'VIP & Repeat Buyers',
    promoCode: 'SAVE20',
    estimatedRecipients: 1500,
    initialStatus: 'ACTIVE', // 'ACTIVE' or 'SCHEDULED'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Toggle/Update Campaign Status (ACTIVE <-> COMPLETED <-> PAUSED <-> SCHEDULED)
  const handleUpdateStatus = async (campaignId, newStatus) => {
    const targetId = String(campaignId);
    const current = Array.isArray(campaigns) ? campaigns : [];
    const updated = current.map((c) => {
      if (String(c.id || c._id) === targetId) {
        return {
          ...c,
          status: newStatus,
          sentCount:
            newStatus === 'COMPLETED'
              ? c.recipients
              : newStatus === 'ACTIVE'
              ? Math.max(c.sentCount || 0, Math.floor((c.recipients || 1000) * 0.95))
              : c.sentCount,
        };
      }
      return c;
    });

    mockDb.set('campaigns', updated);
    queryClient.setQueryData(['campaigns-list'], updated);
    queryClient.invalidateQueries({ queryKey: ['campaigns-list'] });

    const targetCampaign = current.find((c) => String(c.id || c._id) === targetId);
    showToast(
      `Campaign "${targetCampaign?.name || 'Selected'}" status updated to ${newStatus}!`
    );

    // Asynchronously notify backend API
    try {
      if (!targetId.startsWith('cmp_')) {
        await axiosClient.patch(`/campaigns/${targetId}`, { status: newStatus });
      }
    } catch (err) {
      console.warn('Campaign backend update fallback:', err);
    }
  };

  const createCampaignMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        const res = await axiosClient.post(ENDPOINTS.CAMPAIGNS.CREATE, payload);
        return res?.campaign || res?.data?.campaign || res;
      } catch (err) {
        console.warn('Backend campaign creation fallback:', err);
        return payload;
      }
    },
    onSuccess: (saved) => {
      const isLaunchedNow = newCampaign.initialStatus === 'ACTIVE';
      const entry = {
        id: saved._id || saved.id || `cmp_${Date.now()}`,
        name: newCampaign.name,
        channel: newCampaign.channel,
        targetSegment: newCampaign.targetSegment,
        recipients: Number(newCampaign.estimatedRecipients) || 1200,
        sentCount: isLaunchedNow ? Number(newCampaign.estimatedRecipients) || 1200 : 0,
        openRate: isLaunchedNow ? '38.4%' : '0.0%',
        clickRate: isLaunchedNow ? '11.2%' : '0.0%',
        attributedRevenue: isLaunchedNow ? '₹ 1,65,000' : '₹ 0.00',
        status: newCampaign.initialStatus || 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      const current = Array.isArray(campaigns) ? campaigns : [];
      const updated = [entry, ...current];
      mockDb.set('campaigns', updated);
      queryClient.setQueryData(['campaigns-list'], updated);
      queryClient.invalidateQueries({ queryKey: ['campaigns-list'] });

      setIsCreateModalOpen(false);
      setNewCampaign({
        name: '',
        channel: 'EMAIL',
        targetSegment: 'VIP & Repeat Buyers',
        promoCode: 'SAVE20',
        estimatedRecipients: 1500,
        initialStatus: 'ACTIVE',
      });
      showToast(
        `Campaign "${entry.name}" created and marked as ${entry.status}! You can manage its status anytime.`
      );
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createCampaignMutation.mutate({
      name: newCampaign.name,
      channel: newCampaign.channel,
      targetSegment: 'VIP',
      promoCode: newCampaign.promoCode,
      status: newCampaign.initialStatus,
    });
  };

  // Filter campaigns by status tab
  const filteredCampaigns = campaigns.filter((c) => {
    if (filterTab === 'ACTIVE') return c.status === 'ACTIVE';
    if (filterTab === 'COMPLETED') return c.status === 'COMPLETED';
    if (filterTab === 'PAUSED') return c.status === 'PAUSED' || c.status === 'SCHEDULED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Status Feedback Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-700 font-bold px-1">
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Lifecycle Guide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'ALL'
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Campaigns ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('ACTIVE')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'ACTIVE'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active ({campaigns.filter((c) => c.status === 'ACTIVE').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('COMPLETED')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'COMPLETED'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completed ({campaigns.filter((c) => c.status === 'COMPLETED').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('PAUSED')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'PAUSED'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Paused / Scheduled ({campaigns.filter((c) => c.status === 'PAUSED' || c.status === 'SCHEDULED').length})
          </button>
        </div>

        <span className="text-[11px] text-slate-400">
          Campaign status can be transitioned between Active and Completed directly from each card
        </span>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCampaigns.map((c) => {
          const isActive = c.status === 'ACTIVE';
          const isCompleted = c.status === 'COMPLETED';
          const isPaused = c.status === 'PAUSED';
          const isScheduled = c.status === 'SCHEDULED';
          const campaignId = c.id || c._id;

          return (
            <Card
              key={campaignId}
              className="p-5 flex flex-col justify-between border border-slate-200 hover:border-slate-300 transition-all bg-white"
            >
              <div>
                {/* Header Channel & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                    {c.channel}
                  </span>

                  {/* Status Dropdown / Interactive Badge */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={c.status}
                      onChange={(e) => handleUpdateStatus(campaignId, e.target.value)}
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-hidden ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isCompleted
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : isPaused
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="ACTIVE">ACTIVE (Running)</option>
                      <option value="COMPLETED">COMPLETED (Finished)</option>
                      <option value="PAUSED">PAUSED</option>
                      <option value="SCHEDULED">SCHEDULED</option>
                    </select>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Audience: {c.targetSegment}</p>
              </div>

              {/* Metrics */}
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

              {/* Interactive Quick-Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {isActive ? (
                  <>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleUpdateStatus(campaignId, 'PAUSED')}
                      leftIcon={<PauseCircle className="w-3.5 h-3.5 text-amber-600" />}
                      className="text-xs text-amber-700 hover:bg-amber-50"
                    >
                      Pause
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => handleUpdateStatus(campaignId, 'COMPLETED')}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Mark Completed
                    </Button>
                  </>
                ) : isCompleted ? (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleUpdateStatus(campaignId, 'ACTIVE')}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
                    className="w-full text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    Re-Activate / Broadcast Again
                  </Button>
                ) : isPaused ? (
                  <>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => handleUpdateStatus(campaignId, 'ACTIVE')}
                      leftIcon={<Play className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Resume Broadcast
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleUpdateStatus(campaignId, 'COMPLETED')}
                      className="text-xs"
                    >
                      End & Complete
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => handleUpdateStatus(campaignId, 'ACTIVE')}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="w-full text-xs"
                  >
                    Launch Campaign Now
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
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
                <option value="Inactive Customers">Inactive / Dormant Customers (&gt;1 year)</option>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Launch Mode</label>
            <select
              value={newCampaign.initialStatus}
              onChange={(e) => setNewCampaign({ ...newCampaign, initialStatus: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
            >
              <option value="ACTIVE">Launch Immediately (Mark as ACTIVE)</option>
              <option value="SCHEDULED">Schedule for Later (Mark as SCHEDULED)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createCampaignMutation.isPending}>
              Schedule & Queue Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
