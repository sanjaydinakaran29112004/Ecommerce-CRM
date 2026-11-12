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
import { Plus, AlertTriangle, Image } from 'lucide-react';

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustmentQty, setAdjustmentQty] = useState(10);
  const [adjustmentReason, setAdjustmentReason] = useState('Stock Purchase Received');
  
  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: 'Consumer Electronics',
    brand: '',
    price: 9999,
    stock: 50,
    reservedStock: 0,
    lowStockThreshold: 10,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
  });

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

  const createProductMutation = useMutation({
    mutationFn: async (prodData) => {
      const existing = mockDb.get('products');
      const prodEntry = {
        ...prodData,
        id: `prod_${Date.now()}`,
        sku: prodData.sku.toUpperCase() || `EK-SKU-${Math.floor(100 + Math.random() * 900)}`,
        price: Number(prodData.price) || 0,
        stock: Number(prodData.stock) || 0,
        lowStockThreshold: Number(prodData.lowStockThreshold) || 10,
        reservedStock: 0,
        status: Number(prodData.stock) <= Number(prodData.lowStockThreshold) ? 'LOW_STOCK' : 'ACTIVE',
        rating: 4.8,
        createdAt: new Date().toISOString(),
      };
      mockDb.set('products', [prodEntry, ...existing]);
      return prodEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products-list']);
      setIsAddModalOpen(false);
      setNewProduct({
        sku: '',
        name: '',
        category: 'Consumer Electronics',
        brand: '',
        price: 9999,
        stock: 50,
        reservedStock: 0,
        lowStockThreshold: 10,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
      });
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

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createProductMutation.mutate(newProduct);
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

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Product SKU
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyTitle="No catalog products found"
      />

      {/* Add Product SKU Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Product SKU"
        description="Add a catalog item with pricing, barcode/SKU, and inventory threshold limits"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Product Title"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            placeholder="e.g. UltraFit Active Earbuds Gen 2"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU Code"
              value={newProduct.sku}
              onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              placeholder="e.g. EK-AUDIO-09"
              required
            />
            <Input
              label="Brand / Manufacturer"
              value={newProduct.brand}
              onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
              placeholder="e.g. SoundWave"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                <option value="Consumer Electronics">Consumer Electronics</option>
                <option value="Wearables">Wearables</option>
                <option value="Office Furniture">Office Furniture</option>
                <option value="Computer Peripherals">Computer Peripherals</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <Input
              label="Retail Price (₹)"
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              placeholder="12999"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Warehouse Stock"
              type="number"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              placeholder="50"
              required
            />
            <Input
              label="Low Stock Alert Threshold"
              type="number"
              value={newProduct.lowStockThreshold}
              onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: e.target.value })}
              placeholder="10"
              required
            />
          </div>

          <Input
            label="Image URL"
            value={newProduct.image}
            onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            leftIcon={<Image className="w-4 h-4 text-slate-400" />}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createProductMutation.isLoading}>
              Add Product SKU
            </Button>
          </div>
        </form>
      </Modal>

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
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:outline-hidden focus:border-brand-500 font-medium"
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
