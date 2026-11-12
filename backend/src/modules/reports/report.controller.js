const reportService = require('./report.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');

class ReportController {
  getOverview = asyncHandler(async (req, res) => {
    const data = await reportService.getExecutiveOverview();
    return ApiResponse.success(res, STATUS_CODES.OK, 'Executive overview KPIs retrieved', data);
  });

  getSales = asyncHandler(async (req, res) => {
    const data = await reportService.getSalesReport();
    return ApiResponse.success(res, STATUS_CODES.OK, 'Sales report retrieved', data);
  });

  getCustomers = asyncHandler(async (req, res) => {
    const data = await reportService.getCustomersReport();
    return ApiResponse.success(res, STATUS_CODES.OK, 'Customers report retrieved', data);
  });

  getInventory = asyncHandler(async (req, res) => {
    const data = await reportService.getInventoryReport();
    return ApiResponse.success(res, STATUS_CODES.OK, 'Inventory report retrieved', data);
  });
}

module.exports = new ReportController();

