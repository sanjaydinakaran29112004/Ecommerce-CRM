const inventoryService = require('./inventory.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');

class InventoryController {
  /**
   * Get Inventory overview
   * GET /api/v1/inventory
   */
  getInventory = asyncHandler(async (req, res) => {
    const result = await inventoryService.getInventory(req.query);
    return ApiResponse.success(
      res,
      STATUS_CODES.OK,
      'Inventory overview retrieved',
      { inventory: result.inventory },
      result.meta
    );
  });

  /**
   * Adjust Product Stock Level
   * PATCH /api/v1/inventory/:productId/adjust
   */
  adjustStock = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantityDelta, type, reason, referenceId } = req.body;

    const result = await inventoryService.adjustStock(
      productId,
      quantityDelta,
      type,
      reason,
      referenceId,
      req.user
    );

    return ApiResponse.success(res, STATUS_CODES.OK, 'Stock adjusted successfully', result);
  });

  /**
   * Get Low Stock Dashboard Alerts
   * GET /api/v1/inventory/low-stock
   */
  getLowStockAlerts = asyncHandler(async (req, res) => {
    const alerts = await inventoryService.getLowStockAlerts();
    return ApiResponse.success(res, STATUS_CODES.OK, 'Low stock alerts retrieved', { alerts });
  });

  /**
   * Get Stock Movements Audit History
   * GET /api/v1/inventory/movements
   */
  getStockMovements = asyncHandler(async (req, res) => {
    const { productId, page, limit } = req.query;
    const result = await inventoryService.getStockMovements(productId, page, limit);
    return ApiResponse.success(
      res,
      STATUS_CODES.OK,
      'Stock movements retrieved',
      { movements: result.movements },
      result.meta
    );
  });
}

module.exports = new InventoryController();

