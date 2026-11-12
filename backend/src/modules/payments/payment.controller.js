const Payment = require('./payment.model');
const Order = require('../orders/order.model');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');

class PaymentController {
  /**
   * Record or Verify Payment for an Order (Idempotent)
   * POST /api/v1/payments
   */
  recordPayment = asyncHandler(async (req, res) => {
    const { orderId, transactionId, gateway, amountPaise, idempotencyKey } = req.body;

    // 1. Idempotency Check: Prevent duplicate payment entries
    if (idempotencyKey) {
      const existing = await Payment.findOne({ idempotencyKey });
      if (existing) {
        return ApiResponse.success(res, STATUS_CODES.OK, 'Payment already processed (Idempotent)', {
          payment: existing
        });
      }
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Order not found');
    }

    const payment = await Payment.create({
      order: order._id,
      customer: order.customer,
      transactionId,
      gateway,
      amountPaise: amountPaise || order.totalAmountPaise,
      currency: order.currency || 'INR',
      status: 'SUCCESS',
      idempotencyKey,
      paymentDate: new Date()
    });

    // Update Order Payment Status
    order.paymentStatus = 'PAID';
    await order.save();

    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Payment recorded successfully', { payment });
  });

  /**
   * Get Payments for a specific Order
   * GET /api/v1/payments/order/:orderId
   */
  getPaymentsByOrder = asyncHandler(async (req, res) => {
    const payments = await Payment.find({ order: req.params.orderId }).sort({ createdAt: -1 });
    return ApiResponse.success(res, STATUS_CODES.OK, 'Order payments retrieved', { payments });
  });

  /**
   * List all Payments (Admin audit view)
   * GET /api/v1/payments
   */
  getPayments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, gateway } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (gateway) filter.gateway = gateway;

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('order', 'orderNumber totalAmountPaise paymentMethod')
        .populate('customer', 'customerCode firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payment.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return ApiResponse.success(
      res,
      STATUS_CODES.OK,
      'Payments retrieved successfully',
      { payments },
      { page: Number(page), limit: Number(limit), total, totalPages }
    );
  });
}

module.exports = new PaymentController();

