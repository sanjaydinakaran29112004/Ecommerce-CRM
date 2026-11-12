const mongoose = require('mongoose');

// Embedded Address Schema (Shipping & Billing)
const addressSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['SHIPPING', 'BILLING', 'BOTH'],
      default: 'SHIPPING'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  { _id: true }
);

// Customer 360 Internal Staff Note Schema
const customerNoteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: { type: String }
  },
  { timestamps: true }
);

const customerSchema = new mongoose.Schema(
  {
    customerCode: {
      type: String,
      unique: true,
      index: true,
      uppercase: true,
      trim: true
    },
    firstName: {
      type: String,
      required: [true, 'Customer first name is required'],
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true,
      index: true
    },
    companyName: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      enum: ['WEBSITE', 'SHOPIFY', 'WOOCOMMERCE', 'SOCIAL_MEDIA', 'DIRECT_LEAD', 'REFERRAL', 'MANUAL'],
      default: 'WEBSITE',
      index: true
    },
    // Automated RFM (Recency, Frequency, Monetary) Dynamic Customer Segment
    segment: {
      type: String,
      enum: ['NEW', 'RETURNING', 'VIP', 'AT_RISK', 'INACTIVE'],
      default: 'NEW',
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    addresses: [addressSchema],
    notes: [customerNoteSchema],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    // Aggregated Metrics for Customer 360 (Updated via Order events)
    metrics: {
      totalSpentPaise: { type: Number, default: 0 }, // Monetary in minor unit (paise)
      ordersCount: { type: Number, default: 0 }, // Frequency
      lastOrderDate: { type: Date, default: null }, // Recency
      averageOrderValuePaise: { type: Number, default: 0 }
    },
    tags: [{ type: String, trim: true }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for Full Name
customerSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName || ''}`.trim();
});

// Virtual for Total Spent in Rupees
customerSchema.virtual('metrics.totalSpentRupees').get(function () {
  return (this.metrics?.totalSpentPaise || 0) / 100;
});

// Auto-generate unique Customer Code (e.g. CUST-2411-9382)
customerSchema.pre('save', async function (next) {
  if (!this.customerCode) {
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    this.customerCode = `CUST-${datePrefix}-${randomHex}`;
  }
  next();
});

// PII Data Masking Helper (DPDP / GDPR Compliance)
customerSchema.methods.maskSensitiveData = function () {
  const obj = this.toObject();

  if (obj.email) {
    const [user, domain] = obj.email.split('@');
    const maskedUser = user.length > 2 ? `${user.substring(0, 2)}****` : '****';
    obj.email = `${maskedUser}@${domain}`;
  }

  if (obj.phone) {
    const len = obj.phone.length;
    obj.phone = len > 4 ? `+91 ******${obj.phone.slice(-4)}` : '******';
  }

  return obj;
};

module.exports = mongoose.model('Customer', customerSchema);

