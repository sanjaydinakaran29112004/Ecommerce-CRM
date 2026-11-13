const orderService = require('./order.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');

class OrderController {
  /**
   * Create Manual Order
   * POST /api/v1/orders
   */
  createOrder = asyncHandler(async (req, res) => {
    const order = await orderService.createOrder(req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Order placed successfully', { order });
  });

  /**
   * List Orders
   * GET /api/v1/orders
   */
  getOrders = asyncHandler(async (req, res) => {
    const result = await orderService.getOrders(req.query);
    return ApiResponse.success(
      res,
      STATUS_CODES.OK,
      'Orders retrieved successfully',
      { orders: result.orders },
      result.meta
    );
  });

  /**
   * Get Order by ID or Order Number
   * GET /api/v1/orders/:id
   */
  getOrderById = asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Order details retrieved', {
      order: orderService.formatOrder(order),
    });
  });

  /**
   * Update Order Status
   * PATCH /api/v1/orders/:id/status
   */
  updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderStatus, note, carrier, trackingNumber, trackingUrl } = req.body;
    const shippingDetails = carrier || trackingNumber ? { carrier, trackingNumber, trackingUrl } : null;

    const order = await orderService.updateOrderStatus(
      req.params.id,
      orderStatus,
      note,
      shippingDetails,
      req.user
    );

    return ApiResponse.success(res, STATUS_CODES.OK, 'Order status updated successfully', { order });
  });

  /**
   * Cancel Order
   * POST /api/v1/orders/:id/cancel
   */
  cancelOrder = asyncHandler(async (req, res) => {
    const order = await orderService.cancelOrder(req.params.id, req.body.reason, req.user);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Order cancelled and inventory restocked', { order });
  });
}

module.exports = new OrderController();

