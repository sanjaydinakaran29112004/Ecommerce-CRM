const { z } = require('zod');

const adjustStockSchema = z.object({
  params: z.object({
    productId: z
      .string({ required_error: 'Product identifier is required' })
      .min(3, 'Invalid product ID or SKU')
      .trim()
  }),
  body: z.object({
    quantityDelta: z
      .number({ required_error: 'Stock delta quantity is required' })
      .refine((val) => val !== 0, { message: 'Stock delta cannot be zero' }),
    type: z.enum(['RESTOCK', 'ORDER_SALE', 'ADJUSTMENT', 'RETURN_RESTOCK', 'DAMAGED_WRITE_OFF'], {
      required_error: 'Movement type is required'
    }),
    reason: z
      .string({ required_error: 'Reason for stock adjustment is required' })
      .min(3, 'Reason must be at least 3 characters')
      .trim(),
    referenceId: z.string().trim().optional()
  })
});

const listInventoryQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    isLowStock: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    sortBy: z.string().default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc')
  })
});

module.exports = {
  adjustStockSchema,
  listInventoryQuerySchema
};

