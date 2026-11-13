const mongoose = require('mongoose');
const SupportTicket = require('./support.model');
const Customer = require('../customers/customer.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');

class SupportService {
  /**
   * Create new Customer Support Ticket
   */
  async createTicket(ticketData, user) {
    // 1. Resolve Customer
    let customer = null;
    if (mongoose.Types.ObjectId.isValid(ticketData.customer)) {
      customer = await Customer.findById(ticketData.customer);
    }
    if (!customer) {
      customer = await Customer.findOne({
        $or: [
          { customerCode: (ticketData.customer || '').toUpperCase() },
          { email: (ticketData.customer || '').toLowerCase() },
          { phone: ticketData.customer }
        ]
      });
    }

    if (!customer) {
      const email = ticketData.customerEmail || (ticketData.customer.includes('@') ? ticketData.customer : `cust_${Date.now()}@crm.local`);
      const name = ticketData.customerName || 'Support Inquirer';
      customer = await Customer.create({
        firstName: name.split(' ')[0] || 'Valued',
        lastName: name.split(' ').slice(1).join(' ') || 'Customer',
        email,
        phone: '+91 98401 23456',
        source: 'MANUAL',
        segment: 'NEW'
      });
    }

    // 2. Resolve Optional Order
    let orderId = undefined;
    if (ticketData.order) {
      let order = null;
      if (mongoose.Types.ObjectId.isValid(ticketData.order)) {
        order = await Order.findById(ticketData.order);
      }
      if (!order) {
        order = await Order.findOne({ orderNumber: ticketData.order.toUpperCase() });
      }
      if (order) orderId = order._id;
    }

    const ticket = await SupportTicket.create({
      customer: customer._id,
      customerSnapshot: {
        name: customer.fullName,
        email: customer.email,
        phone: customer.phone
      },
      order: orderId,
      subject: ticketData.subject,
      description: ticketData.description,
      category: ticketData.category,
      priority: ticketData.priority,
      assignedTo: ticketData.assignedTo,
      tags: ticketData.tags || [],
      messages: [
        {
          senderType: 'CUSTOMER',
          senderName: customer.fullName,
          message: ticketData.description,
          isInternalNote: false
        }
      ]
    });

    return ticket;
  }

  /**
   * List Support Tickets with Search, Filters & Dynamic SLA Breached calculations
   */
  async getTickets(query) {
    const { page, limit, search, status, category, priority, assignedTo, isBreached, sortBy, order } = query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) filter.assignedTo = assignedTo;

    if (search) {
      filter.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.email': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Dynamic SLA breach query check
    if (isBreached === true) {
      filter.$or = [
        { 'sla.isBreached': true },
        {
          status: { $nin: ['RESOLVED', 'CLOSED'] },
          'sla.resolutionDue': { $lt: new Date() }
        }
      ];
    }

    const skip = (page - 1) * limit;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('customer', 'customerCode firstName lastName email phone')
        .populate('assignedTo', 'firstName lastName email role')
        .populate('order', 'orderNumber totalAmountPaise orderStatus')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(filter)
    ]);

    // Check & tag realtime breach state
    const now = new Date();
    const enrichedTickets = tickets.map((t) => {
      const isPastDue =
        !['RESOLVED', 'CLOSED'].includes(t.status) &&
        t.sla?.resolutionDue &&
        new Date(t.sla.resolutionDue) < now;

      const custObj = t.customer || {};
      const custName =
        t.customerSnapshot?.name ||
        `${custObj.firstName || ''} ${custObj.lastName || ''}`.trim() ||
        'Customer';
      const custEmail = t.customerSnapshot?.email || custObj.email || '';

      const staffName = t.assignedTo
        ? `${t.assignedTo.firstName || ''} ${t.assignedTo.lastName || ''}`.trim()
        : t.assignee || 'Priya Sundaram';

      return {
        ...t,
        id: t._id?.toString() || t.id,
        customer: {
          id: custObj._id?.toString() || custObj.id,
          name: custName,
          email: custEmail,
        },
        orderNumber: t.order?.orderNumber || t.orderNumber || 'None',
        assignee: staffName,
        messages: t.messages || [],
        sla: {
          ...t.sla,
          isBreached: Boolean(t.sla?.isBreached || isPastDue)
        }
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      tickets: enrichedTickets,
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
   * Get single Support Ticket by ID or Ticket Number with Full Thread
   */
  async getTicketById(id) {
    let ticket = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      ticket = await SupportTicket.findById(id)
        .populate('customer', 'customerCode firstName lastName email phone segment')
        .populate('assignedTo', 'firstName lastName email role')
        .populate('order', 'orderNumber totalAmountPaise orderStatus paymentStatus items');
    }
    if (!ticket) {
      ticket = await SupportTicket.findOne({ ticketNumber: id.toUpperCase() })
        .populate('customer', 'customerCode firstName lastName email phone segment')
        .populate('assignedTo', 'firstName lastName email role')
        .populate('order', 'orderNumber totalAmountPaise orderStatus paymentStatus items');
    }

    if (!ticket) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Support ticket not found');
    }

    return ticket;
  }

  /**
   * Update Support Ticket Lifecycle Status
   */
  async updateStatus(id, newStatus, note, user) {
    const ticket = await this.getTicketById(id);

    const oldStatus = ticket.status;
    ticket.status = newStatus;

    if (newStatus === 'RESOLVED') {
      ticket.sla.resolvedAt = new Date();
    }

    // Add automated internal timeline note
    ticket.messages.push({
      senderType: 'STAFF',
      senderUser: user._id,
      senderName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      message: note || `Status changed from ${oldStatus} to ${newStatus}`,
      isInternalNote: true
    });

    await ticket.save();
    return ticket;
  }

  /**
   * Assign Ticket to a Support Executive
   */
  async assignTicket(id, assignedToUserId, user) {
    const ticket = await this.getTicketById(id);
    const staffUser = await User.findById(assignedToUserId);

    if (!staffUser) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Assigned user does not exist');
    }

    ticket.assignedTo = staffUser._id;
    if (ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }

    ticket.messages.push({
      senderType: 'STAFF',
      senderUser: user._id,
      senderName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      message: `Ticket assigned to ${staffUser.fullName || staffUser.firstName}`,
      isInternalNote: true
    });

    await ticket.save();
    return ticket;
  }

  /**
   * Add Reply or Internal Staff Note to Ticket Conversation Thread
   */
  async addMessage(id, messageData, user) {
    const ticket = await this.getTicketById(id);

    const newMessage = {
      senderType: 'STAFF',
      senderUser: user._id,
      senderName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      message: messageData.message,
      isInternalNote: Boolean(messageData.isInternalNote),
      attachments: messageData.attachments || []
    };

    // First Response SLA Timestamp tracking
    if (!ticket.sla?.firstRespondedAt && !messageData.isInternalNote) {
      ticket.sla.firstRespondedAt = new Date();
    }

    // If reply sent to customer, shift status from WAITING_FOR_CUSTOMER or OPEN
    if (!messageData.isInternalNote && ticket.status === 'WAITING_FOR_CUSTOMER') {
      ticket.status = 'IN_PROGRESS';
    }

    ticket.messages.push(newMessage);
    await ticket.save();

    return newMessage;
  }

  /**
   * Support Performance Overview for Dashboard (SLA breach rates & active tickets)
   */
  async getSupportOverviewStats() {
    const now = new Date();

    const [openCount, inProgressCount, escalatedCount, resolvedCount, breachedCount] =
      await Promise.all([
        SupportTicket.countDocuments({ status: 'OPEN' }),
        SupportTicket.countDocuments({ status: 'IN_PROGRESS' }),
        SupportTicket.countDocuments({ status: 'ESCALATED' }),
        SupportTicket.countDocuments({ status: 'RESOLVED' }),
        SupportTicket.countDocuments({
          status: { $nin: ['RESOLVED', 'CLOSED'] },
          'sla.resolutionDue': { $lt: now }
        })
      ]);

    return {
      open: openCount,
      inProgress: inProgressCount,
      escalated: escalatedCount,
      resolved: resolvedCount,
      slaBreached: breachedCount,
      totalActive: openCount + inProgressCount + escalatedCount
    };
  }
}

module.exports = new SupportService();

