const express = require('express');
const router = express.Router();
const auditLogController = require('./auditLog.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');

router.use(authenticate);

router.get(
  '/',
  requirePermissions(PERMISSIONS.AUDIT_READ),
  auditLogController.getAuditLogs
);

module.exports = router;

