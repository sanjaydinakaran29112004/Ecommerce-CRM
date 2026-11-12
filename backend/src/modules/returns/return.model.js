const mongoose = require('mongoose');

const returnedItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    sku: { type: String, required: true, uppercase: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePaise: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: [
        'DEFECTIVE',
        'WRONG_ITEM',
        'SIZE_FIT_ISSUE',
        'NOT_AS_DESCRIBED',
        'CHANGED_MIND',
        'DAMAGED_IN_TRANSIT',
        'OTHER'
      ],
      required: true
    },
    itemCondition: {
      type: String,
      enum: ['UNOPENED', 'OPENED_EXCELLENT', 'USED_GOOD', 'DEFECTIVE_FACTORY', 'DAMAGED_USER'],
      default: 'OPENED_EXCELLENT'
    },
    evidenceImages: [{ type: String, trim: true }]
  },
  { _id: true }
);

const returnTimelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, trim: true },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedByName: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: true }
);

const returnSchema = new mongoose.Schema(
  {
    rmaNumber: {
      type: String,
      unique: true,
      index: true,
      uppercase: true,
      trim: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    orderNumber: { type: String, required: true, uppercase: true },
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
    items: [returnedItemSchema],
    totalRefundRequestedPaise: { type: Number, required: true, min: 0 },
    // Multi-stage RMA (Return Merchandise Authorization) Lifecycle
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'APPROVED',
        'REJECTED',
        'PICKUP_SCHEDULED',
        'RECEIVED_AT_WAREHOUSE',
        'INSPECTED',
        'REFUNDED'
      ],
      default: 'REQUESTED',
      index: true
    },
    pickupDetails: {
      carrier: { type: String, trim: true },
      trackingNumber: { type: String, trim: true },
      scheduledDate: { type: Date },
      pickedUpDate: { type: Date }
    },
    // Quality & Fraud Inspection Gate (Must pass before refund execution)
    inspection: {
      inspectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      inspectedByName: { type: String },
      inspectedAt: { type: Date },
      passed: { type: Boolean },
      restockApproved: { type: Boolean, default: false },
      notes: { type: String, trim: true }
    },
    // Financial Gateway Refund Execution
    refund: {
      amountPaise: { type: Number, default: 0 },
      gatewayTransactionId: { type: String, trim: true },
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      processedByName: { type: String },
      processedAt: { type: Date },
      status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
      }
    },
    timeline: [returnTimelineSchema],
    rejectionReason: { type: String, trim: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

returnSchema.virtual('totalRefundRequestedRupees').get(function () {
  return (this.totalRefundRequestedPaise || 0) / 100;
});

// Auto-generate RMA Code (e.g. RMA-2611-9481)
returnSchema.pre('save', function (next) {
  if (!this.rmaNumber) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    this.rmaNumber = `RMA-${datePrefix}-${randomDigits}`;
  }
  next();
});

module.exports = mongoose.model('Return', returnSchema);

