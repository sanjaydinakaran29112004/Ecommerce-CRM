const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Size M / Black"
    sku: { type: String, uppercase: true, trim: true },
    pricePaise: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 }
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: true
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true
    },
    brand: {
      type: String,
      trim: true,
      index: true
    },
    // Pricing stored in integer minor units (paise) to eliminate floating-point rounding errors
    pricePaise: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    compareAtPricePaise: {
      type: Number,
      min: 0,
      default: 0
    },
    costPricePaise: {
      type: Number,
      min: 0,
      default: 0 // Used for profit margin calculations
    },
    currency: {
      type: String,
      default: 'INR'
    },
    images: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    variants: [variantSchema],
    tags: [{ type: String, trim: true }],
    metadata: {
      weightGrams: { type: Number, default: 0 },
      dimensionsCm: {
        length: Number,
        width: Number,
        height: Number
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals for Frontend display in Rupees
productSchema.virtual('priceRupees').get(function () {
  return (this.pricePaise || 0) / 100;
});

productSchema.virtual('compareAtPriceRupees').get(function () {
  return (this.compareAtPricePaise || 0) / 100;
});

productSchema.virtual('costPriceRupees').get(function () {
  return (this.costPricePaise || 0) / 100;
});

// Auto-generate clean URL slug
productSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);

