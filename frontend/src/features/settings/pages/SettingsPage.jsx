import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, ShieldCheck, History } from 'lucide-react';

export function SettingsPage() {
  const auditLogs = [
    {
      id: 'aud_1',
      actor: 'Sanjay D (Super Admin)',
      action: 'ORDER_STATUS_TRANSITION',
      entity: 'Order ORD-2026-9041',
      timestamp: 'Today, 02:15 PM',
      details: 'Changed status from SHIPPED to DELIVERED',
    },
    {
      id: 'aud_2',
      actor: 'Ishwarya R (Admin)',
      action: 'STOCK_ADJUSTMENT',
      entity: 'Product EK-TECH-001',
      timestamp: 'Today, 11:30 AM',
      details: 'Added +20 units (Supplier Purchase Batch #772)',
    },
    {
      id: 'aud_3',
      actor: 'Priya Sundaram (Support)',
      action: 'REFUND_APPROVED',
      entity: 'Refund RFD-2026-039',
      timestamp: 'Yesterday, 05:40 PM',
      details: 'Approved ₹ 3,499.00 via Razorpay Gateway',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Admin Settings & System Audit Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure company profile, currency rules, integration webhooks, and review immutable audit logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Settings */}
        <Card className="col-span-1 lg:col-span-2 p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Company Profile & Preferences</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company Name" defaultValue="EntryKode Systems Pvt Ltd" />
            <Input label="Operating Currency" defaultValue="INR (₹)" disabled />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Default GST Rate" defaultValue="18%" />
            <Input label="Support Helpline Email" defaultValue="support@entrykode.com" />
          </div>
          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm">Save Configuration</Button>
          </div>
        </Card>

        {/* Integration Status */}
        <Card className="p-6 space-y-3">
          <h3 className="font-bold text-slate-800 text-sm">Integrations Status</h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Razorpay Payments</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Cloudinary Media</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Connected</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Shopify Webhooks</span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Optional</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader
          title="Security & Audit Trail"
          subtitle="Immutable log of sensitive operations and permission transitions"
        />
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{log.actor}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-brand-600 text-[11px]">{log.action}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{log.entity}</td>
                  <td className="py-3 px-4 text-slate-500">{log.details}</td>
                  <td className="py-3 px-4 text-slate-400">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
