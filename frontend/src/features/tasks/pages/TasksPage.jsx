import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, CheckSquare, Clock, AlertCircle } from 'lucide-react';

export function TasksPage() {
  const tasks = [
    {
      id: 'tsk_1',
      title: 'Call Apex Cloud regarding quotation revisions',
      assignedTo: 'Karthik Raja',
      priority: 'HIGH',
      dueDate: 'Today, 04:00 PM',
      status: 'IN_PROGRESS',
    },
    {
      id: 'tsk_2',
      title: 'Audit damaged keyboard units with warehouse team',
      assignedTo: 'Sanjay D',
      priority: 'MEDIUM',
      dueDate: 'Tomorrow, 11:00 AM',
      status: 'TO_DO',
    },
    {
      id: 'tsk_3',
      title: 'Follow up on pending Razorpay refund reconciliation',
      assignedTo: 'Priya Sundaram',
      priority: 'HIGH',
      dueDate: '14 Nov 2026',
      status: 'REVIEW',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Employee Tasks & Activity Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign team deliverables, follow-up calls, warehouse checks, and monitor deadlines.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Create Task
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.map((t) => (
          <Card key={t.id} className="p-4 flex items-center justify-between hover:border-slate-300">
            <div className="flex items-center gap-3">
              <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
              <div>
                <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">{t.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                  <span>Assigned to: <strong className="text-slate-600">{t.assignedTo}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{t.dueDate}</span>
                  </span>
                </div>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                t.priority === 'HIGH'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.priority}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
