import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/services/api/axiosClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import { KpiOverview } from '../components/KpiOverview';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { OrderStatusChart } from '../components/OrderStatusChart';
import { RecentOrdersTable } from '../components/RecentOrdersTable';
import { Button } from '@/components/ui/Button';
import { Plus, Download, Calendar, Filter } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState('30_days');

  // React Query fetching dashboard metrics
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['dashboard-metrics', dateFilter],
    queryFn: () => axiosClient.get(ENDPOINTS.DASHBOARD.METRICS, { params: { range: dateFilter } }),
  });

  const { data: salesTrend } = useQuery({
    queryKey: ['dashboard-sales-trend'],
    queryFn: () => axiosClient.get(ENDPOINTS.DASHBOARD.SALES_TREND),
  });

  const { data: orderStatus } = useQuery({
    queryKey: ['dashboard-order-status'],
    queryFn: () => axiosClient.get(ENDPOINTS.DASHBOARD.ORDER_STATUS),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.ORDERS.LIST),
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Sanjay'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here is the live performance overview of your e-commerce operations.
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            {['today', '7_days', '30_days', 'this_month'].map((range) => (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  dateFilter === range
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'today' && 'Today'}
                {range === '7_days' && '7 Days'}
                {range === '30_days' && '30 Days'}
                {range === 'this_month' && 'This Month'}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <KpiOverview metrics={metrics} isLoading={isMetricsLoading} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesTrendChart data={salesTrend} />
        <OrderStatusChart data={orderStatus} />
      </div>

      {/* Recent Orders Table */}
      <div className="grid grid-cols-1 gap-6">
        <RecentOrdersTable orders={orders} />
      </div>
    </div>
  );
}
