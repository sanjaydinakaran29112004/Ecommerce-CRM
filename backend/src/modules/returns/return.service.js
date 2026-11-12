const mongoose = require('mongoose');
const Return = require('./return.model');
const Order = require('../orders/order.model');
const Customer = require('../customers/customer.model');
const Product = require('../products/product.model');
const Inventory = require('../inventory/inventory.model');
const StockMovement = require('../inventory/stockMovement.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');

class ReturnService {
  /**
   * Initiate Return Request (RMA)
   */
  async createReturn(returnData, user) {
    // 1. Resolve Order
    let order = null;
    if (mongoose.Types.ObjectId.isValid(returnData.order)) {
      order = await Order.findById(returnData.order);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: returnData.order.toUpperCase() });
    }

    if (!order) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, `Order '${returnData.order}' not found`);
    }

    if (order.orderStatus !== 'DELIVERED') {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `Cannot initiate return for an order with status '${order.orderStatus}'. Only 'DELIVERED' orders are eligible for return.`
      );
    }

    // 2. Validate Items & Pricing
    const processedItems = [];
    let totalRefundRequestedPaise = 0;

    for (const retItem of returnData.items) {
      // Find matching item in order line items
      const orderItem = order.items.find(
        (i) =>
          i.product.toString() === retItem.product ||
          i.sku.toUpperCase() === retItem.product.toUpperCase()
      );

      if (!orderItem) {
        throw new ApiError(
          STATUS_CODES.BAD_REQUEST,
          `Product '${retItem.product}' was not part of Order ${order.orderNumber}`
        );
      }

      if (retItem.quantity > orderItem.quantity) {
        throw new ApiError(
          STATUS_CODES.BAD_REQUEST,
          `Cannot return ${retItem.quantity} units of '${orderItem.name}'. Only ${orderItem.quantity} were purchased.`
        );
      }

      const itemRefundAmount = orderItem.unitPricePaise * retItem.quantity;
      totalRefundRequestedPaise += itemRefundAmount;

      processedItems.push({
        product: orderItem.product,
        sku: orderItem.sku,
        name: orderItem.name,
        quantity: retItem.quantity,
        pricePaise: orderItem.unitPricePaise,
        reason: retItem.reason,
        itemCondition: retItem.itemCondition || 'OPENED_EXCELLENT',
        evidenceImages: retItem.evidenceImages || []
      });
    }

    // 3. Create Return Record
    const returnRecord = await Return.create({
      order: order._id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      customerSnapshot: order.customerSnapshot,
      items: processedItems,
      totalRefundRequestedPaise,
      status: 'REQUESTED',
      timeline: [
        {
          status: 'REQUESTED',
          note: returnData.note || 'Return RMA requested by customer',
          updatedBy: user._id,
          updatedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
          timestamp: new Date()
        }
      ]
    });

    return returnRecord;
  }

  /**
   * List Returns with Search and Status Filters
   */
  async getReturns(query) {
    const { page, limit, search, status, sortBy, order } = query;
    const filter = {};

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { rmaNumber: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.email': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const [returns, total] = await Promise.all([
      Return.find(filter)
        .populate('customer', 'customerCode firstName lastName email phone')
        .populate('order', 'orderNumber totalAmountPaise paymentMethod')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Return.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      returns,
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
   * Get single Return RMA details by ID or RMA Number
   */
  async getReturnById(id) {
    let returnDoc = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      returnDoc = await Return.findById(id)
        .populate('customer', 'customerCode firstName lastName email phone')
        .populate('order', 'orderNumber totalAmountPaise items shippingAddress')
        .populate('inspection.inspectedBy', 'firstName lastName email role')
        .populate('refund.processedBy', 'firstName lastName email role');
    }
    if (!returnDoc) {
      returnDoc = await Return.findOne({ rmaNumber: id.toUpperCase() })
        .populate('customer', 'customerCode firstName lastName email phone')
        .populate('order', 'orderNumber totalAmountPaise items shippingAddress')
        .populate('inspection.inspectedBy', 'firstName lastName email role')
        .populate('refund.processedBy', 'firstName lastName email role');
    }

    if (!returnDoc) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Return record not found');
    }

    return returnDoc;
  }

  /**
   * Update RMA Lifecycle Status (APPROVED, PICKUP_SCHEDULED, RECEIVED_AT_WAREHOUSE)
   */
  async updateStatus(id, updateData, user) {
    const returnDoc = await this.getReturnById(id);

    const oldStatus = returnDoc.status;
    returnDoc.status = updateData.status;

    if (updateData.status === 'REJECTED') {
      returnDoc.rejectionReason = updateData.rejectionReason;
    }

    if (updateData.carrier || updateData.trackingNumber || updateData.scheduledDate) {
      returnDoc.pickupDetails = {
        ...returnDoc.pickupDetails,
        carrier: updateData.carrier,
        trackingNumber: updateData.trackingNumber,
        scheduledDate: updateData.scheduledDate
      };
    }

    returnDoc.timeline.unshift({
      status: updateData.status,
      note: updateData.note || `RMA status updated from ${oldStatus} to ${updateData.status}`,
      updatedBy: user._id,
      updatedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      timestamp: new Date()
    });

    await returnDoc.save();
    return returnDoc;
  }

  /**
   * Perform Warehouse Quality & Fraud Inspection
   */
  async inspectReturn(id, inspectionData, user) {
    const returnDoc = await this.getReturnById(id);

    returnDoc.status = 'INSPECTED';
    returnDoc.inspection = {
      inspectedBy: user._id,
      inspectedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      inspectedAt: new Date(),
      passed: inspectionData.passed,
      restockApproved: Boolean(inspectionData.restockApproved),
      notes: inspectionData.notes
    };

    returnDoc.timeline.unshift({
      status: 'INSPECTED',
      note: `Quality inspection ${inspectionData.passed ? 'PASSED' : 'FAILED'}. Restock approved: ${inspectionData.restockApproved}`,
      updatedBy: user._id,
      updatedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      timestamp: new Date()
    });

    await returnDoc.save();
    return returnDoc;
  }

  /**
   * Process Gateway Financial Refund & Auto-Restock Warehouse
   */
  async processRefund(id, refundData, user) {
    const returnDoc = await this.getReturnById(id);

    // Enterprise Gate: Never allow refund execution without quality inspection pass!
    if (returnDoc.status !== 'INSPECTED' || !returnDoc.inspection?.passed) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        'Cannot process refund. Return must first be inspected and passed by warehouse staff.'
      );
    }

    if (returnDoc.refund?.status === 'COMPLETED') {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Refund has already been completed for this RMA');
    }

    const refundAmountPaise = refundData.refundAmountPaise || returnDoc.totalRefundRequestedPaise;

    // 1. Restock items to warehouse if inspection restock was approved
    if (returnDoc.inspection.restockApproved) {
      for (const item of returnDoc.items) {
        const inventory = await Inventory.findOne({ product: item.product });
        if (inventory) {
          const prevStock = inventory.availableStock;
          inventory.availableStock += item.quantity;
          inventory.soldQuantity = Math.max(0, (inventory.soldQuantity || 0) - item.quantity);
          await inventory.save();

          await StockMovement.create({
            product: item.product,
            sku: item.sku,
            type: 'RETURN_RESTOCK',
            quantityDelta: item.quantity,
            previousStock: prevStock,
            newStock: inventory.availableStock,
            reason: `Restocked from Return RMA: ${returnDoc.rmaNumber}`,
            performedBy: user._id,
            performedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim()
          });
        }
      }
    }

    // 2. Adjust Customer Lifetime Value (LTV) Metrics
    const customer = await Customer.findById(returnDoc.customer);
    if (customer) {
      customer.metrics.totalSpentPaise = Math.max(
        0,
        (customer.metrics.totalSpentPaise || 0) - refundAmountPaise
      );
      await customer.save();
    }

    // 3. Update Return Record
    returnDoc.status = 'REFUNDED';
    returnDoc.refund = {
      amountPaise: refundAmountPaise,
      gatewayTransactionId: refundData.gatewayTransactionId || `REFUND_${Date.now()}`,
      processedBy: user._id,
      processedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      processedAt: new Date(),
      status: 'COMPLETED'
    };

    returnDoc.timeline.unshift({
      status: 'REFUNDED',
      note: `Refund of ₹${refundAmountPaise / 100} completed. Gateway Ref: ${returnDoc.refund.gatewayTransactionId}`,
      updatedBy: user._id,
      updatedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      timestamp: new Date()
    });

    await returnDoc.save();
    return returnDoc;
  }

  /**
   * Return RMA Dashboard Analytics
   */
  async getReturnsOverviewStats() {
    const [requested, approved, inspected, refunded, rejected] = await Promise.all([
      Return.countDocuments({ status: 'REQUESTED' }),
      Return.countDocuments({ status: 'APPROVED' }),
      Return.countDocuments({ status: 'INSPECTED' }),
      Return.countDocuments({ status: 'REFUNDED' }),
      Return.countDocuments({ status: 'REJECTED' })
    ]);

    return {
      requested,
      approved,
      inspected,
      refunded,
      rejected,
      totalPendingAction: requested + approved + inspected
    };
  }
}

module.exports = new ReturnService();

