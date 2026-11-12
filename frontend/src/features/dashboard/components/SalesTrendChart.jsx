import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function SalesTrendChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { month: 'Oct', revenue: 284000, orders: 42 },
    { month: 'Nov', revenue: 345000, orders: 58 },
    { month: 'Dec', revenue: 512000, orders: 94 },
    { month: 'Jan', revenue: 418000, orders: 67 },
    { month: 'Feb', revenue: 462000, orders: 79 },
    { month: 'Mar', revenue: 538000, orders: 88 },
  ];

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader
        title="Revenue & Sales Trend"
        subtitle="Monthly GMV performance across all direct & B2B channels"
      />
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(val) => `₹${val / 1000}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs">
                        <p className="font-semibold text-slate-300">{label}</p>
                        <p className="font-bold text-brand-300 mt-1">
                          Revenue: {formatCurrency(payload[0].value)}
                        </p>
                        <p className="text-slate-400">
                          Orders: {payload[0].payload.orders}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

