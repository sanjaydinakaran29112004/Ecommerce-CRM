const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');
const { adjustStockSchema, listInventoryQuerySchema } = require('./inventory.validation');

// Authentication Guard
router.use(authenticate);

// Low Stock Alerts (For Dashboard Widgets)
router.get(
  '/low-stock',
  requirePermissions(PERMISSIONS.INVENTORY_READ),
  inventoryController.getLowStockAlerts
);

// Stock Movement Audit Ledger
router.get(
  '/movements',
  requirePermissions(PERMISSIONS.INVENTORY_READ),
  inventoryController.getStockMovements
);

// List Inventory Status
router.get(
  '/',
  requirePermissions(PERMISSIONS.INVENTORY_READ),
  validate(listInventoryQuerySchema),
  inventoryController.getInventory
);

// Adjust Stock (Intake / Loss / Audit Adjustments)
router.patch(
  '/:productId/adjust',
  requirePermissions(PERMISSIONS.INVENTORY_ADJUST),
  validate(adjustStockSchema),
  inventoryController.adjustStock
);

module.exports = router;

