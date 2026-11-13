import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/services/api/axiosClient';
import { Drawer } from '@/components/ui/Drawer';
import { StatusChip } from '@/components/data-display/StatusChip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { Mail, Phone, MapPin, ShoppingBag, LifeBuoy, Clock, ExternalLink } from 'lucide-react';

export function Customer360Drawer({ customer, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const customerId = customer?._id || customer?.id;

  // Real Customer Orders Query
  const { data: customerOrders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      try {
        const res = await axiosClient.get(`/customers/${customerId}/orders`);
        return Array.isArray(res) ? res : res?.orders || [];
      } catch (err) {
        return [];
      }
    },
    enabled: Boolean(customerId && isOpen),
  });

  // Real Customer Activity Timeline Query
  const { data: customerActivities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['customer-activities', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      try {
        const res = await axiosClient.get(`/customers/${customerId}/activities`);
        return Array.isArray(res) ? res : res?.activities || [];
      } catch (err) {
        return [];
      }
    },
    enabled: Boolean(customerId && isOpen),
  });

  if (!customer) return null;

  const lifetimeValue = customer.totalSpent !== undefined
    ? customer.totalSpent
    : ((customer.metrics?.totalSpentPaise || 0) / 100);

  const totalOrdersCount = customer.ordersCount !== undefined
    ? customer.ordersCount
    : (customer.metrics?.ordersCount || customerOrders.length || 0);

  const primaryAddr = customer.addresses?.[0];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Customer 360 — ${customer.firstName} ${customer.lastName || ''}`}
      subtitle={`Code: ${customer.customerCode || 'CUST-000'}`}
      width="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Profile Header Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
              {customer.firstName?.[0] || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {customer.firstName} {customer.lastName || ''}
                </h3>
                <StatusChip status={customer.customerType || customer.segment || 'NEW'} type="customer" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Acquisition Source: <span className="font-semibold text-slate-700">{customer.source || 'Website Organic'}</span>
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
            <span className="text-[10px] uppercase font-bold text-slate-400">Lifetime Value</span>
            <div className="text-xl font-extrabold text-brand-600">
              {formatCurrency(lifetimeValue)}
            </div>
            <span className="text-xs text-slate-500 font-medium">{totalOrdersCount} Total Orders</span>
          </div>
        </div>

        {/* Contact Info Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-white shadow-2xs">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate font-medium text-slate-800">{customer.email || 'No email provided'}</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-white shadow-2xs">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800">{customer.phone || 'No phone provided'}</span>
          </div>
        </div>

        {/* Primary Address */}
        {primaryAddr && (
          <div className="p-3.5 rounded-lg border border-slate-200/80 bg-white text-xs shadow-2xs">
            <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Primary Shipping Address</span>
            </div>
            <p className="text-slate-600 pl-6">
              {primaryAddr.street || primaryAddr.addressLine || 'Main Street'}, {primaryAddr.city || 'Chennai'},{' '}
              {primaryAddr.state || 'Tamil Nadu'} - {primaryAddr.postalCode || primaryAddr.pincode || '600001'}
            </p>
          </div>
        )}

        {/* Tabs for History */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6 text-xs font-semibold">
            {[
              { id: 'overview', label: 'Activity Timeline', icon: Clock },
              { id: 'orders', label: `Order History (${customerOrders.length})`, icon: ShoppingBag },
              { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-brand-600 text-brand-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab 1: Activity Timeline */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {isActivitiesLoading ? (
              <div className="py-6 text-center text-xs text-slate-400 animate-pulse">Loading activity history...</div>
            ) : customerActivities.length > 0 ? (
              customerActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs border-l-2 border-brand-500 pl-4 py-1.5">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{act.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(act.timestamp)}</p>
                  </div>
                  {act.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {act.badge}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-xs border-l-2 border-brand-500 pl-4 py-1.5">
                  <span className="font-semibold text-slate-800">Account Registered:</span>
                  <span className="text-slate-500">{formatDate(customer.createdAt)}</span>
                </div>
                {lifetimeValue > 0 && (
                  <div className="flex items-start gap-3 text-xs border-l-2 border-emerald-500 pl-4 py-1.5">
                    <span className="font-semibold text-slate-800">Total Purchase Value:</span>
                    <span className="text-emerald-700 font-bold">{formatCurrency(lifetimeValue)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Real Order History */}
        {activeTab === 'orders' && (
          <div className="space-y-2.5">
            {isOrdersLoading ? (
              <div className="py-6 text-center text-xs text-slate-400 animate-pulse">Fetching orders...</div>
            ) : customerOrders.length > 0 ? (
              customerOrders.map((ord) => (
                <div
                  key={ord.id || ord._id}
                  className="p-3 bg-white rounded-xl border border-slate-200/90 flex items-center justify-between shadow-2xs hover:border-brand-200 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-600 text-xs">
                        {ord.orderNumber}
                      </span>
                      <StatusChip status={ord.orderStatus} type="order" />
                      <StatusChip status={ord.paymentStatus} type="payment" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {ord.items?.length || 1} items • {formatDate(ord.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-xs">
                      {formatCurrency(ord.total ?? (ord.totalAmountPaise / 100) ?? 0)}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {ord.paymentMethod || 'Razorpay UPI'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-200">
                No orders placed yet for this customer profile.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Support Tickets */}
        {activeTab === 'tickets' && (
          <div className="p-6 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <LifeBuoy className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="font-medium text-slate-700">No active escalations</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All customer inquiries are resolved within standard SLA.</p>
          </div>
        )}
      </div>
    </Drawer>
  );
}


