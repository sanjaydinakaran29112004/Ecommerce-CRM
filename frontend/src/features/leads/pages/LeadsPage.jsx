import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/services/api/axiosClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/data-display/StatusChip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { mockDb } from '@/services/mock/mockDb';
import { Plus, LayoutGrid, List, Phone, Calendar, ArrowRight, User } from 'lucide-react';

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

  const getNextStage = (current) => {
    const order = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED'];
    const idx = order.indexOf(current);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
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
              className={`p-1.5 rounded-md ${
                viewMode === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.id);
            const stageTotal = stageLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

            return (
              <div
                key={stage.id}
                className="bg-slate-100/70 border border-slate-200/90 rounded-xl p-3 flex flex-col min-w-[260px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
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
                <div className="space-y-3">
                  {stageLeads.map((lead) => {
                    const nextStage = getNextStage(lead.stage);

                    return (
                      <Card key={lead.id} className="p-3.5 hover:border-brand-300 transition-all shadow-xs">
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

                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
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
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded"
                            >
                              <span>Move</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-4 text-xs text-slate-600">
          Switch back to Kanban board view to advance lead stages.
        </Card>
      )}
    </div>
  );
}
