import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/services/api/axiosClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import { DataTable } from '@/components/data-display/DataTable';
import { StatusChip } from '@/components/data-display/StatusChip';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { mockDb } from '@/services/mock/mockDb';
import { ShoppingBag, Printer, CheckCircle2, Truck, CreditCard, ChevronRight } from 'lucide-react';

const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('PROCESSING');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.ORDERS.LIST),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const existing = mockDb.get('orders');
      const updated = existing.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o));
      mockDb.set('orders', updated);
      return { orderId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders-list']);
      setEditingOrder(null);
      if (selectedOrder) {
        setSelectedOrder((prev) => ({ ...prev, orderStatus: newStatus }));
      }
    },
  });

  const columns = [
    {
      header: 'Order Number',
      accessor: 'orderNumber',
      render: (val, row) => (
        <div>
          <span className="font-mono font-bold text-brand-600">{val}</span>
          <div className="text-[11px] text-slate-400">{formatDate(row.placedAt, 'dd MMM yyyy, hh:mm a')}</div>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (cust) => (
        <div>
          <div className="font-semibold text-slate-900">{cust.name}</div>
          <div className="text-[11px] text-slate-400">{cust.email}</div>
        </div>
      ),
    },
    {
      header: 'Line Items',
      accessor: 'items',
      render: (items) => (
        <span className="text-slate-600 text-xs">
          {items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
        </span>
      ),
    },
    {
      header: 'Total Value',
      accessor: 'pricing',
      align: 'right',
      render: (pricing) => (
        <span className="font-bold text-slate-900">{formatCurrency(pricing.total)}</span>
      ),
    },
    {
      header: 'Payment',
      accessor: 'paymentStatus',
      render: (val, row) => (
        <div>
          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {val}
          </span>
          <div className="text-[10px] text-slate-400 mt-0.5">{row.paymentMethod}</div>
        </div>
      ),
    },
    {
      header: 'Fulfillment Status',
      accessor: 'orderStatus',
      render: (val) => <StatusChip status={val} type="order" />,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditingOrder(row);
              setNewStatus(row.orderStatus);
            }}
            className="text-xs py-1"
          >
            Update
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(row);
            }}
            className="text-xs p-1.5"
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Order & Payment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track orders across fulfillment lifecycle from placement to shipment, delivery, and refunds.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedOrder(row)}
      />

      {/* Order Detail & Invoice Drawer */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details — ${selectedOrder?.orderNumber}`}
        subtitle={`Placed on ${formatDate(selectedOrder?.placedAt)}`}
        width="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs">
            {/* Status Header */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Fulfillment</span>
                <div className="mt-1">
                  <StatusChip status={selectedOrder.orderStatus} type="order" />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</span>
                <div className="mt-1 font-bold text-slate-800">
                  {selectedOrder.paymentStatus} via {selectedOrder.paymentMethod}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
              >
                Print Invoice
              </Button>
            </div>

            {/* Customer & Shipping */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 border border-slate-200 rounded-xl bg-white">
                <span className="font-semibold text-slate-700">Customer</span>
                <p className="font-bold text-slate-900 mt-1">{selectedOrder.customer.name}</p>
                <p className="text-slate-500">{selectedOrder.customer.email}</p>
                <p className="text-slate-500">{selectedOrder.customer.phone}</p>
              </div>
              <div className="p-3.5 border border-slate-200 rounded-xl bg-white">
                <span className="font-semibold text-slate-700">Delivery Address</span>
                <p className="text-slate-600 mt-1 leading-relaxed">{selectedOrder.shippingAddress}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="px-4 py-2.5 bg-slate-50 font-semibold text-slate-700 border-b border-slate-200">
                Purchased Items ({selectedOrder.items.length})
              </div>
              <div className="divide-y divide-slate-100 p-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 px-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-slate-400 text-[10px]">SKU: {item.sku} | Qty: {item.quantity}</div>
                    </div>
                    <div className="font-bold text-slate-900">{formatCurrency(item.total)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedOrder.pricing.subtotal)}</span>
              </div>
              {selectedOrder.pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>- {formatCurrency(selectedOrder.pricing.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax (GST):</span>
                <span>{formatCurrency(selectedOrder.pricing.tax)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping:</span>
                <span>{formatCurrency(selectedOrder.pricing.shipping)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-base text-slate-900">
                <span>Grand Total:</span>
                <span className="text-brand-600">{formatCurrency(selectedOrder.pricing.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Update Status Modal */}
      <Modal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title={`Update Status — ${editingOrder?.orderNumber}`}
        description="Transition the fulfillment lifecycle state"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium"
            >
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setEditingOrder(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={updateStatusMutation.isLoading}
              onClick={() =>
                updateStatusMutation.mutate({
                  orderId: editingOrder.id,
                  status: newStatus,
                })
              }
            >
              Confirm Status Change
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

