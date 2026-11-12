const express = require('express');
const router = express.Router();
const returnController = require('./return.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');
const {
  createReturnSchema,
  updateReturnStatusSchema,
  inspectReturnSchema,
  processRefundSchema,
  listReturnsQuerySchema
} = require('./return.validation');

// Authentication Guard
router.use(authenticate);

// Returns Dashboard Overview Stats (Place before /:id)
router.get(
  '/stats/overview',
  requirePermissions(PERMISSIONS.ORDERS_READ),
  returnController.getReturnsOverviewStats
);

// List Returns
router.get(
  '/',
  requirePermissions(PERMISSIONS.ORDERS_READ),
  validate(listReturnsQuerySchema),
  returnController.getReturns
);

// Initiate Return Request
router.post(
  '/',
  requirePermissions(PERMISSIONS.ORDERS_READ),
  validate(createReturnSchema),
  returnController.createReturn
);

// Get Return by ID or RMA Number
router.get(
  '/:id',
  requirePermissions(PERMISSIONS.ORDERS_READ),
  returnController.getReturnById
);

// Update RMA Status
router.patch(
  '/:id/status',
  requirePermissions(PERMISSIONS.ORDERS_UPDATE_STATUS),
  validate(updateReturnStatusSchema),
  returnController.updateStatus
);

// Quality & Fraud Inspection
router.post(
  '/:id/inspect',
  requirePermissions(PERMISSIONS.INVENTORY_ADJUST),
  validate(inspectReturnSchema),
  returnController.inspectReturn
);

// Process Financial Refund (Strict permission: REFUNDS_APPROVE)
router.post(
  '/:id/process-refund',
  requirePermissions(PERMISSIONS.REFUNDS_APPROVE),
  validate(processRefundSchema),
  returnController.processRefund
);

module.exports = router;

