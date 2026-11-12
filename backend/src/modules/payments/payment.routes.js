const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');

router.use(authenticate);

// List Payments
router.get(
  '/',
  requirePermissions(PERMISSIONS.PAYMENTS_READ),
  paymentController.getPayments
);

// Get Payments by Order
router.get(
  '/order/:orderId',
  requirePermissions(PERMISSIONS.PAYMENTS_READ),
  paymentController.getPaymentsByOrder
);

// Record Payment
router.post(
  '/',
  requirePermissions(PERMISSIONS.PAYMENTS_READ),
  paymentController.recordPayment
);

module.exports = router;

