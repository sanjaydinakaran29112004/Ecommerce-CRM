const express = require('express');
const router = express.Router();
const customerController = require('./customer.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');
const {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  addNoteSchema
} = require('./customer.validation');

// All Customer routes require authentication
router.use(authenticate);

// RFM Segment Analytics (Placed before /:id to avoid route shadowing)
router.get(
  '/stats/rfm',
  requirePermissions(PERMISSIONS.CUSTOMERS_READ),
  customerController.getSegmentStats
);

// List Customers (Search, Filter, Pagination)
router.get(
  '/',
  requirePermissions(PERMISSIONS.CUSTOMERS_READ),
  validate(listCustomersQuerySchema),
  customerController.getCustomers
);

// Create Customer
router.post(
  '/',
  requirePermissions(PERMISSIONS.CUSTOMERS_CREATE),
  validate(createCustomerSchema),
  customerController.createCustomer
);

// Get Customer 360 by ID
router.get(
  '/:id',
  requirePermissions(PERMISSIONS.CUSTOMERS_READ),
  customerController.getCustomerById
);

// Update Customer Profile
router.put(
  '/:id',
  requirePermissions(PERMISSIONS.CUSTOMERS_UPDATE),
  validate(updateCustomerSchema),
  customerController.updateCustomer
);

// Archive / Soft Delete Customer
router.delete(
  '/:id',
  requirePermissions(PERMISSIONS.CUSTOMERS_ARCHIVE),
  customerController.archiveCustomer
);

// Add Internal Staff Note
router.post(
  '/:id/notes',
  requirePermissions(PERMISSIONS.CUSTOMERS_UPDATE),
  validate(addNoteSchema),
  customerController.addNote
);

module.exports = router;

