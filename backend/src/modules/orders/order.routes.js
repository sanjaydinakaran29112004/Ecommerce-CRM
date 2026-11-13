const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');
const {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  listOrdersQuerySchema
} = require('./order.validation');

// Authentication Guard
router.use(authenticate);

// List Orders
router.get(
  '/',
  requirePermissions(PERMISSIONS.ORDERS_READ),
  validate(listOrdersQuerySchema),
  orderController.getOrders
);

// Create Order (Manual order booking / assisted sales)
router.post(
  '/',
  requirePermissions(PERMISSIONS.ORDERS_CREATE),
  validate(createOrderSchema),
  orderController.createOrder
);

// Get Order Details by ID or Order Number
router.get(
  '/:id',
  requirePermissions(PERMISSIONS.ORDERS_READ),
  orderController.getOrderById
);

// Update Order Lifecycle Status
router.patch(
  '/:id/status',
  requirePermissions(PERMISSIONS.ORDERS_UPDATE_STATUS),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

// Cancel Order
router.post(
  '/:id/cancel',
  requirePermissions(PERMISSIONS.ORDERS_CANCEL),
  validate(cancelOrderSchema),
  orderController.cancelOrder
);

// Payment sync
router.post(
  '/:id/payment',
  require('../../utils/asyncHandler')(async (req, res) => {
    const Order = require('./order.model');
    const mongoose = require('mongoose');
    let order = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: String(req.params.id).toUpperCase() });
    }
    if (order) {
      order.paymentStatus = 'PAID';
      if (order.orderStatus === 'PLACED') {
        order.orderStatus = 'CONFIRMED';
      }
      await order.save();
    }
    const ApiResponse = require('../../utils/apiResponse');
    const STATUS_CODES = require('../../constants/statusCodes');
    return ApiResponse.success(res, STATUS_CODES.OK, 'Payment status updated', { order });
  })
);

// Get Order Payment Details (Blueprint Section 8)
router.get(
  '/:id/payment',
  requirePermissions(PERMISSIONS.PAYMENTS_READ),
  require('../../utils/asyncHandler')(async (req, res) => {
    const Order = require('./order.model');
    const Payment = require('../payments/payment.model');
    const mongoose = require('mongoose');
    let order = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: String(req.params.id).toUpperCase() });
    }
    if (!order) {
      throw new (require('../../utils/apiError'))(404, 'Order not found');
    }
    const payments = await Payment.find({ order: order._id }).sort({ createdAt: -1 });
    const ApiResponse = require('../../utils/apiResponse');
    const STATUS_CODES = require('../../constants/statusCodes');
    return ApiResponse.success(res, STATUS_CODES.OK, 'Order payment details retrieved', {
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmountPaise: order.totalAmountPaise,
      currency: order.currency,
      payments
    });
  })
);

// Get Order Tracking Details (Blueprint Section 8)
router.get(
  '/:id/tracking',
  requirePermissions(PERMISSIONS.ORDERS_READ),
  require('../../utils/asyncHandler')(async (req, res) => {
    const Order = require('./order.model');
    const mongoose = require('mongoose');
    let order = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: String(req.params.id).toUpperCase() });
    }
    if (!order) {
      throw new (require('../../utils/apiError'))(404, 'Order not found');
    }
    const ApiResponse = require('../../utils/apiResponse');
    const STATUS_CODES = require('../../constants/statusCodes');
    return ApiResponse.success(res, STATUS_CODES.OK, 'Order tracking details retrieved', {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      shippingDetails: order.shippingDetails || {},
      statusHistory: order.statusHistory || []
    });
  })
);

module.exports = router;

