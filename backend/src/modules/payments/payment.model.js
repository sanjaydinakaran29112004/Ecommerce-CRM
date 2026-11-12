const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true // e.g. Razorpay pay_29nd829 or Stripe ch_384729
    },
    // Enterprise Idempotency: Prevents duplicate payments from network retries/webhooks
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    gateway: {
      type: String,
      enum: ['RAZORPAY', 'STRIPE', 'COD', 'BANK_TRANSFER', 'UPI'],
      required: true
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['INITIATED', 'AUTHORIZED', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'INITIATED',
      index: true
    },
    paymentDate: {
      type: Date
    },
    rawGatewayResponse: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

paymentSchema.virtual('amountRupees').get(function () {
  return (this.amountPaise || 0) / 100;
});

module.exports = mongoose.model('Payment', paymentSchema);

