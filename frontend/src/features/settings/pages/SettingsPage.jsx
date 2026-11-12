import React, { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { storage } from '@/utils/storage';
import { CheckCircle2, Save } from 'lucide-react';

const INITIAL_AUDIT_LOGS = [
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

export function SettingsPage() {
  const [config, setConfig] = useState(() => {
    return storage.get('crm_system_settings', {
      companyName: 'EntryKode Systems Pvt Ltd',
      currency: 'INR (₹)',
      gstRate: '18%',
      supportEmail: 'support@entrykode.com',
      autoInvoicing: true,
      emailNotifications: true,
    });
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    return storage.get('crm_audit_logs', INITIAL_AUDIT_LOGS);
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveConfiguration = (e) => {
    e.preventDefault();
    storage.set('crm_system_settings', config);

    // Append new audit entry
    const newLog = {
      id: `aud_${Date.now()}`,
      actor: 'Sanjay D (Super Admin)',
      action: 'SYSTEM_SETTINGS_UPDATED',
      entity: 'Global Company Config',
      timestamp: 'Just now',
      details: `Updated company name to "${config.companyName}", GST to ${config.gstRate}`,
    };

    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    storage.set('crm_audit_logs', updatedLogs);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

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

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configuration saved successfully and recorded in the audit trail!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Settings Form */}
        <Card className="col-span-1 lg:col-span-2 p-6 bg-white">
          <form onSubmit={handleSaveConfiguration} className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Company Profile & Preferences</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Company Name"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                required
              />
              <Input
                label="Operating Currency"
                value={config.currency}
                disabled
                helperText="Fixed to Indian Rupee (₹)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Default GST Tax Rate"
                value={config.gstRate}
                onChange={(e) => setConfig({ ...config, gstRate: e.target.value })}
                required
              />
              <Input
                label="Support Helpline Email"
                type="email"
                value={config.supportEmail}
                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                required
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoInvoicing}
                  onChange={(e) => setConfig({ ...config, autoInvoicing: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span>Auto-generate GST invoice PDF on order delivery</span>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Configuration
              </Button>
            </div>
          </form>
        </Card>

        {/* Integration Status Card */}
        <Card className="p-6 space-y-3 bg-white">
          <h3 className="font-bold text-slate-800 text-sm">Integrations Status</h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Razorpay Payments</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active (Live API)
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Cloudinary Media</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Shopify Webhooks</span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Ready to Sync
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card className="bg-white">
        <CardHeader
          title="Security & System Audit Trail"
          subtitle="Immutable log of sensitive operations, status transitions, and configuration edits"
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
