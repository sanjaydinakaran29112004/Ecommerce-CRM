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
import { Printer, Plus, Download, Search, ChevronRight, User, CreditCard, ShoppingBag, Sparkles, Truck, IndianRupee, Building2, QrCode, CheckCheck, MapPin, Phone, Mail, UserCheck, Check, RotateCcw, FileText, AlertCircle, ShieldCheck } from 'lucide-react';
import { RazorpayGatewayModal } from '../components/RazorpayGatewayModal';
import { StorefrontPurchaseModal } from '../components/StorefrontPurchaseModal';
import { TaxInvoiceModal } from '../components/TaxInvoiceModal';
import { GatewayReceiptModal } from '../components/GatewayReceiptModal';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { FieldRequirementsBox } from '@/components/feedback/FieldRequirementsBox';

// Blueprint Section 4.6 Exact Fulfillment States & Payment States
const ORDER_STATUSES = ['ALL', 'PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES = ['ALL', 'PENDING', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED'];

export function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('PROCESSING');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Cancellation, Tax Invoice & Gateway Receipt Modal States
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

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
    const list = (customers && customers.length > 0) ? customers : (mockDb.get('customers') || []);
    return list.map((c) => {
      const fullName = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Valued Customer';
      const addrObj = c.addresses?.[0];
      const addr = addrObj
        ? `${addrObj.street || addrObj.addressLine || 'Main Street'}, ${addrObj.city || 'Chennai'}, ${addrObj.state || 'Tamil Nadu'} - ${addrObj.postalCode || addrObj.pincode || '600001'}`
        : c.shippingAddress || 'Chennai, Tamil Nadu';
      return {
        id: c._id || c.id,
        name: fullName,
        email: c.email || '',
        phone: c.phone || '+91 98401 23456',
        customerType: c.customerType || c.segment || 'RETURNING',
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
      try {
        await axiosClient.patch(ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), { orderStatus: status });
      } catch (err) {
        console.warn('Backend updateStatus fallback:', err.message);
      }

      // Always update local persistent storage
      const existing = mockDb.get('orders') || [];
      const updated = existing.map((o) =>
        o.id === orderId || o._id === orderId || o.orderNumber === orderId
          ? {
              ...o,
              orderStatus: status,
              statusHistory: [
                {
                  status,
                  note: `Order fulfillment status transitioned to ${status}`,
                  timestamp: new Date().toISOString(),
                },
                ...(o.statusHistory || []),
              ],
            }
          : o
      );
      mockDb.set('orders', updated);

      return { orderId, status };
    },
    onSuccess: ({ orderId, status }) => {
      // Direct optimistic cache update for 0ms reactive table update
      queryClient.setQueryData(['orders-list'], (old) => {
        if (!old) return old;
        const list = Array.isArray(old) ? old : old.orders || [];
        const updated = list.map((o) =>
          o.id === orderId || o._id === orderId || o.orderNumber === orderId
            ? {
                ...o,
                orderStatus: status,
                statusHistory: [
                  {
                    status,
                    note: `Order fulfillment status transitioned to ${status}`,
                    timestamp: new Date().toISOString(),
                  },
                  ...(o.statusHistory || []),
                ],
              }
            : o
        );
        return Array.isArray(old) ? updated : { ...old, orders: updated };
      });

      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-order-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-sales-trend'] });
      queryClient.refetchQueries({ queryKey: ['orders-list'] });
      queryClient.refetchQueries({ queryKey: ['dashboard-metrics'] });
      setEditingOrder(null);

      if (
        selectedOrder &&
        (selectedOrder.id === orderId ||
          selectedOrder._id === orderId ||
          selectedOrder.orderNumber === orderId)
      ) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: status,
          statusHistory: [
            {
              status,
              note: `Order fulfillment status transitioned to ${status}`,
              timestamp: new Date().toISOString(),
            },
            ...(prev.statusHistory || []),
          ],
        }));
      }
    },
  });

  // Cancel Order Mutation (Blueprint Section 4.6 & 8)
  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }) => {
      try {
        await axiosClient.post(ENDPOINTS.ORDERS.CANCEL(orderId), { reason });
      } catch (err) {
        console.warn('Order cancel API fallback:', err);
      }
      return { orderId, reason };
    },
    onSuccess: ({ orderId, reason }) => {
      const existing = mockDb.get('orders') || [];
      const updated = existing.map((o) => {
        if (o.id === orderId || o._id === orderId || o.orderNumber === orderId) {
          const wasPaid = o.paymentStatus === 'PAID';
          return {
            ...o,
            orderStatus: 'CANCELLED',
            paymentStatus: wasPaid ? 'REFUNDED' : o.paymentStatus,
            cancelReason: reason,
          };
        }
        return o;
      });
      mockDb.set('orders', updated);
      queryClient.setQueryData(['orders-list'], updated);
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-order-status'] });
      setCancellingOrder(null);
      if (selectedOrder) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: 'CANCELLED',
          paymentStatus: prev.paymentStatus === 'PAID' ? 'REFUNDED' : prev.paymentStatus,
          cancelReason: reason,
        }));
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

    const targetOrderId = gatewayOrder?.id || gatewayOrder?._id || result.orderNumber;
    if (targetOrderId) {
      axiosClient.post(ENDPOINTS.ORDERS.PAYMENT(targetOrderId)).catch(() => {});
      axiosClient.post('/payments', {
        orderId: targetOrderId,
        transactionId: result.paymentId,
        gateway: result.gateway || (result.method?.includes('STRIPE') ? 'STRIPE' : result.method?.includes('Cash') ? 'COD' : result.method?.includes('BANK') ? 'BANK_TRANSFER' : 'RAZORPAY'),
        amountPaise: Math.round(Number(result.amount) * 100),
        idempotencyKey: `pay_idemp_${result.paymentId || Date.now()}`
      }).catch(() => {});
    }

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
    const targetOrderId = order.id || order._id || order.orderNumber;
    if (targetOrderId) {
      axiosClient.patch(ENDPOINTS.ORDERS.UPDATE_STATUS(targetOrderId), {
        orderStatus: 'CONFIRMED',
        note: 'Cash on delivery payment collected at doorstep'
      }).catch(() => {});
    }

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
              amount: o.pricing?.total || (o.totalAmountPaise ? o.totalAmountPaise / 100 : 0),
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
      const subtotal = Number(orderData.unitPrice) * Number(orderData.quantity);
      const tax = Math.round(subtotal * 0.18);
      const total = subtotal + tax;

      const isCod = orderData.paymentMethod?.toLowerCase().includes('cash');
      const shouldTriggerGateway = !isCod && Boolean(orderData.triggerGateway);

      let orderEntry;
      try {
        const payload = {
          customer: orderData.customerEmail || orderData.customerName,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          items: [
            {
              product: orderData.productSku || orderData.productName,
              sku: orderData.productSku,
              name: orderData.productName,
              quantity: Number(orderData.quantity) || 1,
              unitPrice: Number(orderData.unitPrice) || 9999,
            }
          ],
          shippingAddress: typeof orderData.shippingAddress === 'object' && orderData.shippingAddress !== null
            ? orderData.shippingAddress
            : {
                street: orderData.shippingAddress || 'Flat 3A, Metro Residency, Mount Road',
                city: 'Chennai',
                state: 'Tamil Nadu',
                postalCode: '600002',
                country: 'India',
              },
          paymentMethod: isCod ? 'COD' : 'RAZORPAY',
        };
        const backendRes = await axiosClient.post(ENDPOINTS.ORDERS.CREATE, payload);
        const savedOrder = backendRes.order || backendRes;
        const custName = savedOrder.customer?.name || savedOrder.customerSnapshot?.name || orderData.customerName || 'Valued Customer';
        const custEmail = savedOrder.customer?.email || savedOrder.customerSnapshot?.email || orderData.customerEmail || '';
        const custPhone = savedOrder.customer?.phone || savedOrder.customerSnapshot?.phone || orderData.customerPhone || '';

        orderEntry = {
          ...savedOrder,
          id: savedOrder._id || savedOrder.id,
          pricing: savedOrder.pricing || { subtotal, discount: 0, tax, shipping: 0, total },
          customer: {
            id: savedOrder.customer?.id || savedOrder.customer || `cust_${Date.now()}`,
            name: custName,
            email: custEmail,
            phone: custPhone,
          },
          customerSnapshot: {
            name: custName,
            email: custEmail,
            phone: custPhone,
          },
        };
      } catch (err) {
        console.warn('Backend order creation offline fallback:', err.message);
        const existing = mockDb.get('orders') || [];
        orderEntry = {
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
      }

      return { orderEntry, triggerGateway: shouldTriggerGateway };
    },
    onSuccess: (data) => {
      const newOrder = data?.orderEntry;
      if (newOrder) {
        // Direct optimistic insertion into React Query cache for instant table reflection
        queryClient.setQueryData(['orders-list'], (old) => {
          const list = Array.isArray(old) ? old : old?.orders || [];
          const key = newOrder.orderNumber || newOrder.id;
          return [newOrder, ...list.filter((o) => (o.orderNumber || o.id) !== key)];
        });
        const existing = mockDb.get('orders') || [];
        const key = newOrder.orderNumber || newOrder.id;
        mockDb.set('orders', [newOrder, ...existing.filter((o) => (o.orderNumber || o.id) !== key)]);
      }

      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-order-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-sales-trend'] });
      queryClient.refetchQueries({ queryKey: ['orders-list'] });
      queryClient.refetchQueries({ queryKey: ['dashboard-metrics'] });
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
  const handleStorefrontOrder = async (preparedOrder) => {
    const isCod = preparedOrder.paymentMethod === 'Cash on Delivery';
    let fullOrder;

    try {
      const payload = {
        customer: preparedOrder.customer?.email || preparedOrder.customer?.name,
        customerName: preparedOrder.customer?.name,
        customerEmail: preparedOrder.customer?.email,
        customerPhone: preparedOrder.customer?.phone,
        items: (preparedOrder.items || []).map((i) => ({
          product: i.sku || i.name,
          sku: i.sku,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        shippingAddress: typeof preparedOrder.shippingAddress === 'object' && preparedOrder.shippingAddress !== null
          ? preparedOrder.shippingAddress
          : {
              street: preparedOrder.shippingAddress || 'B-402, Skyline Towers, Powai',
              city: 'Mumbai',
              state: 'Maharashtra',
              postalCode: '400076',
              country: 'India',
            },
        paymentMethod: isCod ? 'COD' : 'RAZORPAY',
      };
      const res = await axiosClient.post(ENDPOINTS.ORDERS.CREATE, payload);
      const saved = res.order || res;
      const custName = saved.customer?.name || saved.customerSnapshot?.name || preparedOrder.customer?.name || 'Rohan Deshmukh';
      const custEmail = saved.customer?.email || saved.customerSnapshot?.email || preparedOrder.customer?.email || 'rohan.d@gmail.com';
      const custPhone = saved.customer?.phone || saved.customerSnapshot?.phone || preparedOrder.customer?.phone || '+91 98200 45678';

      fullOrder = {
        ...saved,
        id: saved._id || saved.id,
        pricing: saved.pricing || preparedOrder.pricing,
        customer: {
          id: saved.customer?.id || preparedOrder.customer?.id || `cust_${Date.now()}`,
          name: custName,
          email: custEmail,
          phone: custPhone,
        },
        customerSnapshot: {
          name: custName,
          email: custEmail,
          phone: custPhone,
        },
      };
    } catch (err) {
      console.warn('Storefront order save fallback:', err.message);
      const existing = mockDb.get('orders') || [];
      const orderNumber = `ORD-2026-${Math.floor(9000 + Math.random() * 900)}`;
      fullOrder = {
        ...preparedOrder,
        id: `ord_${Date.now()}`,
        orderNumber,
        orderStatus: isCod ? 'CONFIRMED' : 'PLACED',
        paymentStatus: 'PENDING',
      };
      mockDb.set('orders', [fullOrder, ...existing]);
    }

    // Direct optimistic update for instantaneous UI reflection
    queryClient.setQueryData(['orders-list'], (old) => {
      const list = Array.isArray(old) ? old : old?.orders || [];
      const key = fullOrder.orderNumber || fullOrder.id;
      return [fullOrder, ...list.filter((o) => (o.orderNumber || o.id) !== key)];
    });
    const existing = mockDb.get('orders') || [];
    const key = fullOrder.orderNumber || fullOrder.id;
    mockDb.set('orders', [fullOrder, ...existing.filter((o) => (o.orderNumber || o.id) !== key)]);

    queryClient.invalidateQueries({ queryKey: ['orders-list'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-order-status'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-sales-trend'] });
    queryClient.refetchQueries({ queryKey: ['orders-list'] });
    queryClient.refetchQueries({ queryKey: ['dashboard-metrics'] });

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

  // Real-time MongoDB Order List directly from Backend API (Single Source of Truth)
  const orderList = React.useMemo(() => {
    const list = Array.isArray(orders) ? orders : orders?.orders || [];
    return [...list].sort((a, b) => {
      const dateA = new Date(a.placedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.placedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [orders]);

  const filteredOrders = orderList.filter((o) => {
    const custName = o.customer?.name || o.customerSnapshot?.name || '';
    const custEmail = o.customer?.email || o.customerSnapshot?.email || '';
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    const matchesPayment = paymentFilter === 'ALL' || o.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleExportOrders = () => {
    const exportData = filteredOrders.map((o) => ({
      OrderNumber: o.orderNumber,
      Customer: o.customer?.name || o.customerSnapshot?.name || 'Customer',
      Email: o.customer?.email || o.customerSnapshot?.email || '',
      Phone: o.customer?.phone || o.customerSnapshot?.phone || '',
      Total: o.pricing?.total ?? (o.totalAmountPaise ? o.totalAmountPaise / 100 : 0),
      PaymentMethod: o.paymentMethod,
      PaymentStatus: o.paymentStatus,
      FulfillmentStatus: o.orderStatus,
      PlacedAt: o.placedAt || o.createdAt,
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
          <div className="text-[11px] text-slate-400">{formatDate(row.placedAt || row.createdAt, 'dd MMM yyyy, hh:mm a')}</div>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (cust, row) => {
        const name = cust?.name || row?.customerSnapshot?.name || 'Valued Customer';
        const email = cust?.email || row?.customerSnapshot?.email || '';
        return (
          <div>
            <div className="font-semibold text-slate-900">{name}</div>
            <div className="text-[11px] text-slate-400">{email}</div>
          </div>
        );
      },
    },
    {
      header: 'Line Items',
      accessor: 'items',
      render: (items) => (
        <span className="text-slate-600 text-xs">
          {(items || []).map((i) => `${i.quantity}x ${i.name}`).join(', ')}
        </span>
      ),
    },
    {
      header: 'Total Value',
      accessor: 'pricing',
      align: 'right',
      render: (pricing, row) => {
        const total = pricing?.total ?? row?.pricing?.total ?? (row?.totalAmountPaise ? row.totalAmountPaise / 100 : 0);
        return <span className="font-bold text-slate-900">{formatCurrency(total)}</span>;
      },
    },
    {
      header: 'Payment State',
      accessor: 'paymentStatus',
      render: (val, row) => {
        const isCod = (row.paymentMethod || '').toLowerCase().includes('cash on delivery') || (row.paymentMethod || '').toLowerCase().includes('cod');
        const isPaid = val === 'PAID';
        const isRefunded = val === 'REFUNDED' || val === 'PARTIALLY_REFUNDED';
        const isFailed = val === 'FAILED';

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <StatusChip status={val || 'PENDING'} type="payment" />
              {isPaid && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReceiptOrder(row);
                      setIsReceiptModalOpen(true);
                    }}
                    title="Generate & View Official Gateway Payment Receipt"
                    className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    Receipt
                  </button>
                  <span className="text-[10px] text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInvoiceOrder(row);
                      setIsInvoiceModalOpen(true);
                    }}
                    title="Generate & View Official GST Tax Invoice"
                    className="text-[10px] text-brand-600 hover:text-brand-800 font-bold underline cursor-pointer"
                  >
                    Invoice
                  </button>
                </div>
              )}
            </div>

            {!isPaid && !isRefunded && (
              isCod ? (
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
              ) : isFailed ? (
                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGatewayOrder(row);
                      setIsGatewayOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Retry Gateway</span>
                  </button>
                  <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Payment Declined</div>
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
                    <CreditCard className="w-2.5 h-2.5" />
                    <span>Pay via Gateway</span>
                  </button>
                  <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Payment Pending</div>
                </div>
              )
            )}
            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{row.paymentMethod || 'Online Gateway'}</div>
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
      render: (_, row) => {
        const canCancel = !['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(row.orderStatus);

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setInvoiceOrder(row);
                setIsInvoiceModalOpen(true);
              }}
              className="text-xs py-1 px-2"
              title="Official GST Tax Invoice"
            >
              Invoice
            </Button>
            {!['DELIVERED', 'CANCELLED'].includes(row.orderStatus) && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingOrder(row);
                  setNewStatus(row.orderStatus);
                }}
                className="text-xs py-1 px-2"
              >
                Update
              </Button>
            )}
            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setCancellingOrder(row);
                }}
                className="text-xs py-1 px-2 text-rose-600 hover:bg-rose-50"
                title="Cancel Order & Restock Warehouse"
              >
                Cancel
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(row);
              }}
              className="text-xs p-1"
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        );
      },
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

      {/* Dual Filter and Search Bar (Blueprint Section 4.6 Lifecycle & Payment States) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
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

          {/* Row 1: Fulfillment Lifecycle Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {ORDER_STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Payment States Filter (Blueprint: Pending, Paid, Failed, Partially Refunded, Refunded) */}
        <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 text-xs overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Payment State:</span>
          {PAYMENT_STATUSES.map((pst) => (
            <button
              key={pst}
              onClick={() => setPaymentFilter(pst)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                paymentFilter === pst
                  ? pst === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : pst === 'FAILED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : pst === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : pst === 'REFUNDED' || pst === 'PARTIALLY_REFUNDED'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {pst.replace(/_/g, ' ')}
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

              {manualOrder.customerName && (manualOrder.customerName.trim().length < 3 || !/^[A-Za-z\s.]+$/.test(manualOrder.customerName)) && (
                <div className="mt-1.5">
                  <FieldRequirementsBox type="name" value={manualOrder.customerName} />
                </div>
              )}

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
              <div>
                <Input
                  label="Customer Email"
                  type="email"
                  value={manualOrder.customerEmail}
                  onChange={(e) => setManualOrder({ ...manualOrder, customerEmail: e.target.value })}
                  placeholder="customer@example.com"
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  required
                />
                {manualOrder.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualOrder.customerEmail) && (
                  <div className="mt-1.5">
                    <FieldRequirementsBox type="email" value={manualOrder.customerEmail} />
                  </div>
                )}
              </div>
              <div>
                <Input
                  label="Customer Phone"
                  type="tel"
                  value={manualOrder.customerPhone}
                  onChange={(e) => setManualOrder({ ...manualOrder, customerPhone: e.target.value })}
                  placeholder="+91 98401 23456"
                  leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                  required
                />
                {manualOrder.customerPhone && manualOrder.customerPhone.replace(/[\s\-\+]/g, '').slice(-10).length !== 10 && (
                  <div className="mt-1.5">
                    <FieldRequirementsBox type="phone" value={manualOrder.customerPhone} />
                  </div>
                )}
              </div>
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
                <option value="UPI (Razorpay)">UPI (Razorpay - GPay/PhonePe/Paytm)</option>
                <option value="Credit Card">Credit / Debit Card (Razorpay)</option>
                <option value="Stripe Global Card">Stripe Global Card (Visa/Mastercard/Amex)</option>
                <option value="NetBanking">NetBanking (SBI/HDFC/ICICI/Axis)</option>
                <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT / RTGS / IMPS)</option>
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

          <div>
            <Input
              label="Shipping Address (Must include 6-digit Pincode)"
              value={manualOrder.shippingAddress}
              onChange={(e) => setManualOrder({ ...manualOrder, shippingAddress: e.target.value })}
              placeholder="Flat, building, street, city, 6-digit pin code"
              leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              required
            />
            {manualOrder.shippingAddress && (!/\b\d{6}\b/.test(manualOrder.shippingAddress) || manualOrder.shippingAddress.trim().length < 10) && (
              <div className="mt-1.5">
                <FieldRequirementsBox
                  rules={[
                    {
                      id: 'addr_pin',
                      label: 'Address must include a valid 6-digit postal pincode (e.g. 600002).',
                      satisfied: /\b\d{6}\b/.test(manualOrder.shippingAddress),
                    },
                    {
                      id: 'addr_len',
                      label: 'Address must contain street, city, and state details (at least 10 characters).',
                      satisfied: manualOrder.shippingAddress.trim().length >= 10,
                    },
                  ]}
                />
              </div>
            )}
          </div>

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
                      setReceiptOrder(selectedOrder);
                      setIsReceiptModalOpen(true);
                    }}
                  >
                    Gateway Receipt
                  </Button>
                )}
                {!['DELIVERED', 'CANCELLED'].includes(selectedOrder.orderStatus) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingOrder(selectedOrder);
                      setNewStatus(selectedOrder.orderStatus);
                    }}
                    className="text-xs"
                  >
                    Update Status
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Delivered (Finalized)</span>
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer className="w-3.5 h-3.5 text-brand-600" />}
                  onClick={() => {
                    setInvoiceOrder(selectedOrder);
                    setIsInvoiceModalOpen(true);
                  }}
                >
                  Tax Invoice
                </Button>
                {!['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(selectedOrder.orderStatus) && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
                    onClick={() => setCancellingOrder(selectedOrder)}
                    className="text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>

            {/* Customer & Shipping */}
            {(() => {
              const custName =
                selectedOrder.customer?.name ||
                selectedOrder.customerSnapshot?.name ||
                (typeof selectedOrder.customer === 'string' ? selectedOrder.customer : '') ||
                'Valued Customer';
              const custEmail =
                selectedOrder.customer?.email ||
                selectedOrder.customerSnapshot?.email ||
                'customer@example.com';
              const custPhone =
                selectedOrder.customer?.phone ||
                selectedOrder.customerSnapshot?.phone ||
                '+91 98401 23456';
              const rawAddr = selectedOrder.shippingAddress;
              const addrText =
                typeof rawAddr === 'string'
                  ? rawAddr
                  : rawAddr?.street
                    ? `${rawAddr.street}, ${rawAddr.city || 'Chennai'}, ${rawAddr.state || 'Tamil Nadu'} - ${rawAddr.postalCode || '600001'}`
                    : 'Flat 3A, Metro Residency, Mount Road, Chennai, Tamil Nadu 600002';

              return (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 border border-slate-200 rounded-xl bg-white">
                    <span className="font-semibold text-slate-700">Customer</span>
                    <p className="font-bold text-slate-900 mt-1">{custName}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{custEmail}</p>
                    <p className="text-slate-500 text-xs">{custPhone}</p>
                  </div>
                  <div className="p-3.5 border border-slate-200 rounded-xl bg-white">
                    <span className="font-semibold text-slate-700">Delivery Address</span>
                    <p className="text-slate-600 mt-1 text-xs leading-relaxed">{addrText}</p>
                  </div>
                </div>
              );
            })()}

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

            {/* Status History Timeline (Blueprint Section 4.6) */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="font-bold text-slate-800">Status History Timeline</span>
                <span className="text-[10px] text-slate-400 font-mono">Audited Transitions</span>
              </div>
              <div className="space-y-2">
                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                  selectedOrder.statusHistory.map((hist, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-2.5 pb-2 border-b border-slate-50 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{hist.status}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{formatDate(hist.timestamp || new Date(), 'dd MMM, hh:mm a')}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{hist.note || 'State updated in CRM'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400 py-1">
                    Current status: <strong>{selectedOrder.orderStatus}</strong> (Placed on {formatDate(selectedOrder.placedAt || selectedOrder.createdAt, 'dd MMM yyyy')})
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="px-4 py-2.5 bg-slate-50 font-semibold text-slate-700 border-b border-slate-200">
                Purchased Items ({selectedOrder.items?.length || 0})
              </div>
              <div className="divide-y divide-slate-100 p-2">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="py-2.5 px-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-slate-400 text-[10px]">SKU: {item.sku} | Qty: {item.quantity}</div>
                    </div>
                    <div className="font-bold text-slate-900">
                      {formatCurrency(item.total ?? (item.totalPricePaise ? item.totalPricePaise / 100 : (item.unitPrice || 0) * (item.quantity || 1)))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedOrder.pricing?.subtotal ?? (selectedOrder.subtotalPaise ? selectedOrder.subtotalPaise / 100 : 0))}</span>
              </div>
              {(selectedOrder.pricing?.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>- {formatCurrency(selectedOrder.pricing?.discount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax (GST):</span>
                <span>{formatCurrency(selectedOrder.pricing?.tax ?? (selectedOrder.taxPaise ? selectedOrder.taxPaise / 100 : 0))}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping:</span>
                <span>{formatCurrency(selectedOrder.pricing?.shipping ?? (selectedOrder.shippingFeePaise ? selectedOrder.shippingFeePaise / 100 : 0))}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-base text-slate-900">
                <span>Grand Total:</span>
                <span className="text-brand-600">
                  {formatCurrency(selectedOrder.pricing?.total ?? (selectedOrder.totalAmountPaise ? selectedOrder.totalAmountPaise / 100 : 0))}
                </span>
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
              {ORDER_STATUSES.filter((st) => st !== 'ALL').map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, ' ')}
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
                  orderId: editingOrder.orderNumber || editingOrder._id || editingOrder.id,
                  status: newStatus,
                })
              }
            >
              Confirm Status Change
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tax Invoice Modal (Blueprint Section 4.6 & Rule 46 CGST) */}
      {/* Official Tax Invoice Modal */}
      <TaxInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={invoiceOrder}
      />

      {/* Official Gateway Payment Receipt Modal */}
      <GatewayReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={receiptOrder}
      />

      {/* Cancel Order Modal (Blueprint Section 4.6 & Section 8) */}
      <CancelOrderModal
        isOpen={Boolean(cancellingOrder)}
        onClose={() => setCancellingOrder(null)}
        order={cancellingOrder}
        onConfirmCancel={cancelOrderMutation.mutate}
        isPending={cancelOrderMutation.isPending}
      />

      {/* Razorpay & Stripe Enterprise Payment Gateway Modal */}
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
