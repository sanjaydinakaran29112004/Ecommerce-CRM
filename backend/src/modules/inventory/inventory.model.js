const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
      index: true
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    availableStock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Available stock cannot be negative']
    },
    // Stock locked when an order is placed but not yet shipped/packed
    reservedStock: {
      type: Number,
      default: 0,
      min: 0
    },
    soldQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0
    },
    warehouseLocation: {
      type: String,
      trim: true,
      default: 'Main Warehouse'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: Check if stock is low or out
inventorySchema.virtual('isLowStock').get(function () {
  return this.availableStock <= this.lowStockThreshold;
});

inventorySchema.virtual('isOutOfStock').get(function () {
  return this.availableStock === 0;
});

inventorySchema.virtual('totalStock').get(function () {
  return (this.availableStock || 0) + (this.reservedStock || 0);
});

module.exports = mongoose.model('Inventory', inventorySchema);

