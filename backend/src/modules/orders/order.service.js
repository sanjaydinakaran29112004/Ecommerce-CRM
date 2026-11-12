const mongoose = require('mongoose');
const Order = require('./order.model');
const Customer = require('../customers/customer.model');
const Product = require('../products/product.model');
const Inventory = require('../inventory/inventory.model');
const StockMovement = require('../inventory/stockMovement.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');

class OrderService {
  /**
   * Create an Order with automatic inventory stock deduction and audit ledger logging
   */
  async createOrder(orderData, user) {
    // 1. Resolve Customer
    let customer = null;
    if (mongoose.Types.ObjectId.isValid(orderData.customer)) {
      customer = await Customer.findById(orderData.customer);
    }
    if (!customer) {
      customer = await Customer.findOne({
        $or: [
          { customerCode: orderData.customer.toUpperCase() },
          { email: orderData.customer.toLowerCase() },
          { phone: orderData.customer }
        ]
      });
    }

    if (!customer) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, `Customer '${orderData.customer}' does not exist`);
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
        product = await Product.findOne({ sku: item.product.toUpperCase() });
      }

      if (!product) {
        throw new ApiError(STATUS_CODES.NOT_FOUND, `Product '${item.product}' not found`);
      }

      // Check Inventory Stock
      const inventory = await Inventory.findOne({ product: product._id });
      if (!inventory) {
        throw new ApiError(STATUS_CODES.NOT_FOUND, `No inventory record found for product '${product.name}'`);
      }

      if (inventory.availableStock < item.quantity) {
        throw new ApiError(
          STATUS_CODES.BAD_REQUEST,
          `Insufficient stock for '${product.name}' (${product.sku}). Requested: ${item.quantity}, Available: ${inventory.availableStock}`
        );
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
        performedBy: user._id,
        performedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim()
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
    const order = await Order.create({
      customer: customer._id,
      customerSnapshot: {
        name: customer.fullName,
        email: customer.email,
        phone: customer.phone
      },
      items: processedItems,
      subtotalPaise,
      discountPaise,
      taxPaise,
      shippingFeePaise,
      totalAmountPaise,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
      orderStatus: 'PLACED',
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress || orderData.shippingAddress,
      notes: orderData.notes,
      statusHistory: [
        {
          status: 'PLACED',
          note: 'Order created',
          updatedBy: user._id,
          updatedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
          timestamp: new Date()
        }
      ]
    });

    // 5. Update Customer Metrics (Orders count increment)
    customer.metrics.ordersCount = (customer.metrics.ordersCount || 0) + 1;
    await customer.save();

    return order;
  }

  /**
   * List orders with filters, search, and pagination
   */
  async getOrders(query) {
    const { page, limit, search, orderStatus, paymentStatus, customerId, sortBy, order } = query;
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

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'customerCode firstName lastName email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

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
    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).populate('customer', 'customerCode firstName lastName email phone segment addresses');
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id.toUpperCase() }).populate(
        'customer',
        'customerCode firstName lastName email phone segment addresses'
      );
    }

    if (!order) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Order not found');
    }

    return order;
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
      updatedBy: user._id,
      updatedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
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

    return order;
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

    order.statusHistory.unshift({
      status: 'CANCELLED',
      note: `Order cancelled. Reason: ${reason}`,
      updatedBy: user._id,
      updatedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      timestamp: new Date()
    });

    await order.save();
    return order;
  }
}

module.exports = new OrderService();

