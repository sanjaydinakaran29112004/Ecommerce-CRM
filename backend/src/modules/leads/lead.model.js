const mongoose = require('mongoose');

// Sub-schema for Lead Follow-up Activities & Interaction History
const leadActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'WHATSAPP'],
      default: 'NOTE'
    },
    summary: { type: String, required: true, trim: true },
    details: { type: String, trim: true },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performedByName: { type: String },
    followUpDate: { type: Date }
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    leadCode: {
      type: String,
      unique: true,
      index: true,
      uppercase: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Lead title or requirement is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    contactName: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
      index: true
    },
    companyName: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      enum: ['WEBSITE', 'EMAIL', 'PHONE', 'TRADE_SHOW', 'REFERRAL', 'CAMPAIGN', 'SOCIAL_MEDIA', 'OTHER'],
      default: 'WEBSITE',
      index: true
    },
    // Kanban Sales Pipeline Stages
    stage: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST'],
      default: 'NEW',
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true
    },
    // Deal Value in minor units (paise)
    estimatedValuePaise: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    nextFollowUpDate: {
      type: Date,
      index: true
    },
    lostReason: {
      type: String,
      trim: true
    },
    // Linked when lead converts into an official Customer
    convertedCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    convertedAt: {
      type: Date
    },
    activities: [leadActivitySchema],
    tags: [{ type: String, trim: true }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for Estimated Value in Rupees
leadSchema.virtual('estimatedValueRupees').get(function () {
  return (this.estimatedValuePaise || 0) / 100;
});

// Auto-generate unique Lead Code (e.g. LEAD-2411-8931)
leadSchema.pre('save', async function (next) {
  if (!this.leadCode) {
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    this.leadCode = `LEAD-${datePrefix}-${randomHex}`;
  }
  next();
});

module.exports = mongoose.model('Lead', leadSchema);

