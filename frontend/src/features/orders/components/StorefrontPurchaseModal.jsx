import React, { useState } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  X,
  Plus,
  Minus,
} from 'lucide-react';

export function StorefrontPurchaseModal({ isOpen, onClose, onOrderPlaced }) {
  const [selectedProduct, setSelectedProduct] = useState({
    id: 'prod_201',
    name: 'Aura Pro Wireless ANC Headphones',
    sku: 'EK-TECH-001',
    price: 14999,
    category: 'Consumer Electronics',
    image: '🎧',
  });
  const [qty, setQty] = useState(1);
  const [customer, setCustomer] = useState({
    name: 'Rohan Deshmukh',
    email: 'rohan.d@gmail.com',
    phone: '+91 98200 45678',
    address: 'B-402, Skyline Towers, Powai, Mumbai 400076',
  });

  if (!isOpen) return null;

  const catalog = [
    {
      id: 'prod_201',
      name: 'Aura Pro Wireless ANC Headphones',
      sku: 'EK-TECH-001',
      price: 14999,
      category: 'Electronics',
      image: '🎧',
    },
    {
      id: 'prod_202',
      name: 'Titanium Smart Fitness Watch v4',
      sku: 'EK-WEAR-002',
      price: 8499,
      category: 'Wearables',
      image: '⌚',
    },
    {
      id: 'prod_203',
      name: 'Ergonomic Mesh Executive Chair',
      sku: 'EK-OFFC-003',
      price: 22500,
      category: 'Furniture',
      image: '🪑',
    },
    {
      id: 'prod_205',
      name: '100W GaN Fast Charger',
      sku: 'EK-CHAR-005',
      price: 3499,
      category: 'Accessories',
      image: '🔌',
    },
  ];

  const subtotal = selectedProduct.price * qty;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const handleProceedToPayment = () => {
    const preparedOrder = {
      customer: {
        id: `cust_${Date.now()}`,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      items: [
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          quantity: qty,
          unitPrice: selectedProduct.price,
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
      paymentStatus: 'PENDING',
      paymentMethod: 'UPI (Razorpay)',
      shippingAddress: customer.address,
      placedAt: new Date().toISOString(),
      deliveredAt: null,
    };

    onOrderPlaced(preparedOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm">Customer Online Storefront Simulator</h2>
                <span className="text-[10px] bg-brand-400/20 text-brand-300 font-bold px-2 py-0.5 rounded border border-brand-400/30">
                  B2C Storefront View
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Simulate how real shoppers buy products from the website and pay via Razorpay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Product Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              1. Select Store Item
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {catalog.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedProduct(item)}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    selectedProduct.id === item.id
                      ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">{item.image}</div>
                  <div className="font-bold text-xs text-slate-800 truncate">{item.name}</div>
                  <div className="font-extrabold text-xs text-brand-600 mt-1">{formatCurrency(item.price)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quantity & Order Summary Bar */}
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Quantity:</span>
              <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold px-2">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Total with 18% GST:</span>
              <span className="text-base font-black text-brand-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Customer Delivery Details */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              2. Shopper Information & Delivery Address
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Full Name</label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Email Address</label>
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">Shipping Address</label>
                <input
                  type="text"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Instant Payment Gateway Integration (Razorpay)</span>
            </span>

            <button
              type="button"
              onClick={handleProceedToPayment}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <CreditCard className="w-4 h-4" />
              <span>Proceed to Pay {formatCurrency(total)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
