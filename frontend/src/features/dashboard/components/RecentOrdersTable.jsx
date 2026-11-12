import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatusChip } from '@/components/data-display/StatusChip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { NavLink } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export function RecentOrdersTable({ orders = [] }) {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader
        title="Recent Orders"
        subtitle="Latest customer purchases requiring fulfillment or verification"
        action={
          <NavLink
            to="/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>View All Orders</span>
            <ArrowUpRight className="w-4 h-4" />
          </NavLink>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Fulfillment</th>
              <th className="py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {orders.slice(0, 5).map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-mono font-semibold text-brand-600">
                  {order.orderNumber}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-800">{order.customer.name}</div>
                  <div className="text-[10px] text-slate-400">{order.customer.email}</div>
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  {formatCurrency(order.pricing.total)}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <StatusChip status={order.orderStatus} type="order" />
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  {formatDate(order.placedAt, 'dd MMM, hh:mm a')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
