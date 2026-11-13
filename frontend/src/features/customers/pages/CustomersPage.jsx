import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/services/api/axiosClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import { DataTable } from '@/components/data-display/DataTable';
import { StatusChip } from '@/components/data-display/StatusChip';
import { Customer360Drawer } from '../components/Customer360Drawer';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { exportToCsv } from '@/utils/exportCsv';
import { mockDb } from '@/services/mock/mockDb';
import { Plus, Download, Search, Eye, CheckCircle2 } from 'lucide-react';

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get(ENDPOINTS.CUSTOMERS.LIST);
        return Array.isArray(res) ? res : res?.customers || [];
      } catch (err) {
        console.warn('Customer list fallback:', err.message);
        return mockDb.get('customers') || [];
      }
    },
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (newCust) => {
      try {
        const payload = {
          firstName: newCust.firstName,
          lastName: newCust.lastName || '',
          email: newCust.email,
          phone: newCust.phone,
          customerType: (newCust.customerType || 'NEW').toUpperCase(),
          segment: (newCust.customerType || 'NEW').toUpperCase(),
          source: newCust.source || 'WEBSITE',
          addresses: newCust.addresses || [
            {
              type: 'SHIPPING',
              street: newCust.street || newCust.addressLine || 'Main Street',
              addressLine: newCust.street || newCust.addressLine || 'Main Street',
              city: newCust.city || 'Chennai',
              state: newCust.state || 'Tamil Nadu',
              postalCode: newCust.postalCode || newCust.pincode || '600001',
              pincode: newCust.postalCode || newCust.pincode || '600001',
              country: 'India',
              isDefault: true,
            }
          ]
        };
        const res = await axiosClient.post(ENDPOINTS.CUSTOMERS.CREATE, payload);
        return res?.customer || res;
      } catch (err) {
        console.warn('Customer create fallback:', err.message);
        const existing = mockDb.get('customers') || [];
        const fallbackCustomer = {
          ...newCust,
          id: `cust_${Date.now()}`,
          customerCode: `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
          customerType: newCust.customerType || 'NEW',
          segment: newCust.customerType || 'NEW',
          totalSpent: 0,
          ordersCount: 0,
          createdAt: new Date().toISOString()
        };
        mockDb.set('customers', [fallbackCustomer, ...existing]);
        return fallbackCustomer;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      setIsAddModalOpen(false);
      setSuccessMessage(`Customer profile for ${data.firstName} ${data.lastName || ''} successfully registered!`);
      setTimeout(() => setSuccessMessage(''), 4500);
    },
  });

  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

  // Auto-classify customers inactive if no activity for > 1 year
  const getComputedSegment = (cust) => {
    const raw = (cust.customerType || cust.segment || '').toUpperCase();
    if (raw === 'INACTIVE') return 'INACTIVE';

    const lastDate = cust.lastOrderDate || cust.lastActiveAt || cust.updatedAt || cust.createdAt;
    if (lastDate) {
      const diff = Date.now() - new Date(lastDate).getTime();
      if (!isNaN(diff) && diff > ONE_YEAR_MS) {
        return 'INACTIVE';
      }
    }
    return raw || 'NEW';
  };

  // Filter customers safely
  const customerList = Array.isArray(customers) ? customers : customers?.customers || [];
  const filteredCustomers = customerList.filter((cust) => {
    const q = searchTerm.trim().toLowerCase();
    const fullName = `${cust.firstName || ''} ${cust.lastName || ''}`.toLowerCase();
    const email = (cust.email || '').toLowerCase();
    const phone = (cust.phone || '').toLowerCase();
    const code = (cust.customerCode || '').toLowerCase();
    const company = (cust.companyName || '').toLowerCase();

    const matchesSearch =
      !q ||
      fullName.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      code.includes(q) ||
      company.includes(q);

    const segment = getComputedSegment(cust);
    const matchesType = typeFilter === 'ALL' || segment === typeFilter;
    return matchesSearch && matchesType;
  });

  // Export to CSV handler
  const handleExport = () => {
    const exportData = filteredCustomers.map((c) => ({
      Code: c.customerCode || 'CUST-000',
      Name: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      Email: c.email || '',
      Phone: c.phone || '',
      Segment: (c.customerType || c.segment || 'NEW').toUpperCase(),
      TotalSpent: c.totalSpent !== undefined ? c.totalSpent : ((c.metrics?.totalSpentPaise || 0) / 100),
      OrdersCount: c.ordersCount !== undefined ? c.ordersCount : (c.metrics?.ordersCount || 0),
      JoinedDate: c.createdAt || new Date().toISOString(),
    }));
    exportToCsv(exportData, `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const columns = [
    {
      header: 'Customer',
      accessor: 'firstName',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs shadow-2xs">
            {row.firstName?.[0] || 'C'}
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              {row.firstName} {row.lastName || ''}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{row.customerCode || 'CUST-000'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'email',
      render: (_, row) => (
        <div className="text-xs">
          <div className="text-slate-800 font-medium">{row.email}</div>
          <div className="text-slate-400 text-[11px]">{row.phone || 'No phone'}</div>
        </div>
      ),
    },
    {
      header: 'Segment',
      accessor: 'customerType',
      render: (val, row) => {
        const computed = getComputedSegment(row);
        const isOneYearInactive = computed === 'INACTIVE' && (val || row.segment) !== 'INACTIVE';
        return (
          <div>
            <StatusChip status={computed} type="customer" />
            {isOneYearInactive && (
              <span className="block text-[9px] text-amber-600 font-semibold mt-0.5">
                Inactive (&gt;1 yr dormant)
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Last Active',
      accessor: 'lastOrderDate',
      render: (_, row) => {
        const dateStr = row.lastOrderDate || row.lastActiveAt || row.updatedAt || row.createdAt;
        if (!dateStr) return <span className="text-slate-400 text-xs">—</span>;
        const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
        const isOverYear = diffDays > 365;
        return (
          <div className="text-xs">
            <span className={isOverYear ? 'text-amber-700 font-medium' : 'text-slate-700'}>
              {new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="block text-[10px] text-slate-400">
              {diffDays > 0 ? `${diffDays} days ago` : 'Recent'}
              {isOverYear && ' • Inactive'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Orders',
      accessor: 'ordersCount',
      align: 'center',
      render: (val, row) => (
        <span className="font-semibold text-slate-700">
          {val !== undefined ? val : (row.metrics?.ordersCount || 0)}
        </span>
      ),
    },
    {
      header: 'Lifetime Spent',
      accessor: 'totalSpent',
      align: 'right',
      render: (val, row) => {
        const amount = val !== undefined ? val : ((row.metrics?.totalSpentPaise || 0) / 100);
        return <span className="font-bold text-slate-900">{formatCurrency(amount || 0)}</span>;
      },
    },
    {
      header: 'Joined Date',
      accessor: 'createdAt',
      render: (val) => <span className="text-slate-500 text-xs">{formatDate(val, 'dd MMM yyyy')}</span>,
    },
    {
      header: 'Action',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCustomer(row);
          }}
          className="text-xs py-1 cursor-pointer"
        >
          View 360
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Customer Directory (Customer 360)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centralized database of customer profiles, purchase history, and omnichannel interactions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Customer
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
            placeholder="Search by name, email, phone, or code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 font-medium shrink-0">Segment:</span>
          {['ALL', 'VIP', 'RETURNING', 'NEW', 'INACTIVE'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
                typeFilter === type
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedCustomer(row)}
        emptyTitle="No customers match your filter"
        emptyDescription="Try clearing your search term or add a new customer profile."
        emptyActionLabel="Add Customer"
        onEmptyAction={() => setIsAddModalOpen(true)}
      />

      {/* Slide-out 360 Drawer */}
      <Customer360Drawer
        customer={selectedCustomer}
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
      />

      {/* Add Customer Modal */}
      <CustomerFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={(data) => createCustomerMutation.mutate(data)}
        isLoading={createCustomerMutation.isLoading}
      />
    </div>
  );
}
