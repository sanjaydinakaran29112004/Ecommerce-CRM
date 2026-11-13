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
      $or: [{ email: customerData.email?.toLowerCase() }, { phone: customerData.phone }]
    });

    if (existing) {
      if (existing.email?.toLowerCase() === customerData.email?.toLowerCase()) {
        throw new ApiError(STATUS_CODES.CONFLICT, 'A customer with this email address already exists');
      }
      throw new ApiError(STATUS_CODES.CONFLICT, 'A customer with this phone number already exists');
    }

    const payload = {
      ...customerData,
      segment: (customerData.customerType || customerData.segment || 'NEW').toUpperCase()
    };

    const customer = await Customer.create(payload);
    const obj = customer.toObject();
    return {
      ...obj,
      id: customer._id.toString(),
      customerType: customer.segment,
      totalSpent: 0,
      ordersCount: 0
    };
  }

  /**
   * List customers with pagination, full-text search, and multi-facet filtering
   */
  async getCustomers(query) {
    const { page = 1, limit = 50, search, segment, status, source, sortBy = 'createdAt', order = 'desc' } = query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (segment && segment !== 'ALL') {
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

    const [customersRaw, total] = await Promise.all([
      Customer.find(filter)
        .populate('assignedTo', 'firstName lastName email role')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter)
    ]);

    const customers = customersRaw.map((c) => {
      const segmentType = c.segment || c.customerType || 'NEW';
      const spentPaise = c.metrics?.totalSpentPaise ?? (c.totalSpent ? c.totalSpent * 100 : 0);
      const ordersCount = c.metrics?.ordersCount ?? c.ordersCount ?? 0;
      const assignedToName = c.assignedTo
        ? typeof c.assignedTo === 'object'
          ? `${c.assignedTo.firstName || ''} ${c.assignedTo.lastName || ''}`.trim() || c.assignedTo.email
          : c.assignedTo
        : 'Unassigned';

      return {
        ...c,
        id: c._id?.toString() || c.id,
        customerCode: c.customerCode || `CUST-${c._id?.toString().slice(-4)}`,
        customerType: segmentType,
        segment: segmentType,
        totalSpent: spentPaise / 100,
        ordersCount: ordersCount,
        assignedTo: assignedToName,
        assignedUser: c.assignedTo
      };
    });

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
    const customerRaw = await Customer.findById(id).populate('assignedTo', 'firstName lastName email role').lean();
    if (!customerRaw) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Customer not found');
    }

    const segmentType = customerRaw.segment || customerRaw.customerType || 'NEW';
    const spentPaise = customerRaw.metrics?.totalSpentPaise ?? (customerRaw.totalSpent ? customerRaw.totalSpent * 100 : 0);
    const ordersCount = customerRaw.metrics?.ordersCount ?? customerRaw.ordersCount ?? 0;

    return {
      ...customerRaw,
      id: customerRaw._id?.toString() || customerRaw.id,
      customerCode: customerRaw.customerCode || `CUST-${customerRaw._id?.toString().slice(-4)}`,
      customerType: segmentType,
      segment: segmentType,
      totalSpent: spentPaise / 100,
      ordersCount: ordersCount,
      assignedTo: customerRaw.assignedTo
        ? typeof customerRaw.assignedTo === 'object'
          ? `${customerRaw.assignedTo.firstName || ''} ${customerRaw.assignedTo.lastName || ''}`.trim() || customerRaw.assignedTo.email
          : customerRaw.assignedTo
        : 'Unassigned',
      assignedUser: customerRaw.assignedTo
    };
  }

  /**
   * Get all orders associated with this customer
   */
  async getCustomerOrders(customerId) {
    const Order = require('../orders/order.model');
    const customer = await Customer.findById(customerId).lean();
    if (!customer) throw new ApiError(STATUS_CODES.NOT_FOUND, 'Customer not found');

    const orders = await Order.find({
      $or: [{ customer: customerId }, { 'customerSnapshot.email': customer.email }]
    })
      .sort({ createdAt: -1 })
      .lean();

    return orders.map((o) => ({
      ...o,
      id: o._id?.toString() || o.id,
      total: (o.totalAmountPaise || 0) / 100,
      pricing: {
        subtotal: (o.subtotalPaise || 0) / 100,
        tax: (o.taxPaise || 0) / 100,
        shipping: (o.shippingFeePaise || 0) / 100,
        discount: (o.discountPaise || 0) / 100,
        total: (o.totalAmountPaise || 0) / 100
      }
    }));
  }

  /**
   * Get customer activity timeline
   */
  async getCustomerActivities(customerId) {
    const customer = await Customer.findById(customerId).lean();
    if (!customer) throw new ApiError(STATUS_CODES.NOT_FOUND, 'Customer not found');

    const Order = require('../orders/order.model');
    const SupportTicket = require('../support/support.model');

    const [orders, tickets] = await Promise.all([
      Order.find({
        $or: [{ customer: customerId }, { 'customerSnapshot.email': customer.email }]
      }).sort({ createdAt: -1 }).limit(10).lean(),
      SupportTicket.find({
        $or: [{ customer: customerId }, { 'customerSnapshot.email': customer.email }]
      }).sort({ createdAt: -1 }).limit(10).lean()
    ]);

    const activities = [
      {
        id: `reg_${customer._id}`,
        type: 'REGISTRATION',
        title: 'Customer account registered on CRM',
        timestamp: customer.createdAt,
        badge: 'ACTIVE'
      }
    ];

    orders.forEach((o) => {
      activities.push({
        id: `ord_${o._id}`,
        type: 'ORDER',
        title: `Placed Order #${o.orderNumber} - ₹${((o.totalAmountPaise || 0) / 100).toLocaleString('en-IN')}`,
        timestamp: o.createdAt,
        badge: o.orderStatus
      });
    });

    tickets.forEach((t) => {
      activities.push({
        id: `tkt_${t._id}`,
        type: 'TICKET',
        title: `Opened Support Ticket #${t.ticketNumber}: ${t.subject}`,
        timestamp: t.createdAt,
        badge: t.status
      });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return activities;
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

