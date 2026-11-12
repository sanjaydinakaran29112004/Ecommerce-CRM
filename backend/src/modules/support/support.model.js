const mongoose = require('mongoose');

// Threaded Message / Reply Schema
const ticketMessageSchema = new mongoose.Schema(
  {
    senderType: {
      type: String,
      enum: ['STAFF', 'CUSTOMER'],
      required: true
    },
    senderUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    senderName: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    // Enterprise feature: Internal notes are hidden from customers and visible only to staff
    isInternalNote: {
      type: Boolean,
      default: false
    },
    attachments: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
      uppercase: true,
      trim: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    customerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true }
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true
    },
    subject: {
      type: String,
      required: [true, 'Ticket subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Ticket issue description is required'],
      trim: true
    },
    category: {
      type: String,
      enum: [
        'ORDER',
        'PAYMENT',
        'DELIVERY',
        'PRODUCT',
        'RETURN',
        'REFUND',
        'ACCOUNT',
        'GENERAL_ENQUIRY'
      ],
      default: 'GENERAL_ENQUIRY',
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'IN_PROGRESS',
        'WAITING_FOR_CUSTOMER',
        'ESCALATED',
        'RESOLVED',
        'CLOSED'
      ],
      default: 'OPEN',
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    // SLA (Service Level Agreement) Tracking Timers
    sla: {
      firstResponseDue: { type: Date, index: true },
      resolutionDue: { type: Date, index: true },
      firstRespondedAt: { type: Date },
      resolvedAt: { type: Date },
      isBreached: { type: Boolean, default: false, index: true }
    },
    messages: [ticketMessageSchema],
    tags: [{ type: String, trim: true }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Auto-generate Ticket Number (e.g. TIK-2611-3849) & SLA Timers
supportTicketSchema.pre('save', function (next) {
  if (!this.ticketNumber) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    this.ticketNumber = `TIK-${datePrefix}-${randomDigits}`;
  }

  // Calculate dynamic SLA targets based on Priority
  if (this.isNew && !this.sla?.firstResponseDue) {
    const now = new Date();
    let responseHours = 24;
    let resolutionHours = 72;

    if (this.priority === 'URGENT') {
      responseHours = 2;
      resolutionHours = 12;
    } else if (this.priority === 'HIGH') {
      responseHours = 6;
      resolutionHours = 24;
    } else if (this.priority === 'MEDIUM') {
      responseHours = 12;
      resolutionHours = 48;
    }

    this.sla = {
      firstResponseDue: new Date(now.getTime() + responseHours * 60 * 60 * 1000),
      resolutionDue: new Date(now.getTime() + resolutionHours * 60 * 60 * 1000),
      isBreached: false
    };
  }

  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

