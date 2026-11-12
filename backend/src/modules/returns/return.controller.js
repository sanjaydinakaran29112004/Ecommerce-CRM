const returnService = require('./return.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');

class ReturnController {
  /**
   * Create Return Request (RMA)
   * POST /api/v1/returns
   */
  createReturn = asyncHandler(async (req, res) => {
    const returnRecord = await returnService.createReturn(req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Return request initiated', { return: returnRecord });
  });

  /**
   * List Returns
   * GET /api/v1/returns
   */
  getReturns = asyncHandler(async (req, res) => {
    const result = await returnService.getReturns(req.query);
    return ApiResponse.success(
      res,
      STATUS_CODES.OK,
      'Returns retrieved successfully',
      { returns: result.returns },
      result.meta
    );
  });

  /**
   * Get Return by ID or RMA Number
   * GET /api/v1/returns/:id
   */
  getReturnById = asyncHandler(async (req, res) => {
    const returnRecord = await returnService.getReturnById(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Return details retrieved', { return: returnRecord });
  });

  /**
   * Update RMA Status
   * PATCH /api/v1/returns/:id/status
   */
  updateStatus = asyncHandler(async (req, res) => {
    const returnRecord = await returnService.updateStatus(req.params.id, req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Return status updated', { return: returnRecord });
  });

  /**
   * Inspect Returned Items (Quality & Fraud check)
   * POST /api/v1/returns/:id/inspect
   */
  inspectReturn = asyncHandler(async (req, res) => {
    const returnRecord = await returnService.inspectReturn(req.params.id, req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Return inspection recorded', { return: returnRecord });
  });

  /**
   * Process Financial Refund
   * POST /api/v1/returns/:id/process-refund
   */
  processRefund = asyncHandler(async (req, res) => {
    const returnRecord = await returnService.processRefund(req.params.id, req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Refund processed and inventory updated', {
      return: returnRecord
    });
  });

  /**
   * Returns Dashboard Stats
   * GET /api/v1/returns/stats/overview
   */
  getReturnsOverviewStats = asyncHandler(async (req, res) => {
    const stats = await returnService.getReturnsOverviewStats();
    return ApiResponse.success(res, STATUS_CODES.OK, 'Returns dashboard overview', { stats });
  });
}

module.exports = new ReturnController();

