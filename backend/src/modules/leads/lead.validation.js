const { z } = require('zod');

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const SOURCES = ['WEBSITE', 'EMAIL', 'PHONE', 'TRADE_SHOW', 'REFERRAL', 'CAMPAIGN', 'SOCIAL_MEDIA', 'OTHER'];

const createLeadSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Lead title is required' })
      .min(3, 'Title must be at least 3 characters')
      .max(150)
      .trim(),
    contactName: z
      .string({ required_error: 'Contact name is required' })
      .min(2, 'Contact name must be at least 2 characters')
      .max(100)
      .trim(),
    email: z.string().email('Invalid email address').toLowerCase().trim().optional(),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .min(10, 'Phone must be at least 10 digits')
      .trim(),
    companyName: z.string().trim().optional(),
    source: z.enum(SOURCES).default('WEBSITE'),
    stage: z.enum(STAGES).default('NEW'),
    priority: z.enum(PRIORITIES).default('MEDIUM'),
    estimatedValuePaise: z.coerce.number().min(0).default(0),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
    nextFollowUpDate: z.coerce.date().optional(),
    tags: z.array(z.string().trim()).optional()
  })
});

const updateLeadSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid lead ID')
  }),
  body: z.object({
    title: z.string().min(3).max(150).trim().optional(),
    contactName: z.string().min(2).max(100).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    phone: z.string().min(10).trim().optional(),
    companyName: z.string().trim().optional(),
    source: z.enum(SOURCES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    estimatedValuePaise: z.coerce.number().min(0).optional(),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').nullable().optional(),
    nextFollowUpDate: z.coerce.date().nullable().optional(),
    tags: z.array(z.string().trim()).optional()
  })
});

const updateStageSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid lead ID')
  }),
  body: z
    .object({
      stage: z.enum(STAGES, { required_error: 'Stage is required' }),
      lostReason: z.string().trim().optional()
    })
    .refine(
      (data) => {
        if (data.stage === 'LOST' && (!data.lostReason || data.lostReason.trim().length === 0)) {
          return false;
        }
        return true;
      },
      {
        message: 'A reason is mandatory when marking a lead as LOST',
        path: ['lostReason']
      }
    )
});

const addActivitySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid lead ID')
  }),
  body: z.object({
    type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'WHATSAPP']).default('NOTE'),
    summary: z
      .string({ required_error: 'Activity summary is required' })
      .min(3)
      .max(200)
      .trim(),
    details: z.string().trim().optional(),
    followUpDate: z.coerce.date().optional()
  })
});

const listLeadsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    stage: z.enum(STAGES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    sortBy: z.string().default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc')
  })
});

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  updateStageSchema,
  addActivitySchema,
  listLeadsQuerySchema
};

