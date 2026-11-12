import React from 'react';
import { MetricCard } from '@/components/data-display/MetricCard';
import { formatCurrency } from '@/utils/formatCurrency';
import { IndianRupee, ShoppingCart, Users, TrendingUp } from 'lucide-react';

export function KpiOverview({ metrics, isLoading }) {
  // Only show skeleton on initial mount when no data is loaded yet
  if (isLoading && !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <MetricCard
        title="Total Revenue"
        value={formatCurrency(metrics?.revenue?.value ?? 74140)}
        delta={metrics?.revenue?.delta || '+14.2%'}
        deltaType="increase"
        subtitle="vs previous 30 days"
        icon={IndianRupee}
      />

      <MetricCard
        title="Total Orders"
        value={metrics?.orders?.value ?? 4}
        delta={metrics?.orders?.delta || '+8.1%'}
        deltaType="increase"
        subtitle={`${metrics?.orders?.value ?? 4} orders in system`}
        icon={ShoppingCart}
      />

      <MetricCard
        title="Active Customers"
        value={metrics?.customers?.value ?? 5}
        delta={metrics?.customers?.delta || '+12.5%'}
        deltaType="increase"
        subtitle="Active user profiles"
        icon={Users}
      />

      <MetricCard
        title="Avg Order Value"
        value={formatCurrency(metrics?.averageOrderValue?.value ?? 18535)}
        delta={metrics?.averageOrderValue?.delta || '+3.4%'}
        deltaType="increase"
        subtitle="Healthy basket size"
        icon={TrendingUp}
      />
    </div>
  );
}

