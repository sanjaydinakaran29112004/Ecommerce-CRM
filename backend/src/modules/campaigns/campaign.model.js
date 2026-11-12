const mongoose = require('mongoose');

const campaignRecipientSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    email: { type: String, required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED'],
      default: 'QUEUED'
    },
    sentAt: { type: Date }
  },
  { _id: true }
);

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      maxlength: [150, 'Campaign name cannot exceed 150 characters']
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS', 'WHATSAPP'],
      default: 'EMAIL'
    },
    // Automated Customer 360 RFM Audience Segment Target
    targetSegment: {
      type: String,
      enum: ['ALL', 'NEW', 'RETURNING', 'VIP', 'AT_RISK', 'INACTIVE'],
      default: 'ALL',
      index: true
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'CANCELLED'],
      default: 'DRAFT',
      index: true
    },
    contentHtml: {
      type: String,
      required: [true, 'Campaign email content HTML is required']
    },
    audienceCount: {
      type: Number,
      default: 0
    },
    recipients: [campaignRecipientSchema],
    stats: {
      sentCount: { type: Number, default: 0 },
      deliveredCount: { type: Number, default: 0 },
      openedCount: { type: Number, default: 0 },
      clickedCount: { type: Number, default: 0 },
      attributedRevenuePaise: { type: Number, default: 0 }
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

campaignSchema.virtual('stats.attributedRevenueRupees').get(function () {
  return (this.stats?.attributedRevenuePaise || 0) / 100;
});

module.exports = mongoose.model('Campaign', campaignSchema);

