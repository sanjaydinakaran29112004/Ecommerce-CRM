const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');

router.use(authenticate);

router.get('/metrics', reportController.getOverview);
router.get('/overview', requirePermissions(PERMISSIONS.REPORTS_READ), reportController.getOverview);
router.get('/sales', requirePermissions(PERMISSIONS.REPORTS_READ), reportController.getSales);
router.get('/customers', requirePermissions(PERMISSIONS.REPORTS_READ), reportController.getCustomers);
router.get('/inventory', requirePermissions(PERMISSIONS.REPORTS_READ), reportController.getInventory);

module.exports = router;

