const { z } = require('zod');

const CATEGORIES = [
  'ORDER',
  'PAYMENT',
  'DELIVERY',
  'PRODUCT',
  'RETURN',
  'REFUND',
  'ACCOUNT',
  'GENERAL_ENQUIRY'
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_CUSTOMER',
  'ESCALATED',
  'RESOLVED',
  'CLOSED'
];

const createTicketSchema = z.object({
  body: z.object({
    customer: z.string().optional(),
    customerEmail: z.string().optional(),
    customerName: z.string().optional(),
    order: z.string().trim().optional(),
    orderNumber: z.string().trim().optional(),
    subject: z
      .string({ required_error: 'Subject is required' })
      .min(3, 'Subject must be at least 3 characters')
      .max(200)
      .trim(),
    description: z.string().optional(),
    initialMessage: z.string().optional(),
    category: z.string().optional().default('GENERAL_ENQUIRY'),
    priority: z.string().optional().default('MEDIUM'),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
    tags: z.array(z.string().trim()).optional()
  }).transform((b) => ({
    ...b,
    customer: b.customer || b.customerEmail || b.customerName || 'customer@crm.local',
    description: b.description || b.initialMessage || b.subject,
    category: (b.category || 'GENERAL_ENQUIRY').toUpperCase().replace(' ', '_'),
    priority: (b.priority || 'MEDIUM').toUpperCase()
  }))
});

const updateTicketStatusSchema = z.object({
  params: z.object({
    id: z.string().min(3).trim()
  }),
  body: z.object({
    status: z.enum(STATUSES, { required_error: 'New status is required' }),
    note: z.string().trim().optional()
  })
});

const assignTicketSchema = z.object({
  params: z.object({
    id: z.string().min(3).trim()
  }),
  body: z.object({
    assignedTo: z
      .string({ required_error: 'Assigned user ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')
  })
});

const addMessageSchema = z.object({
  params: z.object({
    id: z.string().min(1).trim()
  }),
  body: z.object({
    message: z.string().optional(),
    text: z.string().optional(),
    isInternalNote: z.boolean().default(false),
    attachments: z.array(z.string().trim()).optional()
  }).transform((b) => ({
    ...b,
    message: b.message || b.text || 'Staff reply'
  }))
});

const listTicketsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    status: z.enum(STATUSES).optional(),
    category: z.enum(CATEGORIES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    assignedTo: z.string().trim().optional(),
    isBreached: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    sortBy: z.string().default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc')
  })
});

module.exports = {
  createTicketSchema,
  updateTicketStatusSchema,
  assignTicketSchema,
  addMessageSchema,
  listTicketsQuerySchema
};

