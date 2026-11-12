const { z } = require('zod');

const RETURN_REASONS = [
  'DEFECTIVE',
  'WRONG_ITEM',
  'SIZE_FIT_ISSUE',
  'NOT_AS_DESCRIBED',
  'CHANGED_MIND',
  'DAMAGED_IN_TRANSIT',
  'OTHER'
];

const ITEM_CONDITIONS = ['UNOPENED', 'OPENED_EXCELLENT', 'USED_GOOD', 'DEFECTIVE_FACTORY', 'DAMAGED_USER'];

const RETURN_STATUSES = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'PICKUP_SCHEDULED',
  'RECEIVED_AT_WAREHOUSE',
  'INSPECTED',
  'REFUNDED'
];

const returnedItemValidation = z.object({
  product: z
    .string({ required_error: 'Product identifier (ID or SKU) is required' })
    .min(3)
    .trim(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  reason: z.enum(RETURN_REASONS, { required_error: 'Return reason is required' }),
  itemCondition: z.enum(ITEM_CONDITIONS).default('OPENED_EXCELLENT'),
  evidenceImages: z.array(z.string().trim()).optional()
});

const createReturnSchema = z.object({
  body: z.object({
    order: z
      .string({ required_error: 'Order ID or Order Number is required' })
      .min(3)
      .trim(),
    items: z.array(returnedItemValidation).min(1, 'Return must contain at least one item'),
    note: z.string().trim().optional()
  })
});

const updateReturnStatusSchema = z.object({
  params: z.object({
    id: z.string().min(3).trim()
  }),
  body: z
    .object({
      status: z.enum(RETURN_STATUSES, { required_error: 'New status is required' }),
      note: z.string().trim().optional(),
      carrier: z.string().trim().optional(),
      trackingNumber: z.string().trim().optional(),
      scheduledDate: z.coerce.date().optional(),
      rejectionReason: z.string().trim().optional()
    })
    .refine(
      (data) => {
        if (data.status === 'REJECTED' && (!data.rejectionReason || data.rejectionReason.trim().length === 0)) {
          return false;
        }
        return true;
      },
      {
        message: 'Rejection reason is required when rejecting a return request',
        path: ['rejectionReason']
      }
    )
});

const inspectReturnSchema = z.object({
  params: z.object({
    id: z.string().min(3).trim()
  }),
  body: z.object({
    passed: z.boolean({ required_error: 'Inspection pass/fail flag is required' }),
    restockApproved: z.boolean().default(false),
    notes: z
      .string({ required_error: 'Inspection notes are required' })
      .min(3, 'Inspection notes must be at least 3 characters')
      .trim()
  })
});

const processRefundSchema = z.object({
  params: z.object({
    id: z.string().min(3).trim()
  }),
  body: z.object({
    refundAmountPaise: z.coerce.number().min(0).optional(),
    gatewayTransactionId: z.string().trim().optional()
  })
});

const listReturnsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    status: z.enum(RETURN_STATUSES).optional(),
    sortBy: z.string().default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc')
  })
});

module.exports = {
  createReturnSchema,
  updateReturnStatusSchema,
  inspectReturnSchema,
  processRefundSchema,
  listReturnsQuerySchema
};

