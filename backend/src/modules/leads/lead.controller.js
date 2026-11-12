const leadService = require('./lead.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');

class LeadController {
  /**
   * Create Lead
   * POST /api/v1/leads
   */
  createLead = asyncHandler(async (req, res) => {
    const lead = await leadService.createLead(req.body);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Lead created successfully', { lead });
  });

  /**
   * List Leads (Paginated)
   * GET /api/v1/leads
   */
  getLeads = asyncHandler(async (req, res) => {
    const result = await leadService.getLeads(req.query);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Leads retrieved successfully', { leads: result.leads }, result.meta);
  });

  /**
   * Get Kanban Pipeline Board
   * GET /api/v1/leads/kanban
   */
  getKanbanBoard = asyncHandler(async (req, res) => {
    const board = await leadService.getKanbanBoard();
    return ApiResponse.success(res, STATUS_CODES.OK, 'Kanban board retrieved', { board });
  });

  /**
   * Get Lead by ID
   * GET /api/v1/leads/:id
   */
  getLeadById = asyncHandler(async (req, res) => {
    const lead = await leadService.getLeadById(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Lead details retrieved', { lead });
  });

  /**
   * Update Lead details
   * PUT /api/v1/leads/:id
   */
  updateLead = asyncHandler(async (req, res) => {
    const lead = await leadService.updateLead(req.params.id, req.body);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Lead updated successfully', { lead });
  });

  /**
   * Update Lead Pipeline Stage
   * PATCH /api/v1/leads/:id/stage
   */
  updateStage = asyncHandler(async (req, res) => {
    const { stage, lostReason } = req.body;
    const lead = await leadService.updateStage(req.params.id, stage, lostReason, req.user);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Lead stage updated successfully', { lead });
  });

  /**
   * Add Follow-up Activity / Note
   * POST /api/v1/leads/:id/activities
   */
  addActivity = asyncHandler(async (req, res) => {
    const activity = await leadService.addActivity(req.params.id, req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Activity logged successfully', { activity });
  });

  /**
   * Convert Lead to Official Customer
   * POST /api/v1/leads/:id/convert
   */
  convertLead = asyncHandler(async (req, res) => {
    const result = await leadService.convertLead(req.params.id, req.user);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Lead converted to customer successfully', result);
  });
}

module.exports = new LeadController();

