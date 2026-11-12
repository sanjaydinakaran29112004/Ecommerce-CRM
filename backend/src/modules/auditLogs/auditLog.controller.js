const auditLogService = require('./auditLog.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');

class AuditLogController {
  getAuditLogs = asyncHandler(async (req, res) => {
    const result = await auditLogService.getAuditLogs(req.query);
    return ApiResponse.success(
      res,
      STATUS_CODES.OK,
      'Audit logs retrieved successfully',
      { logs: result.logs },
      result.meta
    );
  });
}

module.exports = new AuditLogController();

