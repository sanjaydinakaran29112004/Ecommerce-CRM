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
import { Plus, Download, Search, Eye } from 'lucide-react';

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.CUSTOMERS.LIST),
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (newCust) => {
      // In mock mode, persist to mockDb
      const existing = mockDb.get('customers');
      mockDb.set('customers', [newCust, ...existing]);
      return newCust;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers-list']);
      setIsAddModalOpen(false);
    },
  });

  // Filter customers
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.customerCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || cust.customerType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Export to CSV handler
  const handleExport = () => {
    const exportData = filteredCustomers.map((c) => ({
      Code: c.customerCode,
      Name: `${c.firstName} ${c.lastName || ''}`,
      Email: c.email,
      Phone: c.phone,
      Type: c.customerType,
      TotalSpent: c.totalSpent,
      OrdersCount: c.ordersCount,
      JoinedDate: c.createdAt,
    }));
    exportToCsv(exportData, `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const columns = [
    {
      header: 'Customer',
      accessor: 'firstName',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
            {row.firstName?.[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{row.firstName} {row.lastName}</div>
            <div className="text-[11px] text-slate-400 font-mono">{row.customerCode}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'email',
      render: (_, row) => (
        <div className="text-xs">
          <div className="text-slate-800">{row.email}</div>
          <div className="text-slate-400 text-[11px]">{row.phone}</div>
        </div>
      ),
    },
    {
      header: 'Segment',
      accessor: 'customerType',
      render: (val) => <StatusChip status={val} type="customer" />,
    },
    {
      header: 'Orders',
      accessor: 'ordersCount',
      align: 'center',
      render: (val) => <span className="font-semibold text-slate-700">{val || 0}</span>,
    },
    {
      header: 'Lifetime Spent',
      accessor: 'totalSpent',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900">{formatCurrency(val || 0)}</span>
      ),
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
          className="text-xs py-1"
        >
          View 360
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
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
            placeholder="Search by name, email, or code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 font-medium shrink-0">Filter:</span>
          {['ALL', 'VIP', 'RETURNING', 'NEW', 'INACTIVE'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
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
        isOpen={!!selectedCustomer}
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

