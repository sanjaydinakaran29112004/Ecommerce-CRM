const { z } = require('zod');

const addressValidation = z.object({
  type: z.enum(['SHIPPING', 'BILLING', 'BOTH']).default('SHIPPING'),
  isDefault: z.boolean().default(false),
  street: z.string({ required_error: 'Street is required' }).min(3).trim(),
  city: z.string({ required_error: 'City is required' }).trim(),
  state: z.string({ required_error: 'State is required' }).trim(),
  postalCode: z.string({ required_error: 'Postal code is required' }).trim(),
  country: z.string().trim().default('India')
});

const createCustomerSchema = z.object({
  body: z.object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .min(2, 'First name must be at least 2 characters')
      .max(50)
      .trim(),
    lastName: z.string().max(50).trim().optional(),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email')
      .toLowerCase()
      .trim(),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .min(10, 'Phone number must be at least 10 digits')
      .trim(),
    companyName: z.string().trim().optional(),
    source: z
      .enum(['WEBSITE', 'SHOPIFY', 'WOOCOMMERCE', 'SOCIAL_MEDIA', 'DIRECT_LEAD', 'REFERRAL', 'MANUAL'])
      .default('MANUAL'),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
    addresses: z.array(addressValidation).optional(),
    tags: z.array(z.string().trim()).optional()
  })
});

const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID')
  }),
  body: z.object({
    firstName: z.string().min(2).max(50).trim().optional(),
    lastName: z.string().max(50).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    phone: z.string().min(10).trim().optional(),
    companyName: z.string().trim().optional(),
    source: z
      .enum(['WEBSITE', 'SHOPIFY', 'WOOCOMMERCE', 'SOCIAL_MEDIA', 'DIRECT_LEAD', 'REFERRAL', 'MANUAL'])
      .optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').nullable().optional(),
    addresses: z.array(addressValidation).optional(),
    tags: z.array(z.string().trim()).optional()
  })
});

const listCustomersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    segment: z.enum(['NEW', 'RETURNING', 'VIP', 'AT_RISK', 'INACTIVE']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
    source: z.string().trim().optional(),
    sortBy: z.string().default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc')
  })
});

const addNoteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID')
  }),
  body: z.object({
    content: z
      .string({ required_error: 'Note content is required' })
      .min(3, 'Note must be at least 3 characters long')
      .max(1000, 'Note cannot exceed 1000 characters')
      .trim()
  })
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  addNoteSchema
};

