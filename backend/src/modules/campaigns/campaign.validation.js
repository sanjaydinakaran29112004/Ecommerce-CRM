const { z } = require('zod');

const SEGMENTS = ['ALL', 'NEW', 'RETURNING', 'VIP', 'AT_RISK', 'INACTIVE'];
const CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP'];

const createCampaignSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Campaign name is required' }).min(2).max(150).trim(),
    subject: z.string().optional(),
    channel: z.string().optional().default('EMAIL'),
    targetSegment: z.string().optional().default('ALL'),
    promoCode: z.string().optional(),
    contentHtml: z.string().optional(),
    scheduledAt: z.coerce.date().optional()
  }).transform((b) => ({
    ...b,
    subject: b.subject || `${b.name} - Special Promotion`,
    channel: (b.channel || 'EMAIL').toUpperCase(),
    targetSegment: ['ALL', 'NEW', 'RETURNING', 'VIP', 'AT_RISK', 'INACTIVE'].includes(String(b.targetSegment).toUpperCase())
      ? String(b.targetSegment).toUpperCase()
      : 'ALL',
    contentHtml: b.contentHtml || `<h2>${b.name}</h2><p>Use promo: ${b.promoCode || 'PROMO'}</p>`
  }))
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

