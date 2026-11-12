const mongoose = require('mongoose');

// Embedded Line Item Schema (Frozen snapshot at the time of purchase)
const lineItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    sku: { type: String, required: true, uppercase: true },
    name: { type: String, required: true },
    unitPricePaise: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalPricePaise: { type: Number, required: true, min: 0 }
  },
  { _id: true }
);

// Order Status Audit Timeline
const orderStatusHistorySchema = new mongoose.Schema(
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

const orderAddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
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
    items: [lineItemSchema],
    // Pricing stored in integer minor units (paise)
    subtotalPaise: { type: Number, required: true, min: 0 },
    discountPaise: { type: Number, default: 0, min: 0 },
    taxPaise: { type: Number, default: 0, min: 0 },
    shippingFeePaise: { type: Number, default: 0, min: 0 },
    totalAmountPaise: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    // Order Lifecycle States
    orderStatus: {
      type: String,
      enum: [
        'PLACED',
        'CONFIRMED',
        'PROCESSING',
        'PACKED',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RETURNED'
      ],
      default: 'PLACED',
      index: true
    },
    // Payment Lifecycle States
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['RAZORPAY', 'STRIPE', 'COD', 'BANK_TRANSFER', 'UPI'],
      default: 'COD'
    },
    shippingAddress: { type: orderAddressSchema, required: true },
    billingAddress: { type: orderAddressSchema },
    shippingDetails: {
      carrier: { type: String, trim: true },
      trackingNumber: { type: String, trim: true },
      trackingUrl: { type: String, trim: true },
      shippedAt: { type: Date },
      deliveredAt: { type: Date }
    },
    statusHistory: [orderStatusHistorySchema],
    notes: { type: String, trim: true },
    cancelReason: { type: String, trim: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals for Frontend display in Rupees
orderSchema.virtual('totalAmountRupees').get(function () {
  return (this.totalAmountPaise || 0) / 100;
});

orderSchema.virtual('subtotalRupees').get(function () {
  return (this.subtotalPaise || 0) / 100;
});

// Auto-generate Order Number (e.g. ORD-2611-7392)
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    this.orderNumber = `ORD-${datePrefix}-${randomDigits}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

