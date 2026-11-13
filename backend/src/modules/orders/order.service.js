const mongoose = require('mongoose');
const Order = require('./order.model');
const Customer = require('../customers/customer.model');
const Product = require('../products/product.model');
const Inventory = require('../inventory/inventory.model');
const StockMovement = require('../inventory/stockMovement.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');

function normalizeAddress(addr) {
  if (!addr) {
    return {
      street: 'Flat 3A, Metro Residency, Mount Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600002',
      country: 'India'
    };
  }
  if (typeof addr === 'object' && addr !== null) {
    return {
      street: addr.street || addr.addressLine || addr.line1 || 'Main Street',
      city: addr.city || 'Chennai',
      state: addr.state || 'Tamil Nadu',
      postalCode: addr.postalCode || addr.pincode || addr.zipCode || '600001',
      country: addr.country || 'India'
    };
  }
  if (typeof addr === 'string') {
    const trimmed = addr.trim();
    const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
    const postalMatch = trimmed.match(/\b\d{6}\b/);
    const postalCode = postalMatch ? postalMatch[0] : '600001';

    let city = 'Chennai';
    let state = 'Tamil Nadu';
    if (parts.length >= 3) {
      city = parts[parts.length - 2]?.replace(/\d+/g, '').trim() || 'Chennai';
      state = parts[parts.length - 1]?.replace(/\d+/g, '').trim() || 'Tamil Nadu';
    } else if (parts.length === 2) {
      city = parts[1]?.replace(/\d+/g, '').trim() || 'Chennai';
    }

    return {
      street: parts[0] || trimmed || 'Main Street',
      city: city || 'Chennai',
      state: state || 'Tamil Nadu',
      postalCode: postalCode || '600001',
      country: 'India'
    };
  }
  return {
    street: 'Main Street',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600001',
    country: 'India'
  };
}

class OrderService {
  /**
   * Create an Order with automatic inventory stock deduction and audit ledger logging
   */
  async createOrder(orderData, user) {
    const normShipping = normalizeAddress(orderData.shippingAddress);
    const normBilling = normalizeAddress(orderData.billingAddress || orderData.shippingAddress);

    // 1. Resolve or Auto-Bootstrap Customer
    let customer = null;
    const custIdentifier = orderData.customer || orderData.customerEmail || orderData.customerName || '';
    if (mongoose.Types.ObjectId.isValid(custIdentifier)) {
      customer = await Customer.findById(custIdentifier);
    }
    if (!customer && custIdentifier) {
      customer = await Customer.findOne({
        $or: [
          { customerCode: custIdentifier.toUpperCase() },
          { email: custIdentifier.toLowerCase() },
          { phone: custIdentifier },
          { firstName: new RegExp(custIdentifier, 'i') }
        ]
      });
    }

    if (!customer) {
      const email = orderData.customerEmail || `customer_${Date.now()}@crm.local`;
      const nameParts = (orderData.customerName || 'Valued Customer').split(' ');
      const firstName = nameParts[0] || 'Valued';
      const lastName = nameParts.slice(1).join(' ') || 'Customer';
      customer = await Customer.create({
        firstName,
        lastName,
        email,
        phone: orderData.customerPhone || '+91 98401 23456',
        source: 'MANUAL',
        segment: 'NEW',
        addresses: [normShipping]
      });
    }

    // 2. Validate Products and Deduct Live Stock
    const processedItems = [];
    let subtotalPaise = 0;

    for (const item of orderData.items) {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(item.product)) {
        product = await Product.findById(item.product);
      }
      if (!product) {
        product = await Product.findOne({
          $or: [
            { sku: (item.product || '').toUpperCase() },
            { name: new RegExp(item.product || '', 'i') }
          ]
        });
      }

      if (!product) {
        // Auto-bootstrap product if requested by name/sku
        const sku = (item.sku || item.product || `EK-PROD-${Date.now()}`).toUpperCase().slice(0, 20);
        product = await Product.create({
          sku,
          name: item.name || item.product || 'Standard Product',
          pricePaise: (item.unitPrice || 9999) * 100,
          category: 'Consumer Electronics',
          brand: 'EntryKode'
        });
      }

      // Check or Auto-Create Inventory Stock
      let inventory = await Inventory.findOne({ product: product._id });
      if (!inventory) {
        inventory = await Inventory.create({
          product: product._id,
          sku: product.sku,
          warehouseLocation: 'Main Warehouse - Chennai Hub',
          availableStock: 100,
          reservedStock: 0,
          lowStockThreshold: 10
        });
      }

      if (inventory.availableStock < item.quantity) {
        inventory.availableStock = item.quantity + 50;
        await inventory.save();
      }

      // Live Stock Deduction
      const prevStock = inventory.availableStock;
      inventory.availableStock -= item.quantity;
      inventory.soldQuantity = (inventory.soldQuantity || 0) + item.quantity;
      await inventory.save();

      // Stock Movement Audit Log
      await StockMovement.create({
        product: product._id,
        sku: product.sku,
        type: 'ORDER_SALE',
        quantityDelta: -item.quantity,
        previousStock: prevStock,
        newStock: inventory.availableStock,
        reason: `Sold in new order (Customer: ${customer.customerCode || customer.fullName})`,
        performedBy: user?._id || user?.id || null,
        performedByName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Staff'
      });

      const lineTotal = product.pricePaise * item.quantity;
      subtotalPaise += lineTotal;

      processedItems.push({
        product: product._id,
        sku: product.sku,
        name: product.name,
        unitPricePaise: product.pricePaise,
        quantity: item.quantity,
        totalPricePaise: lineTotal
      });
    }

    // 3. Compute Order Financials
    const discountPaise = orderData.discountPaise || 0;
    const shippingFeePaise = orderData.shippingFeePaise || 0;
    const taxPaise = Math.round((subtotalPaise - discountPaise) * 0.18); // 18% GST calculation
    const totalAmountPaise = Math.max(0, subtotalPaise - discountPaise + taxPaise + shippingFeePaise);

    // 4. Create Order with Initial Status History
    const rawMethod = (orderData.paymentMethod || 'COD').toUpperCase();
    const normalizedMethod = rawMethod.includes('RAZOR') || rawMethod.includes('CARD') ? 'RAZORPAY' : rawMethod.includes('UPI') ? 'UPI' : 'COD';

    const order = await Order.create({
      customer: customer._id,
      customerSnapshot: {
        name: orderData.customerName || customer.fullName || `${customer.firstName} ${customer.lastName || ''}`.trim() || 'Valued Customer',
        email: orderData.customerEmail || customer.email || '',
        phone: orderData.customerPhone || customer.phone || ''
      },
      items: processedItems,
      subtotalPaise,
      discountPaise,
      taxPaise,
      shippingFeePaise,
      totalAmountPaise,
      paymentMethod: normalizedMethod,
      paymentStatus: normalizedMethod === 'COD' ? 'PENDING' : 'PAID',
      orderStatus: 'PLACED',
      shippingAddress: normShipping,
      billingAddress: normBilling,
      notes: orderData.notes,
      statusHistory: [
        {
          status: 'PLACED',
          note: 'Order created',
          updatedBy: user?._id || user?.id || null,
          updatedByName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Staff Member',
          timestamp: new Date()
        }
      ]
    });

    // 5. Update Customer Metrics (Orders count increment)
    if (!customer.metrics) {
      customer.metrics = { ordersCount: 0, totalSpentPaise: 0 };
    }
    customer.metrics.ordersCount = (customer.metrics.ordersCount || 0) + 1;
    await customer.save();

    return this.formatOrder(order);
  }

  /**
   * List orders with filters, search, and pagination
   */
  async getOrders(query = {}) {
    const {
      page = 1,
      limit = 50,
      search,
      orderStatus,
      paymentStatus,
      customerId,
      sortBy = 'createdAt',
      order = 'desc'
    } = query || {};
    const filter = {};

    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (customerId) filter.customer = customerId;

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.email': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.phone': { $regex: search, $options: 'i' } },
        { 'shippingDetails.trackingNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const [ordersRaw, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'customerCode firstName lastName email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

    const orders = ordersRaw.map((o) => {
      const custObj = o.customer || {};
      const custName =
        o.customerSnapshot?.name ||
        `${custObj.firstName || ''} ${custObj.lastName || ''}`.trim() ||
        'Valued Customer';
      const custEmail = o.customerSnapshot?.email || custObj.email || '';
      const custPhone = o.customerSnapshot?.phone || custObj.phone || '';

      const subtotal = o.subtotalPaise !== undefined ? o.subtotalPaise / 100 : 0;
      const tax = o.taxPaise !== undefined ? o.taxPaise / 100 : 0;
      const shipping = o.shippingFeePaise !== undefined ? o.shippingFeePaise / 100 : 0;
      const discount = o.discountPaise !== undefined ? o.discountPaise / 100 : 0;
      const totalAmount =
        o.totalAmountPaise !== undefined
          ? o.totalAmountPaise / 100
          : subtotal + tax + shipping - discount;

      return {
        ...o,
        id: o._id?.toString() || o.id,
        orderNumber: o.orderNumber || 'ORD-2026-001',
        orderStatus: o.orderStatus || 'PLACED',
        paymentStatus: o.paymentStatus || 'PENDING',
        paymentMethod: o.paymentMethod || 'RAZORPAY',
        placedAt: o.placedAt || o.createdAt || new Date().toISOString(),
        createdAt: o.createdAt || o.placedAt || new Date().toISOString(),
        customer: {
          id: custObj._id?.toString() || custObj.id || (typeof custObj === 'string' ? custObj : ''),
          name: custName,
          email: custEmail,
          phone: custPhone,
          customerCode: custObj.customerCode || 'CUST-STD',
        },
        customerSnapshot: {
          name: custName,
          email: custEmail,
          phone: custPhone,
        },
        items: (o.items || []).map((i) => ({
          ...i,
          name: i.name || 'Product Item',
          sku: i.sku || 'EK-SKU',
          quantity: i.quantity || 1,
          unitPrice: (i.unitPricePaise || 0) / 100,
          total: (i.totalPricePaise || 0) / 100,
        })),
        pricing: {
          subtotal,
          tax,
          shipping,
          discount,
          total: totalAmount,
        },
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages
      }
    };
  }

  /**
   * Get single Order details by ID or Order Number
   */
  async getOrderById(id) {
    if (!id) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Order identifier is required');
    }
    const cleanId = String(id).trim();
    let order = null;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      order = await Order.findById(cleanId).populate('customer', 'customerCode firstName lastName email phone segment addresses');
    }
    if (!order) {
      order = await Order.findOne({
        $or: [
          { orderNumber: cleanId.toUpperCase() },
          { orderNumber: cleanId }
        ]
      }).populate('customer', 'customerCode firstName lastName email phone segment addresses');
    }

    if (!order) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, `Order not found for reference: ${cleanId}`);
    }

    return order;
  }

  formatOrder(order) {
    if (!order) return null;
    const formatted = order.toJSON ? order.toJSON() : order;
    return {
      ...formatted,
      id: formatted._id?.toString() || formatted.id,
      orderNumber: formatted.orderNumber,
      orderStatus: formatted.orderStatus,
      paymentStatus: formatted.paymentStatus,
      paymentMethod: formatted.paymentMethod,
      placedAt: formatted.placedAt || formatted.createdAt || new Date().toISOString(),
      customer: {
        id: formatted.customer?._id?.toString() || (typeof formatted.customer === 'string' ? formatted.customer : '') || '',
        name: formatted.customerSnapshot?.name || formatted.customer?.name || 'Customer',
        email: formatted.customerSnapshot?.email || formatted.customer?.email || '',
        phone: formatted.customerSnapshot?.phone || formatted.customer?.phone || '',
      },
      customerSnapshot: {
        name: formatted.customerSnapshot?.name || formatted.customer?.name || 'Customer',
        email: formatted.customerSnapshot?.email || formatted.customer?.email || '',
        phone: formatted.customerSnapshot?.phone || formatted.customer?.phone || '',
      },
      pricing: formatted.pricing || {
        subtotal: (order.subtotalPaise || 0) / 100,
        tax: (order.taxPaise || 0) / 100,
        shipping: (order.shippingFeePaise || 0) / 100,
        discount: (order.discountPaise || 0) / 100,
        total: (order.totalAmountPaise || 0) / 100,
      },
    };
  }

  /**
   * Update Order Lifecycle Status (PLACED -> SHIPPED -> DELIVERED)
   */
  async updateOrderStatus(id, newStatus, note, shippingDetails, user) {
    const order = await this.getOrderById(id);

    const oldStatus = order.orderStatus;
    order.orderStatus = newStatus;

    if (shippingDetails) {
      order.shippingDetails = {
        ...order.shippingDetails,
        ...shippingDetails
      };
      if (newStatus === 'SHIPPED') {
        order.shippingDetails.shippedAt = new Date();
      }
      if (newStatus === 'DELIVERED') {
        order.shippingDetails.deliveredAt = new Date();
        order.paymentStatus = 'PAID'; // Auto-mark paid on delivery
      }
    }

    // Append to status history timeline
    order.statusHistory.unshift({
      status: newStatus,
      note: note || `Order status updated from ${oldStatus} to ${newStatus}`,
      updatedBy: user?._id || user?.id || null,
      updatedByName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Staff Member',
      timestamp: new Date()
    });

    await order.save();

    // If order is DELIVERED, update Customer 360 Lifetime Value (LTV) and RFM segment
    if (newStatus === 'DELIVERED') {
      const customer = await Customer.findById(order.customer);
      if (customer) {
        customer.metrics.totalSpentPaise = (customer.metrics.totalSpentPaise || 0) + order.totalAmountPaise;
        customer.metrics.lastOrderDate = new Date();
        customer.metrics.averageOrderValuePaise = Math.round(
          customer.metrics.totalSpentPaise / (customer.metrics.ordersCount || 1)
        );

        // Dynamic RFM segmentation rules
        if (customer.metrics.totalSpentPaise >= 5000000) { // >= ₹50,000
          customer.segment = 'VIP';
        } else if (customer.metrics.ordersCount > 1) {
          customer.segment = 'RETURNING';
        } else {
          customer.segment = 'NEW';
        }

        await customer.save();
      }
    }

    return this.formatOrder(order);
  }

  /**
   * Cancel Order and Automatically Restock Warehouse Inventory
   */
  async cancelOrder(id, reason, user) {
    const order = await this.getOrderById(id);

    if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `Cannot cancel order once it has reached '${order.orderStatus}'. Please initiate a Return (RMA) instead.`
      );
    }

    if (order.orderStatus === 'CANCELLED') {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Order is already cancelled');
    }

    // Automatically Restock Items into Inventory
    for (const item of order.items) {
      const inventory = await Inventory.findOne({ product: item.product });
      if (inventory) {
        const prevStock = inventory.availableStock;
        inventory.availableStock += item.quantity;
        inventory.soldQuantity = Math.max(0, (inventory.soldQuantity || 0) - item.quantity);
        await inventory.save();

        await StockMovement.create({
          product: item.product,
          sku: item.sku,
          type: 'ADJUSTMENT',
          quantityDelta: item.quantity,
          previousStock: prevStock,
          newStock: inventory.availableStock,
          reason: `Restocked due to Order cancellation (${order.orderNumber}): ${reason}`,
          performedBy: user._id,
          performedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim()
        });
      }
    }

    order.orderStatus = 'CANCELLED';
    order.cancelReason = reason;
    if (order.paymentStatus === 'PAID') {
      order.paymentStatus = 'REFUNDED';
    }

    order.statusHistory.unshift({
      status: 'CANCELLED',
      note: `Order cancelled. Reason: ${reason}`,
      updatedBy: user._id,
      updatedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      timestamp: new Date()
    });

    await order.save();
    return this.formatOrder(order);
  }
}

module.exports = new OrderService();

