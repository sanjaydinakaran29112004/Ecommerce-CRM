const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      index: true
    },
    type: {
      type: String,
      enum: ['RESTOCK', 'ORDER_SALE', 'ADJUSTMENT', 'RETURN_RESTOCK', 'DAMAGED_WRITE_OFF'],
      required: true,
      index: true
    },
    quantityDelta: {
      type: Number,
      required: true // Can be positive (+20) or negative (-5)
    },
    previousStock: {
      type: Number,
      required: true
    },
    newStock: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    referenceId: {
      type: String,
      trim: true // e.g. Order ID, PO Number, or RMA Ticket ID
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performedByName: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('StockMovement', stockMovementSchema);

