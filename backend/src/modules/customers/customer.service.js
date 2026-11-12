const Customer = require('./customer.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');

class CustomerService {
  /**
   * Create a new customer
   */
  async createCustomer(customerData) {
    // Duplicate check on normalized email and phone
    const existing = await Customer.findOne({
      $or: [{ email: customerData.email }, { phone: customerData.phone }]
    });

    if (existing) {
      if (existing.email === customerData.email) {
        throw new ApiError(STATUS_CODES.CONFLICT, 'A customer with this email address already exists');
      }
      throw new ApiError(STATUS_CODES.CONFLICT, 'A customer with this phone number already exists');
    }

    const customer = await Customer.create(customerData);
    return customer;
  }

  /**
   * List customers with pagination, full-text search, and multi-facet filtering
   */
  async getCustomers(query) {
    const { page, limit, search, segment, status, source, sortBy, order } = query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (segment) {
      filter.segment = segment;
    }

    if (source) {
      filter.source = source;
    }

    // Dynamic search across Name, Email, Phone, and Company
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { customerCode: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .populate('assignedTo', 'firstName lastName email role')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      customers,
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
   * Get single Customer 360 profile by ID
   */
  async getCustomerById(id) {
    const customer = await Customer.findById(id).populate('assignedTo', 'firstName lastName email role');
    if (!customer) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Customer not found');
    }
    return customer;
  }

  /**
   * Update customer profile
   */
  async updateCustomer(id, updateData) {
    // If updating email or phone, check for duplicates with other customers
    if (updateData.email || updateData.phone) {
      const conflictFilter = {
        _id: { $ne: id },
        $or: []
      };
      if (updateData.email) conflictFilter.$or.push({ email: updateData.email });
      if (updateData.phone) conflictFilter.$or.push({ phone: updateData.phone });

      if (conflictFilter.$or.length > 0) {
        const conflict = await Customer.findOne(conflictFilter);
        if (conflict) {
          throw new ApiError(STATUS_CODES.CONFLICT, 'Another customer with this email or phone already exists');
        }
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .populate('assignedTo', 'firstName lastName email role');

    if (!updatedCustomer) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Customer not found');
    }

    return updatedCustomer;
  }

  /**
   * Soft-delete / Archive customer
   */
  async archiveCustomer(id) {
    const customer = await Customer.findByIdAndUpdate(
      id,
      { $set: { status: 'ARCHIVED' } },
      { new: true }
    );
    if (!customer) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Customer not found');
    }
    return customer;
  }

  /**
   * Add internal staff note to Customer 360
   */
  async addNote(customerId, content, user) {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Customer not found');
    }

    const newNote = {
      content,
      author: user._id,
      authorName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim()
    };

    customer.notes.unshift(newNote);
    await customer.save();

    return customer.notes[0];
  }

  /**
   * Customer Segmentation Analytics (RFM Overview for Dashboard)
   */
  async getSegmentStats() {
    const stats = await Customer.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: '$segment',
          count: { $sum: 1 },
          totalRevenuePaise: { $sum: '$metrics.totalSpentPaise' },
          avgOrders: { $sum: '$metrics.ordersCount' }
        }
      }
    ]);

    const formatted = {
      NEW: 0,
      RETURNING: 0,
      VIP: 0,
      AT_RISK: 0,
      INACTIVE: 0,
      totalActiveCustomers: 0
    };

    stats.forEach((item) => {
      if (formatted[item._id] !== undefined) {
        formatted[item._id] = item.count;
      }
      formatted.totalActiveCustomers += item.count;
    });

    return formatted;
  }
}

module.exports = new CustomerService();

