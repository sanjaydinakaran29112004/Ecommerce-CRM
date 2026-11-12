const express = require('express');
const router = express.Router();
const leadController = require('./lead.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');
const {
  createLeadSchema,
  updateLeadSchema,
  updateStageSchema,
  addActivitySchema,
  listLeadsQuerySchema
} = require('./lead.validation');

// Authentication Guard for all lead routes
router.use(authenticate);

// Kanban Board view (Place before /:id)
router.get(
  '/kanban',
  requirePermissions(PERMISSIONS.LEADS_READ),
  leadController.getKanbanBoard
);

// List Leads (Search, Filter, Pagination)
router.get(
  '/',
  requirePermissions(PERMISSIONS.LEADS_READ),
  validate(listLeadsQuerySchema),
  leadController.getLeads
);

// Create Lead
router.post(
  '/',
  requirePermissions(PERMISSIONS.LEADS_CREATE),
  validate(createLeadSchema),
  leadController.createLead
);

// Get Lead by ID
router.get(
  '/:id',
  requirePermissions(PERMISSIONS.LEADS_READ),
  leadController.getLeadById
);

// Update Lead details
router.put(
  '/:id',
  requirePermissions(PERMISSIONS.LEADS_UPDATE),
  validate(updateLeadSchema),
  leadController.updateLead
);

// Update Pipeline Stage (e.g. Move from NEW to QUALIFIED, or mark as LOST)
router.patch(
  '/:id/stage',
  requirePermissions(PERMISSIONS.LEADS_UPDATE),
  validate(updateStageSchema),
  leadController.updateStage
);

// Add Activity / Follow-up Note
router.post(
  '/:id/activities',
  requirePermissions(PERMISSIONS.LEADS_UPDATE),
  validate(addActivitySchema),
  leadController.addActivity
);

// Convert Lead into Official Customer
router.post(
  '/:id/convert',
  requirePermissions(PERMISSIONS.LEADS_CONVERT),
  leadController.convertLead
);

module.exports = router;

