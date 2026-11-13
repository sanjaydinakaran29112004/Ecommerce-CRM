const { z } = require('zod');

const addressValidation = z.object({
  type: z.string().optional().default('SHIPPING'),
  isDefault: z.boolean().default(false),
  street: z.string().optional().default('Main Street'),
  addressLine: z.string().optional(),
  city: z.string().optional().default('Chennai'),
  state: z.string().optional().default('Tamil Nadu'),
  postalCode: z.string().optional().default('600001'),
  pincode: z.string().optional(),
  country: z.string().trim().default('India')
}).transform((addr) => {
  const streetStr = addr.street || addr.addressLine || 'Main Street';
  const pinStr = addr.postalCode || addr.pincode || '600001';
  return {
    type: (addr.type || 'SHIPPING').toUpperCase(),
    isDefault: Boolean(addr.isDefault),
    street: streetStr,
    addressLine: streetStr,
    city: addr.city || 'Chennai',
    state: addr.state || 'Tamil Nadu',
    postalCode: pinStr,
    pincode: pinStr,
    country: addr.country || 'India'
  };
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
      .min(7, 'Phone number must be at least 7 digits')
      .trim(),
    companyName: z.string().trim().optional(),
    customerType: z.string().optional(),
    segment: z.string().optional(),
    source: z.string().optional().default('MANUAL'),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
    addresses: z.array(addressValidation).optional(),
    tags: z.array(z.string().trim()).optional()
  }).transform((b) => ({
    ...b,
    segment: (b.customerType || b.segment || 'NEW').toUpperCase(),
    customerType: (b.customerType || b.segment || 'NEW').toUpperCase(),
    source: b.source || 'Website Organic'
  }))
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

