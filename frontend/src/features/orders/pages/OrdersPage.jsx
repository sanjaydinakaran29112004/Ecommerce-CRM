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
import { Printer, Plus, Download, Search, ChevronRight, User, CreditCard, ShoppingBag, Sparkles, Truck, IndianRupee, Building2, QrCode, CheckCheck, MapPin, Phone, Mail, UserCheck, Check } from 'lucide-react';
import { RazorpayGatewayModal } from '../components/RazorpayGatewayModal';
import { StorefrontPurchaseModal } from '../components/StorefrontPurchaseModal';

const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('PROCESSING');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Gateway & Storefront Simulation States
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [gatewayOrder, setGatewayOrder] = useState(null);
  const [isStorefrontOpen, setIsStorefrontOpen] = useState(false);

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
    triggerGateway: true,
  });

  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.ORDERS.LIST),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.CUSTOMERS.LIST),
    staleTime: 60 * 1000,
  });

  // Extract and normalize all registered CRM customers for 1-click auto-fill
  const allCustomersList = React.useMemo(() => {
    const dbCustomers = mockDb.get('customers') || [];
    return dbCustomers.map((c) => {
      const fullName = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Valued Customer';
      const addr = c.addresses?.[0]
        ? `${c.addresses[0].addressLine}, ${c.addresses[0].city}, ${c.addresses[0].state} - ${c.addresses[0].pincode}`
        : c.shippingAddress || 'Chennai, Tamil Nadu';
      return {
        id: c.id,
        name: fullName,
        email: c.email || '',
        phone: c.phone || '+91 98401 23456',
        customerType: c.customerType || 'RETURNING',
        address: addr,
        ordersCount: c.ordersCount || 1,
      };
    });
  }, [customers]);

  // Filter customer options as user types (e.g. typing "a" shows all matching customers)
  const matchingCustomers = React.useMemo(() => {
    const q = (manualOrder.customerName || '').toLowerCase().trim();
    if (!q) {
      return allCustomersList; // Show all when clicking/focusing
    }
    return allCustomersList.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }, [allCustomersList, manualOrder.customerName]);

  const handleSelectCustomer = (customer) => {
    setManualOrder((prev) => ({
      ...prev,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      shippingAddress: customer.address,
    }));
    setSelectedCustomer(customer);
    setIsCustomerDropdownOpen(false);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const existing = mockDb.get('orders');
      const updated = existing.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o));
      mockDb.set('orders', updated);
      return { orderId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-order-status'] });
      setEditingOrder(null);
      if (selectedOrder) {
        setSelectedOrder((prev) => ({ ...prev, orderStatus: newStatus }));
      }
    },
  });

  // Successful Payment Processing Handler (Real-Time CRM Sync)
  const handlePaymentSuccess = (result) => {
    const existingOrders = mockDb.get('orders');
    const updatedOrders = existingOrders.map((o) => {
      if (o.orderNumber === result.orderNumber || o.id === gatewayOrder?.id) {
        return {
          ...o,
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED',
          paymentMethod: result.method,
          paymentDetails: result,
        };
      }
      return o;
    });
    mockDb.set('orders', updatedOrders);

    // Auto-decrement inventory for purchased product
    const existingProducts = mockDb.get('products');
    if (existingProducts && existingProducts.length > 0) {
      const updatedProducts = existingProducts.map((p) => {
        if (gatewayOrder?.items?.some((item) => item.sku === p.sku)) {
          return { ...p, stock: Math.max(0, (p.stock || 10) - (gatewayOrder.items[0]?.quantity || 1)) };
        }
        return p;
      });
      mockDb.set('products', updatedProducts);
    }

    // Update Customer Lifetime Value (Total Spent & Orders Count)
    const existingCustomers = mockDb.get('customers');
    if (existingCustomers && existingCustomers.length > 0) {
      const updatedCustomers = existingCustomers.map((c) => {
        if (
          c.email?.toLowerCase() === gatewayOrder?.customer?.email?.toLowerCase() ||
          c.firstName?.toLowerCase().includes(gatewayOrder?.customer?.name?.toLowerCase() || '')
        ) {
          return {
            ...c,
            totalSpent: (c.totalSpent || 0) + Number(result.amount),
            ordersCount: (c.ordersCount || 0) + 1,
          };
        }
        return c;
      });
      mockDb.set('customers', updatedCustomers);
    }

    // Refresh CRM Queries
    queryClient.invalidateQueries({ queryKey: ['orders-list'] });
    queryClient.invalidateQueries({ queryKey: ['products-list'] });
    queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-sales-trend'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-order-status'] });

    if (selectedOrder && (selectedOrder.id === gatewayOrder?.id || selectedOrder.orderNumber === result.orderNumber)) {
      setSelectedOrder((prev) => ({
        ...prev,
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        paymentDetails: result,
      }));
    }
  };

  // Handle Cash on Delivery Doorstep Collection
  const handleMarkCodCollected = (order) => {
    const existingOrders = mockDb.get('orders');
    const updated = existingOrders.map((o) =>
      o.id === order.id || o.orderNumber === order.orderNumber
        ? {
            ...o,
            paymentStatus: 'PAID',
            paymentMethod: 'Cash on Delivery (Collected)',
            orderStatus: o.orderStatus === 'PLACED' ? 'CONFIRMED' : o.orderStatus,
            paymentDetails: {
              method: 'CASH_ON_DELIVERY',
              status: 'COLLECTED',
              collectedAt: new Date().toISOString(),
              amount: o.pricing.total,
            },
          }
        : o
    );
    mockDb.set('orders', updated);
    queryClient.invalidateQueries({ queryKey: ['orders-list'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-order-status'] });
    if (selectedOrder && (selectedOrder.id === order.id || selectedOrder.orderNumber === order.orderNumber)) {
      setSelectedOrder((prev) => ({
        ...prev,
        paymentStatus: 'PAID',
        paymentMethod: 'Cash on Delivery (Collected)',
      }));
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const existing = mockDb.get('orders');
      const subtotal = Number(orderData.unitPrice) * Number(orderData.quantity);
      const tax = Math.round(subtotal * 0.18);
      const total = subtotal + tax;

      const isCod = orderData.paymentMethod === 'Cash on Delivery';
      const shouldTriggerGateway = !isCod && Boolean(orderData.triggerGateway);

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
        orderStatus: isCod ? 'CONFIRMED' : shouldTriggerGateway ? 'PLACED' : 'CONFIRMED',
        paymentStatus: isCod ? 'PENDING' : shouldTriggerGateway ? 'PENDING' : 'PAID',
        paymentMethod: orderData.paymentMethod,
        shippingAddress: orderData.shippingAddress,
        placedAt: new Date().toISOString(),
        deliveredAt: null,
      };

      mockDb.set('orders', [orderEntry, ...existing]);
      return { orderEntry, triggerGateway: shouldTriggerGateway };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-order-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-sales-trend'] });
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
        triggerGateway: true,
      });

      // If online payment, launch Razorpay Gateway immediately
      if (data.triggerGateway) {
        setGatewayOrder(data.orderEntry);
        setIsGatewayOpen(true);
      }
    },
  });

  // Handler for Storefront Online Purchase simulation
  const handleStorefrontOrder = (preparedOrder) => {
    const existing = mockDb.get('orders');
    const orderNumber = `ORD-2026-${Math.floor(9000 + Math.random() * 900)}`;
    const isCod = preparedOrder.paymentMethod === 'Cash on Delivery';
    const fullOrder = {
      ...preparedOrder,
      id: `ord_${Date.now()}`,
      orderNumber,
      orderStatus: isCod ? 'CONFIRMED' : 'PLACED',
      paymentStatus: 'PENDING',
    };
    mockDb.set('orders', [fullOrder, ...existing]);
    queryClient.invalidateQueries({ queryKey: ['orders-list'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-order-status'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-sales-trend'] });

    // Only open Razorpay Gateway for Online Payments (not COD)
    if (!isCod) {
      setGatewayOrder(fullOrder);
      setIsGatewayOpen(true);
    }
  };

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
      render: (val, row) => {
        const isCod = row.paymentMethod?.toLowerCase().includes('cash on delivery');
        return (
          <div>
            {val === 'PAID' ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {isCod ? 'COD PAID' : 'PAID'}
                </span>
                {!isCod && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGatewayOrder(row);
                      setIsGatewayOpen(true);
                    }}
                    title="View Razorpay Receipt"
                    className="text-[10px] text-brand-600 hover:text-brand-800 font-semibold underline cursor-pointer"
                  >
                    Receipt
                  </button>
                )}
              </div>
            ) : isCod ? (
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkCodCollected(row);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer active:scale-95 transition-all"
                  title="Mark Cash Collected upon Doorstep Delivery"
                >
                  <IndianRupee className="w-2.5 h-2.5" />
                  <span>Collect Cash</span>
                </button>
                <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Pay at Doorstep</div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGatewayOrder(row);
                    setIsGatewayOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs cursor-pointer active:scale-95 transition-all"
                >
                  {row.paymentMethod?.toLowerCase().includes('card') ? (
                    <>
                      <CreditCard className="w-2.5 h-2.5" />
                      <span>Pay via Card</span>
                    </>
                  ) : row.paymentMethod?.toLowerCase().includes('netbanking') ? (
                    <>
                      <Building2 className="w-2.5 h-2.5" />
                      <span>Pay via NetBanking</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-2.5 h-2.5" />
                      <span>Pay via UPI</span>
                    </>
                  )}
                </button>
                <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Pending</div>
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-0.5">{row.paymentMethod}</div>
          </div>
        );
      },
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

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStorefrontOpen(true)}
            leftIcon={<ShoppingBag className="w-3.5 h-3.5 text-brand-600" />}
            className="border-brand-200 text-brand-700 bg-brand-50/50 hover:bg-brand-50"
          >
            Storefront Quick Buy
          </Button>

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
          {/* Customer Selection & Real-Time Auto-Fill Dropdown */}
          <div className="space-y-3">
            {/* Linked Customer Badge Banner */}
            {selectedCustomer && (
              <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl p-2.5 flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <span className="font-semibold text-emerald-900">
                    Profile Linked: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.customerType}) • All details auto-filled!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setManualOrder((prev) => ({
                      ...prev,
                      customerName: '',
                      customerEmail: '',
                      customerPhone: '',
                      shippingAddress: '',
                    }));
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Clear / New
                </button>
              </div>
            )}

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Name (Type to search registered customers or enter new)
              </label>
              <div className="relative">
                <Input
                  value={manualOrder.customerName}
                  onChange={(e) => {
                    setManualOrder({ ...manualOrder, customerName: e.target.value });
                    setIsCustomerDropdownOpen(true);
                    if (selectedCustomer && selectedCustomer.name !== e.target.value) {
                      setSelectedCustomer(null);
                    }
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  placeholder="Click or type e.g. 'A' (Ananya, Vignesh, Meenakshi...)"
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                  required
                />
                {manualOrder.customerName && (
                  <button
                    type="button"
                    onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                    className="absolute right-2.5 top-2.5 text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 cursor-pointer"
                  >
                    {isCustomerDropdownOpen ? 'Close ▲' : 'Options ▼'}
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown List */}
              {isCustomerDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsCustomerDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Select Registered Customer to Auto-Fill</span>
                      <span className="text-brand-600">{matchingCustomers.length} Found</span>
                    </div>

                    {matchingCustomers.length > 0 ? (
                      matchingCustomers.map((c) => {
                        const initials = c.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCustomer(c)}
                            className="p-3 hover:bg-brand-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900 group-hover:text-brand-700 truncate">
                                    {c.name}
                                  </span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                    c.customerType === 'VIP'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  }`}>
                                    {c.customerType}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                                  <span>{c.email}</span>
                                  <span>•</span>
                                  <span>{c.phone}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  📍 {c.address}
                                </p>
                              </div>
                            </div>

                            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 group-hover:bg-brand-600 group-hover:text-white px-2 py-1 rounded-md border border-brand-200 group-hover:border-brand-600 transition-all shrink-0">
                              Auto-Fill ↵
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        <p className="font-semibold text-slate-700">No registered customer matching "{manualOrder.customerName}"</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">You can proceed with this custom name as a new customer.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Customer Email & Phone Auto-Filled / Editable Fields */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Customer Email"
                type="email"
                value={manualOrder.customerEmail}
                onChange={(e) => setManualOrder({ ...manualOrder, customerEmail: e.target.value })}
                placeholder="customer@example.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />
              <Input
                label="Customer Phone"
                type="tel"
                value={manualOrder.customerPhone}
                onChange={(e) => setManualOrder({ ...manualOrder, customerPhone: e.target.value })}
                placeholder="+91 98401 23456"
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>
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
                onChange={(e) => {
                  const method = e.target.value;
                  const isCod = method === 'Cash on Delivery';
                  setManualOrder({
                    ...manualOrder,
                    paymentMethod: method,
                    triggerGateway: !isCod,
                  });
                }}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                <option value="UPI (Razorpay)">UPI (Razorpay)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="NetBanking">NetBanking</option>
                <option value="Cash on Delivery">Cash on Delivery (Pay at Doorstep)</option>
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
            leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
            required
          />

          {/* Conditional Payment Method Feedback */}
          {manualOrder.paymentMethod === 'Cash on Delivery' ? (
            <div className="bg-amber-50/90 p-3.5 rounded-xl border border-amber-200/90 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-900 block">Cash on Delivery (Pay at Doorstep)</span>
                  <span className="text-[11px] text-amber-700">Zero advance payment required. Cash will be collected by courier upon delivery.</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-white border border-amber-300 px-2.5 py-1 rounded-md shadow-2xs shrink-0">
                Doorstep Cash
              </span>
            </div>
          ) : (
            <div className="bg-brand-50/70 p-3 rounded-xl border border-brand-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="text-xs font-bold text-brand-900 block">Payment Gateway Checkout</span>
                  <span className="text-[10px] text-brand-700">Open live Razorpay popup to simulate real customer payment</span>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualOrder.triggerGateway}
                  onChange={(e) => setManualOrder({ ...manualOrder, triggerGateway: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <span>Launch Razorpay Gateway</span>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createOrderMutation.isLoading}
              leftIcon={
                manualOrder.paymentMethod === 'Cash on Delivery' ? (
                  <Truck className="w-3.5 h-3.5" />
                ) : manualOrder.paymentMethod === 'NetBanking' ? (
                  <Building2 className="w-3.5 h-3.5" />
                ) : manualOrder.paymentMethod === 'Credit Card' ? (
                  <CreditCard className="w-3.5 h-3.5" />
                ) : (
                  <QrCode className="w-3.5 h-3.5" />
                )
              }
            >
              {manualOrder.paymentMethod === 'Cash on Delivery'
                ? 'Confirm Cash on Delivery Order'
                : !manualOrder.triggerGateway
                ? 'Confirm Order (Offline Paid)'
                : manualOrder.paymentMethod === 'Credit Card'
                ? 'Proceed to Card Payment'
                : manualOrder.paymentMethod === 'NetBanking'
                ? 'Proceed to NetBanking Payment'
                : 'Proceed to UPI / QR Payment'}
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
              <div className="flex items-center gap-2">
                {selectedOrder.paymentMethod?.toLowerCase().includes('cash on delivery') ? (
                  selectedOrder.paymentStatus !== 'PAID' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Truck className="w-3.5 h-3.5" />}
                      onClick={() => handleMarkCodCollected(selectedOrder)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Collect Doorstep Cash
                    </Button>
                  ) : null
                ) : selectedOrder.paymentStatus === 'PENDING' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setGatewayOrder(selectedOrder);
                      setIsGatewayOpen(true);
                    }}
                  >
                    Pay via Razorpay
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
                    onClick={() => {
                      setGatewayOrder(selectedOrder);
                      setIsGatewayOpen(true);
                    }}
                  >
                    Gateway Receipt
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => window.print()}
                >
                  Print Invoice
                </Button>
              </div>
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

            {/* Merchant Bank Account Settlement Card (Shows when paid) */}
            {selectedOrder.paymentStatus === 'PAID' && (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span>Funds Received in Merchant Account</span>
                  </span>
                  <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                    SETTLED
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60">
                  <div>
                    <span className="text-emerald-700/80 block">Merchant Beneficiary:</span>
                    <strong>EntryKode Technologies Pvt Ltd</strong>
                  </div>
                  <div>
                    <span className="text-emerald-700/80 block">Settlement Bank:</span>
                    <strong>ICICI Current A/C •••• 8842</strong>
                  </div>
                  {selectedOrder.paymentDetails?.paymentId && (
                    <div>
                      <span className="text-emerald-700/80 block">Payment ID:</span>
                      <code className="font-mono font-bold text-emerald-900">{selectedOrder.paymentDetails.paymentId}</code>
                    </div>
                  )}
                  {selectedOrder.paymentDetails?.utrNumber && (
                    <div>
                      <span className="text-emerald-700/80 block">Bank UTR / Reference:</span>
                      <code className="font-mono text-emerald-900">{selectedOrder.paymentDetails.utrNumber}</code>
                    </div>
                  )}
                </div>
              </div>
            )}

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

      {/* Razorpay Enterprise Payment Gateway Modal */}
      <RazorpayGatewayModal
        isOpen={isGatewayOpen}
        onClose={() => setIsGatewayOpen(false)}
        orderData={gatewayOrder}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Customer Storefront Online Purchase Simulator Modal */}
      <StorefrontPurchaseModal
        isOpen={isStorefrontOpen}
        onClose={() => setIsStorefrontOpen(false)}
        onOrderPlaced={handleStorefrontOrder}
      />
    </div>
  );
}
