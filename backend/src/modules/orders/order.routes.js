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

module.exports = router;

