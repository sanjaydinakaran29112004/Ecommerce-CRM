import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, BarChart2, TrendingUp, DollarSign, Users } from 'lucide-react';

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState('sales');

  const reportsList = [
    { id: 'sales', label: 'Sales & Revenue Report', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory Turnover & Aging', icon: BarChart2 },
    { id: 'customers', label: 'Customer Lifetime & Retention', icon: Users },
    { id: 'support', label: 'Support SLA & Resolution Metrics', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Reports & Business Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audited financial, operational, customer cohort, and inventory data exports.
          </p>
        </div>

        <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
          Export Full Report
        </Button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {reportsList.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                activeReport === r.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      <Card className="p-8 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-800 text-sm mb-1">
          {reportsList.find((r) => r.id === activeReport)?.label}
        </p>
        <p>Aggregation pipelines ready. Click "Export Full Report" above to download the compiled dataset.</p>
      </Card>
    </div>
  );
}
