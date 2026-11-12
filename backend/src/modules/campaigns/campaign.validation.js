const { z } = require('zod');

const SEGMENTS = ['ALL', 'NEW', 'RETURNING', 'VIP', 'AT_RISK', 'INACTIVE'];
const CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP'];

const createCampaignSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Campaign name is required' }).min(3).max(150).trim(),
    subject: z.string({ required_error: 'Subject is required' }).min(3).trim(),
    channel: z.enum(CHANNELS).default('EMAIL'),
    targetSegment: z.enum(SEGMENTS).default('ALL'),
    contentHtml: z.string({ required_error: 'Content HTML is required' }).min(5),
    scheduledAt: z.coerce.date().optional()
  })
});

const listCampaignsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'CANCELLED']).optional(),
    targetSegment: z.enum(SEGMENTS).optional(),
    sortBy: z.string().default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc')
  })
});

module.exports = {
  createCampaignSchema,
  listCampaignsQuerySchema
};

