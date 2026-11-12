import React, { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { StatusChip } from '@/components/data-display/StatusChip';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { Button } from '@/components/ui/Button';
import { Mail, Phone, MapPin, Calendar, ShoppingBag, LifeBuoy, Clock, ArrowUpRight } from 'lucide-react';

export function Customer360Drawer({ customer, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!customer) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Customer 360 — ${customer.firstName} ${customer.lastName || ''}`}
      subtitle={`Code: ${customer.customerCode || 'CUST-000'}`}
      width="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
              {customer.firstName?.[0] || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {customer.firstName} {customer.lastName || ''}
                </h3>
                <StatusChip status={customer.customerType} type="customer" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Acquisition Source: {customer.source}</p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
            <span className="text-[10px] uppercase font-bold text-slate-400">Lifetime Value</span>
            <div className="text-xl font-extrabold text-brand-600">
              {formatCurrency(customer.totalSpent || 0)}
            </div>
            <span className="text-xs text-slate-500 font-medium">{customer.ordersCount || 0} Total Orders</span>
          </div>
        </div>

        {/* Contact Info Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-white">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-white">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{customer.phone || 'No phone'}</span>
          </div>
        </div>

        {/* Primary Address */}
        {customer.addresses?.[0] && (
          <div className="p-3.5 rounded-lg border border-slate-200/80 bg-white text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Primary Shipping Address</span>
            </div>
            <p className="text-slate-600 pl-6">
              {customer.addresses[0].addressLine}, {customer.addresses[0].city},{' '}
              {customer.addresses[0].state} - {customer.addresses[0].pincode}
            </p>
          </div>
        )}

        {/* Tabs for History */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6 text-xs font-semibold">
            {[
              { id: 'overview', label: 'Activity Timeline', icon: Clock },
              { id: 'orders', label: 'Order History', icon: ShoppingBag },
              { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-600 text-brand-600'
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

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs border-l-2 border-brand-500 pl-4 py-1">
              <span className="font-semibold text-slate-800">Account Registered:</span>
              <span className="text-slate-500">{formatDate(customer.createdAt)}</span>
            </div>
            <div className="flex items-start gap-3 text-xs border-l-2 border-emerald-500 pl-4 py-1">
              <span className="font-semibold text-slate-800">Last Purchase Completed:</span>
              <span className="text-slate-500">₹ 24,776.00 (Delivered)</span>
            </div>
            <div className="flex items-start gap-3 text-xs border-l-2 border-slate-300 pl-4 py-1">
              <span className="font-semibold text-slate-800">Support Ticket Resolved:</span>
              <span className="text-slate-500">GST Invoice dispatch</span>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="text-xs text-slate-500 text-center py-6">
            Showing latest synced orders for this customer code.
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="text-xs text-slate-500 text-center py-6">
            No active escalations. All past tickets closed within SLA.
          </div>
        )}
      </div>
    </Drawer>
  );
}
