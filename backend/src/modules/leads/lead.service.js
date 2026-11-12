const Lead = require('./lead.model');
const Customer = require('../customers/customer.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');

class LeadService {
  /**
   * Create new lead inquiry
   */
  async createLead(leadData) {
    const lead = await Lead.create(leadData);
    return lead;
  }

  /**
   * Get paginated leads with filters
   */
  async getLeads(query) {
    const { page, limit, search, stage, priority, assignedTo, sortBy, order } = query;
    const filter = {};

    if (stage) filter.stage = stage;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { leadCode: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'firstName lastName email role')
        .populate('convertedCustomerId', 'customerCode firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      leads,
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

  /**
   * Get Kanban Board View (Grouped by Stages with pipeline totals)
   */
  async getKanbanBoard() {
    const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST'];

    const board = {};
    for (const stage of stages) {
      board[stage] = {
        stage,
        count: 0,
        totalValuePaise: 0,
        totalValueRupees: 0,
        leads: []
      };
    }

    const leads = await Lead.find()
      .populate('assignedTo', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .lean();

    leads.forEach((lead) => {
      if (board[lead.stage]) {
        board[lead.stage].count += 1;
        board[lead.stage].totalValuePaise += lead.estimatedValuePaise || 0;
        board[lead.stage].totalValueRupees = board[lead.stage].totalValuePaise / 100;
        board[lead.stage].leads.push(lead);
      }
    });

    return Object.values(board);
  }

  /**
   * Get single lead by ID
   */
  async getLeadById(id) {
    const lead = await Lead.findById(id)
      .populate('assignedTo', 'firstName lastName email role')
      .populate('convertedCustomerId', 'customerCode firstName lastName email phone');

    if (!lead) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Lead not found');
    }

    return lead;
  }

  /**
   * Update lead details
   */
  async updateLead(id, updateData) {
    const lead = await Lead.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .populate('assignedTo', 'firstName lastName email role');

    if (!lead) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Lead not found');
    }

    return lead;
  }

  /**
   * Move lead across Kanban Pipeline Stages
   */
  async updateStage(id, stage, lostReason, user) {
    const lead = await Lead.findById(id);
    if (!lead) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Lead not found');
    }

    const previousStage = lead.stage;
    lead.stage = stage;

    if (stage === 'LOST') {
      lead.lostReason = lostReason;
    } else {
      lead.lostReason = undefined;
    }

    // Automatically record an activity audit entry for stage movement
    lead.activities.unshift({
      type: 'NOTE',
      summary: `Stage updated from ${previousStage} to ${stage}`,
      details: stage === 'LOST' ? `Reason: ${lostReason}` : '',
      performedBy: user._id,
      performedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim()
    });

    await lead.save();
    return lead;
  }

  /**
   * Add interaction activity (Call, Meeting, Email, Note)
   */
  async addActivity(id, activityData, user) {
    const lead = await Lead.findById(id);
    if (!lead) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Lead not found');
    }

    const newActivity = {
      type: activityData.type,
      summary: activityData.summary,
      details: activityData.details,
      performedBy: user._id,
      performedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      followUpDate: activityData.followUpDate
    };

    if (activityData.followUpDate) {
      lead.nextFollowUpDate = activityData.followUpDate;
    }

    lead.activities.unshift(newActivity);
    await lead.save();

    return lead.activities[0];
  }

  /**
   * Convert Lead into an Official Customer
   */
  async convertLead(id, user) {
    const lead = await Lead.findById(id);
    if (!lead) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Lead not found');
    }

    if (lead.stage === 'CONVERTED') {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, 'This lead has already been converted to a customer');
    }

    // Check if customer already exists by phone or email
    let customer = null;
    const existingFilter = [];
    if (lead.phone) existingFilter.push({ phone: lead.phone });
    if (lead.email) existingFilter.push({ email: lead.email });

    if (existingFilter.length > 0) {
      customer = await Customer.findOne({ $or: existingFilter });
    }

    // If customer doesn't exist, create a new Customer profile
    if (!customer) {
      const nameParts = lead.contactName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || undefined;

      customer = await Customer.create({
        firstName,
        lastName,
        email: lead.email || `lead.${lead._id}@placeholder.com`,
        phone: lead.phone,
        companyName: lead.companyName,
        source: 'DIRECT_LEAD',
        assignedTo: lead.assignedTo || user._id,
        tags: lead.tags || []
      });
    }

    // Update lead status
    lead.stage = 'CONVERTED';
    lead.convertedCustomerId = customer._id;
    lead.convertedAt = new Date();

    lead.activities.unshift({
      type: 'NOTE',
      summary: `Lead converted to customer: ${customer.customerCode || customer.fullName}`,
      performedBy: user._id,
      performedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim()
    });

    await lead.save();

    return { lead, customer };
  }
}

module.exports = new LeadService();

