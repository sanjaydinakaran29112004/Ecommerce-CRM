import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function OrderStatusChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { name: 'Delivered', value: 142, color: '#10b981' },
    { name: 'Shipped', value: 38, color: '#6366f1' },
    { name: 'Processing', value: 24, color: '#f59e0b' },
    { name: 'Cancelled', value: 8, color: '#ef4444' },
  ];

  return (
    <Card className="col-span-1">
      <CardHeader
        title="Fulfillment Distribution"
        subtitle="Current status breakdown of active orders"
      />
      <CardContent className="flex flex-col items-center">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs">
                        <span className="font-semibold">{payload[0].name}: </span>
                        <span>{payload[0].value} orders</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 w-full text-xs">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 truncate">{item.name}</span>
              <span className="font-semibold text-slate-800 ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
