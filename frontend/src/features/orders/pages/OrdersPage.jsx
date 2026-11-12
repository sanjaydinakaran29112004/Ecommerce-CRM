import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/services/api/axiosClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import { DataTable } from '@/components/data-display/DataTable';
import { StatusChip } from '@/components/data-display/StatusChip';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { exportToCsv } from '@/utils/exportCsv';
import { mockDb } from '@/services/mock/mockDb';
import { Printer, Plus, Download, Search, ChevronRight, User } from 'lucide-react';

const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('PROCESSING');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Create Manual Order Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [manualOrder, setManualOrder] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '+91 98401 23456',
    productName: 'Aura Pro Wireless ANC Headphones',
    productSku: 'EK-TECH-001',
    quantity: 1,
    unitPrice: 14999,
    paymentMethod: 'UPI (Razorpay)',
    shippingAddress: 'Flat 3A, Metro Residency, Mount Road, Chennai 600002',
  });

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

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const existing = mockDb.get('orders');
      const subtotal = Number(orderData.unitPrice) * Number(orderData.quantity);
      const tax = Math.round(subtotal * 0.18);
      const total = subtotal + tax;

      const orderEntry = {
        id: `ord_${Date.now()}`,
        orderNumber: `ORD-2026-${Math.floor(9000 + Math.random() * 900)}`,
        customer: {
          id: `cust_${Date.now()}`,
          name: orderData.customerName,
          email: orderData.customerEmail,
          phone: orderData.customerPhone,
        },
        items: [
          {
            productId: 'prod_201',
            name: orderData.productName,
            sku: orderData.productSku,
            quantity: Number(orderData.quantity),
            unitPrice: Number(orderData.unitPrice),
            total: subtotal,
          },
        ],
        pricing: {
          subtotal,
          discount: 0,
          tax,
          shipping: 0,
          total,
        },
        orderStatus: 'PLACED',
        paymentStatus: 'PAID',
        paymentMethod: orderData.paymentMethod,
        shippingAddress: orderData.shippingAddress,
        placedAt: new Date().toISOString(),
        deliveredAt: null,
      };

      mockDb.set('orders', [orderEntry, ...existing]);
      return orderEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders-list']);
      setIsCreateModalOpen(false);
      setManualOrder({
        customerName: '',
        customerEmail: '',
        customerPhone: '+91 98401 23456',
        productName: 'Aura Pro Wireless ANC Headphones',
        productSku: 'EK-TECH-001',
        quantity: 1,
        unitPrice: 14999,
        paymentMethod: 'UPI (Razorpay)',
        shippingAddress: 'Flat 3A, Metro Residency, Mount Road, Chennai 600002',
      });
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createOrderMutation.mutate(manualOrder);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportOrders = () => {
    const exportData = filteredOrders.map((o) => ({
      OrderNumber: o.orderNumber,
      Customer: o.customer.name,
      Email: o.customer.email,
      Phone: o.customer.phone,
      Total: o.pricing.total,
      PaymentMethod: o.paymentMethod,
      PaymentStatus: o.paymentStatus,
      FulfillmentStatus: o.orderStatus,
      PlacedAt: o.placedAt,
    }));
    exportToCsv(exportData, `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

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

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportOrders}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Orders
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Order
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order #, customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedOrder(row)}
      />

      {/* Create Manual Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Manual Order Entry"
        description="Process a telephone, offline, or assisted customer purchase with automated GST computation"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Customer Name"
              value={manualOrder.customerName}
              onChange={(e) => setManualOrder({ ...manualOrder, customerName: e.target.value })}
              placeholder="e.g. Ramesh V"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              required
            />
            <Input
              label="Customer Email"
              type="email"
              value={manualOrder.customerEmail}
              onChange={(e) => setManualOrder({ ...manualOrder, customerEmail: e.target.value })}
              placeholder="ramesh@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purchased Product</label>
              <select
                value={manualOrder.productName}
                onChange={(e) => {
                  const name = e.target.value;
                  let price = 14999;
                  let sku = 'EK-TECH-001';
                  if (name.includes('Watch')) { price = 8499; sku = 'EK-WEAR-002'; }
                  if (name.includes('Chair')) { price = 22500; sku = 'EK-OFFC-003'; }
                  if (name.includes('Charger')) { price = 3499; sku = 'EK-CHAR-005'; }
                  setManualOrder({ ...manualOrder, productName: name, unitPrice: price, productSku: sku });
                }}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                <option value="Aura Pro Wireless ANC Headphones">Aura Pro ANC Headphones (₹14,999)</option>
                <option value="Titanium Smart Fitness Watch v4">Titanium Smart Watch v4 (₹8,499)</option>
                <option value="Ergonomic Mesh Executive Chair">Ergonomic Mesh Chair (₹22,500)</option>
                <option value="100W GaN Fast Charger">100W GaN Fast Charger (₹3,499)</option>
              </select>
            </div>

            <Input
              label="Quantity"
              type="number"
              value={manualOrder.quantity}
              onChange={(e) => setManualOrder({ ...manualOrder, quantity: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
              <select
                value={manualOrder.paymentMethod}
                onChange={(e) => setManualOrder({ ...manualOrder, paymentMethod: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                <option value="UPI (Razorpay)">UPI (Razorpay)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="NetBanking">NetBanking</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
              </select>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Calculated Total</span>
              <span className="font-extrabold text-base text-brand-600">
                {formatCurrency((Number(manualOrder.unitPrice) * Number(manualOrder.quantity)) * 1.18)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Includes 18% GST</span>
            </div>
          </div>

          <Input
            label="Shipping Address"
            value={manualOrder.shippingAddress}
            onChange={(e) => setManualOrder({ ...manualOrder, shippingAddress: e.target.value })}
            placeholder="Flat, building, street, city, pin code"
            required
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createOrderMutation.isLoading}>
              Confirm & Create Order
            </Button>
          </div>
        </form>
      </Modal>

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
