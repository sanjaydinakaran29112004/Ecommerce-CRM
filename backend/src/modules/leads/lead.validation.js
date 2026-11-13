const { z } = require('zod');

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const SOURCES = ['WEBSITE', 'EMAIL', 'PHONE', 'TRADE_SHOW', 'REFERRAL', 'CAMPAIGN', 'SOCIAL_MEDIA', 'OTHER'];

const createLeadSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    contactName: z.string().optional(),
    contactPerson: z.string().optional(),
    email: z.string().email('Invalid email address').toLowerCase().trim().optional(),
    phone: z.string().optional().default('+91 98401 23456'),
    companyName: z.string().trim().optional(),
    source: z.string().optional().default('WEBSITE'),
    stage: z.string().optional().default('NEW'),
    priority: z.string().optional().default('MEDIUM'),
    estimatedValue: z.coerce.number().optional(),
    estimatedValuePaise: z.coerce.number().min(0).optional(),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
    nextFollowUpDate: z.coerce.date().optional(),
    tags: z.array(z.string().trim()).optional()
  }).transform((b) => ({
    ...b,
    title: b.title || `${b.companyName || b.contactPerson || 'New Opportunity'} Deal`,
    contactName: b.contactName || b.contactPerson || 'Primary Contact',
    stage: (b.stage || 'NEW').toUpperCase(),
    priority: (b.priority || 'MEDIUM').toUpperCase(),
    source: (b.source || 'WEBSITE').toUpperCase().replace(' ', '_'),
    estimatedValuePaise: b.estimatedValuePaise !== undefined ? b.estimatedValuePaise : Math.round((Number(b.estimatedValue) || 50000) * 100)
  }))
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

