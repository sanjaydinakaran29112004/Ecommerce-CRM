const { z } = require('zod');

const variantValidation = z.object({
  name: z.string({ required_error: 'Variant name is required' }).trim(),
  sku: z.string().trim().optional(),
  pricePaise: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().min(0).default(0)
});

const createProductSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Product name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(200)
      .trim(),
    sku: z
      .string({ required_error: 'Product SKU is required' })
      .min(3, 'SKU must be at least 3 characters')
      .max(50)
      .toUpperCase()
      .trim(),
    description: z.string().trim().optional(),
    category: z.string({ required_error: 'Category is required' }).trim(),
    brand: z.string().trim().optional(),
    pricePaise: z.coerce
      .number({ required_error: 'Price in paise is required' })
      .min(0, 'Price cannot be negative'),
    compareAtPricePaise: z.coerce.number().min(0).default(0),
    costPricePaise: z.coerce.number().min(0).default(0),
    initialStock: z.coerce.number().min(0).default(0),
    lowStockThreshold: z.coerce.number().min(0).default(10),
    images: z.array(z.string().url().trim()).optional(),
    variants: z.array(variantValidation).optional(),
    tags: z.array(z.string().trim()).optional()
  })
});

const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID')
  }),
  body: z.object({
    name: z.string().min(2).max(200).trim().optional(),
    sku: z.string().min(3).max(50).toUpperCase().trim().optional(),
    description: z.string().trim().optional(),
    category: z.string().trim().optional(),
    brand: z.string().trim().optional(),
    pricePaise: z.coerce.number().min(0).optional(),
    compareAtPricePaise: z.coerce.number().min(0).optional(),
    costPricePaise: z.coerce.number().min(0).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
    images: z.array(z.string().trim()).optional(),
    variants: z.array(variantValidation).optional(),
    tags: z.array(z.string().trim()).optional()
  })
});

const listProductsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    brand: z.string().trim().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('ACTIVE'),
    sortBy: z.string().default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc')
  })
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema
};

