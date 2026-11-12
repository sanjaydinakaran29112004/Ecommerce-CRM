import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/services/api/axiosClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import { DataTable } from '@/components/data-display/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/utils/formatCurrency';
import { mockDb } from '@/services/mock/mockDb';
import { Plus, Package, AlertTriangle, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustmentQty, setAdjustmentQty] = useState(10);
  const [adjustmentReason, setAdjustmentReason] = useState('Stock Purchase Received');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.PRODUCTS.LIST),
  });

  const adjustStockMutation = useMutation({
    mutationFn: async ({ prodId, delta, reason }) => {
      const existing = mockDb.get('products');
      const updated = existing.map((p) => {
        if (p.id === prodId) {
          const newStock = Math.max(0, p.stock + delta);
          const newStatus = newStock === 0 ? 'OUT_OF_STOCK' : newStock <= p.lowStockThreshold ? 'LOW_STOCK' : 'ACTIVE';
          return { ...p, stock: newStock, status: newStatus };
        }
        return p;
      });
      mockDb.set('products', updated);
      return { prodId, delta };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products-list']);
      setAdjustingProduct(null);
    },
  });

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (adjustingProduct) {
      adjustStockMutation.mutate({
        prodId: adjustingProduct.id,
        delta: parseInt(adjustmentQty, 10),
        reason: adjustmentReason,
      });
    }
  };

  const columns = [
    {
      header: 'Product',
      accessor: 'name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.image}
            alt={row.name}
            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
          />
          <div>
            <div className="font-semibold text-slate-900">{row.name}</div>
            <div className="text-[11px] text-slate-400 font-mono">SKU: {row.sku}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category & Brand',
      accessor: 'category',
      render: (_, row) => (
        <div className="text-xs">
          <div className="text-slate-800 font-medium">{row.category}</div>
          <div className="text-slate-400 text-[11px]">{row.brand}</div>
        </div>
      ),
    },
    {
      header: 'Price (MSRP)',
      accessor: 'price',
      align: 'right',
      render: (val) => <span className="font-bold text-slate-900">{formatCurrency(val)}</span>,
    },
    {
      header: 'Available Stock',
      accessor: 'stock',
      align: 'center',
      render: (val, row) => (
        <div className="text-center">
          <span className={`font-extrabold ${val <= row.lowStockThreshold ? 'text-rose-600' : 'text-slate-800'}`}>
            {val} units
          </span>
          {row.reservedStock > 0 && (
            <div className="text-[10px] text-slate-400">({row.reservedStock} reserved)</div>
          )}
        </div>
      ),
    },
    {
      header: 'Stock Status',
      accessor: 'status',
      render: (val) => {
        if (val === 'OUT_OF_STOCK') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3 h-3" />
              <span>Out of Stock</span>
            </span>
          );
        }
        if (val === 'LOW_STOCK') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <span>Low Stock Alert</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>In Stock</span>
          </span>
        );
      },
    },
    {
      header: 'Actions',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAdjustingProduct(row);
            setAdjustmentQty(10);
          }}
          className="text-xs py-1"
        >
          Adjust Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Product Catalogue & Inventory Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time stock levels, SKU tracking, reserved warehouse units, and movement logs.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Add Product SKU
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyTitle="No catalog products found"
      />

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        title={`Adjust Stock — ${adjustingProduct?.name}`}
        description={`Current Stock: ${adjustingProduct?.stock} units | SKU: ${adjustingProduct?.sku}`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <Input
            label="Adjustment Quantity (Use positive to add, negative to deduct)"
            type="number"
            value={adjustmentQty}
            onChange={(e) => setAdjustmentQty(e.target.value)}
            required
            helperText="e.g. 25 for shipment arrival, or -3 for damaged loss"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Adjustment Reason</label>
            <select
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:outline-hidden focus:border-brand-500"
            >
              <option value="Stock Purchase Received">Supplier Stock Arrival</option>
              <option value="Customer Return Restock">Customer Return Restocked</option>
              <option value="Damaged / Write-off">Damaged / Warehouse Write-off</option>
              <option value="Physical Audit Correction">Physical Audit Discrepancy Correction</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setAdjustingProduct(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={adjustStockMutation.isLoading}>
              Apply Stock Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
