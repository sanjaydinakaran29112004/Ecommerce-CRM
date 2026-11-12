const express = require('express');
const router = express.Router();
const supportController = require('./support.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');
const {
  createTicketSchema,
  updateTicketStatusSchema,
  assignTicketSchema,
  addMessageSchema,
  listTicketsQuerySchema
} = require('./support.validation');

// Authentication Guard
router.use(authenticate);

// Support Dashboard Overview Stats (Place before /:id)
router.get(
  '/stats/overview',
  requirePermissions(PERMISSIONS.TICKETS_READ),
  supportController.getSupportOverviewStats
);

// List Support Tickets
router.get(
  '/',
  requirePermissions(PERMISSIONS.TICKETS_READ),
  validate(listTicketsQuerySchema),
  supportController.getTickets
);

// Create Support Ticket
router.post(
  '/',
  requirePermissions(PERMISSIONS.TICKETS_CREATE),
  validate(createTicketSchema),
  supportController.createTicket
);

// Get Ticket by ID or Ticket Number
router.get(
  '/:id',
  requirePermissions(PERMISSIONS.TICKETS_READ),
  supportController.getTicketById
);

// Update Ticket Status
router.patch(
  '/:id/status',
  requirePermissions(PERMISSIONS.TICKETS_REPLY),
  validate(updateTicketStatusSchema),
  supportController.updateStatus
);

// Assign Ticket
router.patch(
  '/:id/assign',
  requirePermissions(PERMISSIONS.TICKETS_ASSIGN),
  validate(assignTicketSchema),
  supportController.assignTicket
);

// Add Reply or Internal Staff Note
router.post(
  '/:id/messages',
  requirePermissions(PERMISSIONS.TICKETS_REPLY),
  validate(addMessageSchema),
  supportController.addMessage
);

module.exports = router;

