const Campaign = require('./campaign.model');
const Customer = require('../customers/customer.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');

class CampaignService {
  async createCampaign(campaignData, user) {
    // 1. Calculate matching audience size initially
    const filter = { status: 'ACTIVE' };
    if (campaignData.targetSegment && campaignData.targetSegment !== 'ALL') {
      filter.segment = campaignData.targetSegment;
    }

    const matchingCount = await Customer.countDocuments(filter);

    const campaign = await Campaign.create({
      ...campaignData,
      audienceCount: matchingCount,
      createdBy: user._id
    });

    return campaign;
  }

  async getCampaigns(query) {
    const { page, limit, search, status, targetSegment, sortBy, order } = query;
    const filter = {};

    if (status) filter.status = status;
    if (targetSegment) filter.targetSegment = targetSegment;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      campaigns,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages
      }
    };
  }

  async getCampaignById(id) {
    const campaign = await Campaign.findById(id).populate('createdBy', 'firstName lastName email');
    if (!campaign) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Campaign not found');
    }
    return campaign;
  }

  /**
   * Build & Populate Audience from Live Customer 360 RFM Segments
   */
  async buildAudience(id) {
    const campaign = await this.getCampaignById(id);

    const filter = { status: 'ACTIVE' };
    if (campaign.targetSegment !== 'ALL') {
      filter.segment = campaign.targetSegment;
    }

    const customers = await Customer.find(filter, '_id email firstName lastName');

    campaign.recipients = customers.map((c) => ({
      customer: c._id,
      email: c.email,
      name: c.fullName || `${c.firstName} ${c.lastName || ''}`.trim(),
      status: 'QUEUED'
    }));

    campaign.audienceCount = customers.length;
    await campaign.save();

    return {
      campaignId: campaign._id,
      targetSegment: campaign.targetSegment,
      audienceCount: campaign.audienceCount
    };
  }

  /**
   * Send / Dispatch Campaign to Audience
   */
  async sendCampaign(id) {
    const campaign = await this.getCampaignById(id);

    if (campaign.recipients.length === 0) {
      await this.buildAudience(id);
    }

    campaign.status = 'COMPLETED';
    campaign.sentAt = new Date();

    const recipientCount = campaign.recipients.length;
    campaign.recipients.forEach((r) => {
      r.status = 'DELIVERED';
      r.sentAt = new Date();
    });

    campaign.stats = {
      sentCount: recipientCount,
      deliveredCount: recipientCount,
      openedCount: Math.round(recipientCount * 0.42), // 42% simulated engagement
      clickedCount: Math.round(recipientCount * 0.18),
      attributedRevenuePaise: 0
    };

    await campaign.save();
    return campaign;
  }
}

module.exports = new CampaignService();

