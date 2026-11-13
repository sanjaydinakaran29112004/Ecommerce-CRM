const { z } = require('zod');

const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED'
];

const PAYMENT_STATUSES = ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED'];
const PAYMENT_METHODS = ['RAZORPAY', 'STRIPE', 'COD', 'BANK_TRANSFER', 'UPI'];

const addressValidation = z.union([
  z.string().transform((str) => ({
    street: str.trim() || 'Main Street',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600001',
    country: 'India'
  })),
  z.object({
    street: z.string().default('Main Street'),
    city: z.string().default('Chennai'),
    state: z.string().default('Tamil Nadu'),
    postalCode: z.string().default('600001'),
    country: z.string().default('India')
  })
]);

const orderItemValidation = z.object({
  product: z
    .string({ required_error: 'Product identifier (ID or SKU) is required' })
    .min(1)
    .trim(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1')
});

const createOrderSchema = z.object({
  body: z.object({
    customer: z.string().optional(),
    customerName: z.string().optional(),
    customerEmail: z.string().optional(),
    customerPhone: z.string().optional(),
    items: z.array(orderItemValidation).min(1, 'Order must contain at least one product item'),
    shippingAddress: addressValidation.optional().default('Main Street, Chennai, Tamil Nadu 600001'),
    billingAddress: addressValidation.optional(),
    paymentMethod: z.string().optional().default('COD'),
    discountPaise: z.coerce.number().min(0).default(0),
    shippingFeePaise: z.coerce.number().min(0).default(0),
    notes: z.string().trim().optional()
  })
});

const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(3).trim()
  }),
  body: z.object({
    orderStatus: z.enum(ORDER_STATUSES, { required_error: 'New order status is required' }),
    note: z.string().trim().optional(),
    carrier: z.string().trim().optional(),
    trackingNumber: z.string().trim().optional(),
    trackingUrl: z.string().trim().optional()
  })
});

const cancelOrderSchema = z.object({
  params: z.object({
    id: z.string().min(3).trim()
  }),
  body: z.object({
    reason: z
      .string({ required_error: 'Cancellation reason is mandatory' })
      .min(3, 'Reason must be at least 3 characters')
      .trim()
  })
});

const listOrdersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    orderStatus: z.enum(ORDER_STATUSES).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
    customerId: z.string().trim().optional(),
    sortBy: z.string().default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc')
  })
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  listOrdersQuerySchema
};

