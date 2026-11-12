import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { exportToCsv } from '@/utils/exportCsv';
import {
  Download,
  TrendingUp,
  BarChart2,
  Users,
  LifeBuoy,
  Calendar,
  CheckCircle2,
  DollarSign,
  Package,
} from 'lucide-react';

const SALES_REPORT_DATA = [
  { month: 'October 2025', orders: 42, gross: 298000, discount: 14000, tax: 48600, net: 332600, aov: 7919, growth: '+12.4%' },
  { month: 'November 2025', orders: 58, gross: 362000, discount: 17000, tax: 59400, net: 404400, aov: 6972, growth: '+21.5%' },
  { month: 'December 2025', orders: 94, gross: 538000, discount: 26000, tax: 88200, net: 600200, aov: 6385, growth: '+48.4%' },
  { month: 'January 2026', orders: 67, gross: 435000, discount: 17000, tax: 71800, net: 489800, aov: 7310, growth: '-18.3%' },
  { month: 'February 2026', orders: 79, gross: 482000, discount: 20000, tax: 79600, net: 541600, aov: 6855, growth: '+10.5%' },
  { month: 'March 2026', orders: 88, gross: 564000, discount: 26000, tax: 93200, net: 631200, aov: 7172, growth: '+16.5%' },
];

const INVENTORY_REPORT_DATA = [
  { sku: 'EK-TECH-001', product: 'Aura Pro Wireless ANC Headphones', category: 'Consumer Electronics', stock: 45, valuation: 674955, turnoverDays: '14 days', status: 'Healthy' },
  { sku: 'EK-WEAR-002', product: 'Titanium Smart Fitness Watch v4', category: 'Wearables', stock: 8, valuation: 67992, turnoverDays: '8 days', status: 'Low Stock Risk' },
  { sku: 'EK-OFFC-003', product: 'Ergonomic Mesh Executive Chair', category: 'Office Furniture', stock: 24, valuation: 540000, turnoverDays: '22 days', status: 'Healthy' },
  { sku: 'EK-PERI-004', product: 'Mechanical RGB Keyboard (Hot-Swap)', category: 'Computer Peripherals', stock: 0, valuation: 0, turnoverDays: '0 days', status: 'Stockout Alert' },
  { sku: 'EK-CHAR-005', product: '100W GaN Fast Charger Multi-Port', category: 'Accessories', stock: 120, valuation: 419880, turnoverDays: '11 days', status: 'Fast Moving' },
];

const CUSTOMER_COHORT_DATA = [
  { cohort: 'VIP High Value (&gt;₹1.5L)', count: 18, avgSpend: 245000, repeatRate: '92.4%', churnRisk: 'Very Low' },
  { cohort: 'Frequent Repeat Buyers (3-10 orders)', count: 64, avgSpend: 68400, repeatRate: '78.1%', churnRisk: 'Low' },
  { cohort: 'First-Time Direct Buyers', count: 142, avgSpend: 14200, repeatRate: '31.2%', churnRisk: 'Medium' },
  { cohort: 'Inactive / Dormant (&gt;90 days)', count: 35, avgSpend: 4200, repeatRate: '4.8%', churnRisk: 'High Churn' },
];

const SUPPORT_SLA_DATA = [
  { category: 'Delivery & Shipping Delays', tickets: 34, avgResolution: '3.2 hours', slaMet: '94.1%', satisfaction: '4.7 / 5' },
  { category: 'Payment & Gateway Refunds', tickets: 18, avgResolution: '1.4 hours', slaMet: '98.5%', satisfaction: '4.9 / 5' },
  { category: 'Product Defect / Hardware', tickets: 12, avgResolution: '6.8 hours', slaMet: '89.2%', satisfaction: '4.5 / 5' },
  { category: 'GST B2B Tax Invoicing', tickets: 22, avgResolution: '0.8 hours', slaMet: '100.0%', satisfaction: '5.0 / 5' },
];

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState('sales');

  const reportsList = [
    { id: 'sales', label: 'Sales & Revenue Report', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory Turnover & Aging', icon: BarChart2 },
    { id: 'customers', label: 'Customer Cohorts & LTV', icon: Users },
    { id: 'support', label: 'Support SLA & Resolution', icon: LifeBuoy },
  ];

  const handleExportActiveReport = () => {
    if (activeReport === 'sales') {
      exportToCsv(SALES_REPORT_DATA, `sales_revenue_report_${new Date().toISOString().slice(0, 10)}.csv`);
    } else if (activeReport === 'inventory') {
      exportToCsv(INVENTORY_REPORT_DATA, `inventory_valuation_report_${new Date().toISOString().slice(0, 10)}.csv`);
    } else if (activeReport === 'customers') {
      exportToCsv(CUSTOMER_COHORT_DATA, `customer_retention_report_${new Date().toISOString().slice(0, 10)}.csv`);
    } else if (activeReport === 'support') {
      exportToCsv(SUPPORT_SLA_DATA, `support_sla_performance_${new Date().toISOString().slice(0, 10)}.csv`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Reports & Business Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audited financial statements, inventory aging, customer retention cohorts, and support SLAs.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportActiveReport}
          leftIcon={<Download className="w-3.5 h-3.5" />}
        >
          Export Active Report (CSV)
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {reportsList.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                activeReport === r.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Sales & Revenue */}
      {activeReport === 'sales' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total H2 Gross Sales</span>
              <div className="text-xl font-bold text-slate-900 mt-1">₹ 26,79,000.00</div>
              <span className="text-xs text-emerald-600 font-semibold">+24.8% vs H1</span>
            </Card>
            <Card className="p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Net Realized Revenue</span>
              <div className="text-xl font-bold text-brand-600 mt-1">₹ 29,99,800.00</div>
              <span className="text-xs text-slate-500 font-medium">After tax & discounts</span>
            </Card>
            <Card className="p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Blended Avg Order Value</span>
              <div className="text-xl font-bold text-slate-900 mt-1">₹ 7,125.00</div>
              <span className="text-xs text-slate-500 font-medium">Across 428 orders</span>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              title="Monthly Financial Performance Breakdown"
              subtitle="Consolidated figures from order book, Razorpay settlements, and tax ledgers"
            />
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4 text-center">Orders</th>
                    <th className="py-3 px-4 text-right">Gross GMV</th>
                    <th className="py-3 px-4 text-right">Discounts</th>
                    <th className="py-3 px-4 text-right">GST (18%)</th>
                    <th className="py-3 px-4 text-right">Net Realized</th>
                    <th className="py-3 px-4 text-right">AOV</th>
                    <th className="py-3 px-4 text-center">MoM Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {SALES_REPORT_DATA.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.month}</td>
                      <td className="py-3 px-4 text-center font-bold">{row.orders}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(row.gross)}</td>
                      <td className="py-3 px-4 text-right text-rose-600">- {formatCurrency(row.discount)}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{formatCurrency(row.tax)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(row.net)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(row.aov)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.growth.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {row.growth}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Inventory Turnover */}
      {activeReport === 'inventory' && (
        <Card className="overflow-hidden">
          <CardHeader
            title="Warehouse Inventory Valuation & Health"
            subtitle="Current stock capital tied up, turnover velocities, and low-stock replenishment alerts"
          />
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">In-Stock Qty</th>
                  <th className="py-3 px-4 text-right">Warehouse Valuation</th>
                  <th className="py-3 px-4 text-center">Velocity</th>
                  <th className="py-3 px-4">Inventory State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {INVENTORY_REPORT_DATA.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">{row.sku}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{row.product}</td>
                    <td className="py-3 px-4 text-slate-500">{row.category}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{row.stock} units</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(row.valuation)}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{row.turnoverDays}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'Stockout Alert' ? 'bg-rose-50 text-rose-700' :
                        row.status === 'Low Stock Risk' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Customer Cohorts */}
      {activeReport === 'customers' && (
        <Card className="overflow-hidden">
          <CardHeader
            title="Customer Cohort Retention & Lifetime Value"
            subtitle="Segmentation analysis across purchase frequency, average basket size, and churn probability"
          />
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Customer Cohort</th>
                  <th className="py-3 px-4 text-center">Accounts</th>
                  <th className="py-3 px-4 text-right">Avg Lifetime Value (LTV)</th>
                  <th className="py-3 px-4 text-center">Repeat Purchase Rate</th>
                  <th className="py-3 px-4">Churn Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {CUSTOMER_COHORT_DATA.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900" dangerouslySetInnerHTML={{ __html: row.cohort }} />
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{row.count} customers</td>
                    <td className="py-3 px-4 text-right font-bold text-brand-600">{formatCurrency(row.avgSpend)}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{row.repeatRate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.churnRisk.includes('High') ? 'bg-rose-50 text-rose-700' :
                        row.churnRisk.includes('Medium') ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {row.churnRisk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Support SLA */}
      {activeReport === 'support' && (
        <Card className="overflow-hidden">
          <CardHeader
            title="Customer Service SLA & Resolution Metrics"
            subtitle="Performance tracking by category, response turnarounds, and CSAT customer ratings"
          />
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Issue Category</th>
                  <th className="py-3 px-4 text-center">Resolved Tickets</th>
                  <th className="py-3 px-4 text-center">Avg Resolution Time</th>
                  <th className="py-3 px-4 text-center">SLA Compliance</th>
                  <th className="py-3 px-4 text-right">CSAT Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {SUPPORT_SLA_DATA.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{row.category}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{row.tickets}</td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600">{row.avgResolution}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{row.slaMet}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600">{row.satisfaction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
