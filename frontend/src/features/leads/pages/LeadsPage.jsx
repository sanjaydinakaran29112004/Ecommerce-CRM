import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/services/api/axiosClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { mockDb } from '@/services/mock/mockDb';
import { Plus, LayoutGrid, List, Phone, Calendar, ArrowRight, User, Building2, Mail } from 'lucide-react';

const STAGES = [
  { id: 'NEW', title: 'New Leads', color: 'border-slate-300' },
  { id: 'QUALIFIED', title: 'Qualified', color: 'border-blue-400' },
  { id: 'PROPOSAL', title: 'Proposal Sent', color: 'border-indigo-400' },
  { id: 'NEGOTIATION', title: 'Negotiation', color: 'border-amber-400' },
  { id: 'CONVERTED', title: 'Converted', color: 'border-emerald-400' },
];

export function LeadsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Lead Form State
  const [newLead, setNewLead] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    estimatedValue: 150000,
    productInterest: '',
    priority: 'HIGH',
    stage: 'NEW',
    assignedTo: 'Karthik Raja',
    notes: '',
  });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.LEADS.LIST),
  });

  // Stage advancement mutation
  const updateStageMutation = useMutation({
    mutationFn: async ({ leadId, nextStage }) => {
      const existing = mockDb.get('leads');
      const updated = existing.map((l) => (l.id === leadId ? { ...l, stage: nextStage } : l));
      mockDb.set('leads', updated);
      return { leadId, nextStage };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads-list']);
    },
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (leadData) => {
      const existing = mockDb.get('leads');
      const leadEntry = {
        ...leadData,
        id: `lead_${Date.now()}`,
        leadNumber: `LEAD-2026-${Math.floor(100 + Math.random() * 900)}`,
        estimatedValue: Number(leadData.estimatedValue) || 50000,
        createdAt: new Date().toISOString(),
        lastContactDate: new Date().toISOString(),
        nextFollowUp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };
      mockDb.set('leads', [leadEntry, ...existing]);
      return leadEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads-list']);
      setIsAddModalOpen(false);
      setNewLead({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        estimatedValue: 150000,
        productInterest: '',
        priority: 'HIGH',
        stage: 'NEW',
        assignedTo: 'Karthik Raja',
        notes: '',
      });
    },
  });

  const getNextStage = (current) => {
    const order = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED'];
    const idx = order.indexOf(current);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createLeadMutation.mutate(newLead);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Lead & Sales Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track B2B wholesale enquiries, follow-ups, and sales conversions through stages.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board View - Clean Flex Alignment with Horizontal Scroll */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 items-start overflow-x-auto pb-6 w-full snap-x">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.id);
            const stageTotal = stageLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 bg-slate-100/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col snap-start shadow-2xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{stage.title}</span>
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-brand-600">
                    {formatCurrency(stageTotal)}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 min-h-[300px]">
                  {stageLeads.length === 0 ? (
                    <div className="h-28 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                      No leads in this stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const nextStage = getNextStage(lead.stage);

                      return (
                        <Card key={lead.id} className="p-3.5 hover:border-brand-300 transition-all shadow-xs bg-white">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">
                              {lead.leadNumber}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                lead.priority === 'HIGH'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {lead.priority}
                            </span>
                          </div>

                          <h4 className="font-semibold text-xs text-slate-900 leading-snug">
                            {lead.companyName}
                          </h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{lead.contactPerson}</span>
                          </p>

                          <div className="mt-2 text-xs font-bold text-slate-900">
                            {formatCurrency(lead.estimatedValue)}
                          </div>

                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                            {lead.productInterest}
                          </p>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-medium truncate max-w-[100px]">
                              {lead.assignedTo}
                            </span>

                            {nextStage && (
                              <button
                                onClick={() =>
                                  updateStageMutation.mutate({
                                    leadId: lead.id,
                                    nextStage,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded transition-colors"
                              >
                                <span>Move</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Lead #</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Estimated Value</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">{lead.leadNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{lead.companyName}</td>
                    <td className="py-3 px-4 text-slate-600">{lead.contactPerson}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{lead.stage}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(lead.estimatedValue)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {lead.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{lead.assignedTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Sales Lead"
        description="Register an inbound B2B enquiry, bulk order request, or partner opportunity"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Company / Business Name"
            value={newLead.companyName}
            onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
            placeholder="e.g. Apex Global Tech Solutions"
            leftIcon={<Building2 className="w-4 h-4" />}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              value={newLead.contactPerson}
              onChange={(e) => setNewLead({ ...newLead, contactPerson: e.target.value })}
              placeholder="e.g. Anand Kumar"
              leftIcon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="Contact Phone"
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              placeholder="+91 98765 43210"
              leftIcon={<Phone className="w-4 h-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Email"
              type="email"
              value={newLead.email}
              onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              placeholder="anand@apex.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Estimated Deal Value (₹)"
              type="number"
              value={newLead.estimatedValue}
              onChange={(e) => setNewLead({ ...newLead, estimatedValue: e.target.value })}
              placeholder="150000"
              required
            />
          </div>

          <Input
            label="Product Interest / Description"
            value={newLead.productInterest}
            onChange={(e) => setNewLead({ ...newLead, productInterest: e.target.value })}
            placeholder="e.g. Bulk order for 40x ANC Pro Wireless Headphones"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
              <select
                value={newLead.priority}
                onChange={(e) => setNewLead({ ...newLead, priority: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Stage</label>
              <select
                value={newLead.stage}
                onChange={(e) => setNewLead({ ...newLead, stage: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createLeadMutation.isLoading}>
              Create Lead
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
