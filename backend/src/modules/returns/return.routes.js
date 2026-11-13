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
  requirePermissions(PERMISSIONS.ORDERS_READ),
  returnController.inspectReturn
);

// Approve Refund (Alias & Direct Gateway Approval)
router.post(
  '/:id/approve',
  requirePermissions(PERMISSIONS.ORDERS_READ),
  async (req, res, next) => {
    try {
      const rec = await returnService.getReturnById(req.params.id);
      rec.status = 'REFUND_APPROVED';
      if (!rec.inspection) rec.inspection = {};
      rec.inspection.passed = true;
      rec.inspection.notes = req.body.notes || req.body.inspectionNotes || 'Approved for refund';
      rec.inspection.inspectedAt = new Date();
      rec.inspection.inspectedByName = req.user.fullName || `${req.user.firstName} ${req.user.lastName || ''}`.trim();
      rec.timeline.unshift({
        status: 'REFUND_APPROVED',
        note: req.body.notes || req.body.inspectionNotes || 'Refund approved via Razorpay gateway',
        updatedBy: req.user._id,
        updatedByName: req.user.fullName || `${req.user.firstName} ${req.user.lastName || ''}`.trim(),
        timestamp: new Date()
      });
      await rec.save();
      const ApiResponse = require('../../utils/apiResponse');
      const STATUS_CODES = require('../../constants/statusCodes');
      return ApiResponse.success(res, STATUS_CODES.OK, 'Refund approved', { return: rec });
    } catch (err) {
      next(err);
    }
  }
);

// Reject Return (Direct rejection)
router.post(
  '/:id/reject',
  requirePermissions(PERMISSIONS.ORDERS_READ),
  async (req, res, next) => {
    try {
      const rec = await returnService.getReturnById(req.params.id);
      rec.status = 'REJECTED';
      rec.rejectionReason = req.body.notes || req.body.inspectionNotes || 'Return request rejected after inspection';
      if (!rec.inspection) rec.inspection = {};
      rec.inspection.passed = false;
      rec.inspection.notes = req.body.notes || req.body.inspectionNotes || 'Customer item rejected';
      rec.timeline.unshift({
        status: 'REJECTED',
        note: req.body.notes || req.body.inspectionNotes || 'Return request rejected',
        updatedBy: req.user._id,
        updatedByName: req.user.fullName || `${req.user.firstName} ${req.user.lastName || ''}`.trim(),
        timestamp: new Date()
      });
      await rec.save();
      const ApiResponse = require('../../utils/apiResponse');
      const STATUS_CODES = require('../../constants/statusCodes');
      return ApiResponse.success(res, STATUS_CODES.OK, 'Return request rejected', { return: rec });
    } catch (err) {
      next(err);
    }
  }
);

// Process Financial Refund (Aliases /refund and /process-refund)
router.post(
  '/:id/refund',
  requirePermissions(PERMISSIONS.ORDERS_READ),
  returnController.processRefund
);

router.post(
  '/:id/process-refund',
  requirePermissions(PERMISSIONS.ORDERS_READ),
  returnController.processRefund
);

module.exports = router;

