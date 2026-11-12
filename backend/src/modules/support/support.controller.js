const supportService = require('./support.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');

class SupportController {
  /**
   * Create Support Ticket
   * POST /api/v1/support
   */
  createTicket = asyncHandler(async (req, res) => {
    const ticket = await supportService.createTicket(req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Support ticket created successfully', { ticket });
  });

  /**
   * List Support Tickets
   * GET /api/v1/support
   */
  getTickets = asyncHandler(async (req, res) => {
    const result = await supportService.getTickets(req.query);
    return ApiResponse.success(
      res,
      STATUS_CODES.OK,
      'Support tickets retrieved successfully',
      { tickets: result.tickets },
      result.meta
    );
  });

  /**
   * Get Support Ticket by ID or Ticket Number
   * GET /api/v1/support/:id
   */
  getTicketById = asyncHandler(async (req, res) => {
    const ticket = await supportService.getTicketById(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Ticket details retrieved', { ticket });
  });

  /**
   * Update Support Ticket Status
   * PATCH /api/v1/support/:id/status
   */
  updateStatus = asyncHandler(async (req, res) => {
    const { status, note } = req.body;
    const ticket = await supportService.updateStatus(req.params.id, status, note, req.user);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Ticket status updated', { ticket });
  });

  /**
   * Assign Ticket to an Executive
   * PATCH /api/v1/support/:id/assign
   */
  assignTicket = asyncHandler(async (req, res) => {
    const { assignedTo } = req.body;
    const ticket = await supportService.assignTicket(req.params.id, assignedTo, req.user);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Ticket assigned successfully', { ticket });
  });

  /**
   * Add Reply Message or Internal Staff Note
   * POST /api/v1/support/:id/messages
   */
  addMessage = asyncHandler(async (req, res) => {
    const message = await supportService.addMessage(req.params.id, req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Message posted to ticket', { message });
  });

  /**
   * Get Support Performance Overview Stats for Dashboard
   * GET /api/v1/support/stats/overview
   */
  getSupportOverviewStats = asyncHandler(async (req, res) => {
    const stats = await supportService.getSupportOverviewStats();
    return ApiResponse.success(res, STATUS_CODES.OK, 'Support dashboard overview', { stats });
  });
}

module.exports = new SupportController();

