const { z } = require('zod');

const adjustStockSchema = z.object({
  params: z.object({
    productId: z.string().min(1).trim()
  }),
  body: z.object({
    quantityDelta: z.coerce.number().optional(),
    delta: z.coerce.number().optional(),
    type: z.string().optional().default('ADJUSTMENT'),
    reason: z.string().optional().default('Stock balance adjustment'),
    referenceId: z.string().trim().optional()
  }).transform((b) => ({
    ...b,
    quantityDelta: b.quantityDelta !== undefined ? b.quantityDelta : b.delta !== undefined ? b.delta : 1,
    type: (b.type || 'ADJUSTMENT').toUpperCase(),
    reason: b.reason || 'Stock balance adjustment'
  }))
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

