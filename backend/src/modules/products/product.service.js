const Product = require('./product.model');
const Inventory = require('../inventory/inventory.model');
const StockMovement = require('../inventory/stockMovement.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');

class ProductService {
  /**
   * Create a new product and automatically initialize its inventory record
   */
  async createProduct(productData, user) {
    const existingSku = await Product.findOne({ sku: productData.sku.toUpperCase() });
    if (existingSku) {
      throw new ApiError(STATUS_CODES.CONFLICT, `Product with SKU '${productData.sku}' already exists`);
    }

    const initialStock = productData.initialStock || 0;
    const lowStockThreshold = productData.lowStockThreshold || 10;

    const product = await Product.create(productData);

    // Automatically create Inventory record
    const inventory = await Inventory.create({
      product: product._id,
      sku: product.sku,
      availableStock: initialStock,
      lowStockThreshold
    });

    // Record initial restock audit movement if initial stock was provided
    if (initialStock > 0) {
      await StockMovement.create({
        product: product._id,
        sku: product.sku,
        type: 'RESTOCK',
        quantityDelta: initialStock,
        previousStock: 0,
        newStock: initialStock,
        reason: 'Initial stock intake on product creation',
        performedBy: user?._id || user?.id || null,
        performedByName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Staff'
      });
    }

    return { product, inventory };
  }

  /**
   * List products with search, category filtering & inventory snapshots
   */
  async getProducts(query) {
    const { page, limit, search, category, brand, status, sortBy, order } = query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);

    // Attach inventory snapshot to each product for frontend tables
    const productIds = products.map((p) => p._id);
    const inventories = await Inventory.find({ product: { $in: productIds } }).lean();
    const inventoryMap = new Map(inventories.map((inv) => [inv.product.toString(), inv]));

    const enrichedProducts = products.map((p) => {
      const inv = inventoryMap.get(p._id.toString());
      const stock = inv ? inv.availableStock : p.stock !== undefined ? p.stock : 50;
      const lowThresh = inv ? inv.lowStockThreshold : p.lowStockThreshold !== undefined ? p.lowStockThreshold : 10;
      const reserved = inv ? inv.reservedStock : p.reservedStock || 0;
      const status = stock === 0 ? 'OUT_OF_STOCK' : stock <= lowThresh ? 'LOW_STOCK' : 'ACTIVE';
      const price = p.price !== undefined ? p.price : p.pricePaise ? p.pricePaise / 100 : 9999;
      const image =
        p.image ||
        (p.images && p.images[0]) ||
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300';

      return {
        ...p,
        id: p._id?.toString() || p.id,
        price,
        stock,
        reservedStock: reserved,
        lowStockThreshold: lowThresh,
        status,
        image,
        inventory: inv
          ? {
              availableStock: inv.availableStock,
              reservedStock: inv.reservedStock,
              soldQuantity: inv.soldQuantity,
              lowStockThreshold: inv.lowStockThreshold,
              isLowStock: inv.availableStock <= inv.lowStockThreshold
            }
          : null
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      products: enrichedProducts,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages
      }
    };
  }

  /**
   * Get single product by ID with full inventory details
   */
  async getProductById(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Product not found');
    }

    const inventory = await Inventory.findOne({ product: id });

    return {
      product,
      inventory
    };
  }

  /**
   * Update product catalogue details
   */
  async updateProduct(id, updateData) {
    if (updateData.sku) {
      const conflict = await Product.findOne({
        _id: { $ne: id },
        sku: updateData.sku.toUpperCase()
      });
      if (conflict) {
        throw new ApiError(STATUS_CODES.CONFLICT, `Another product already uses SKU '${updateData.sku}'`);
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Product not found');
    }

    // Sync SKU to inventory if SKU changed
    if (updateData.sku) {
      await Inventory.findOneAndUpdate({ product: id }, { sku: updateData.sku.toUpperCase() });
    }

    return product;
  }

  /**
   * Soft delete / archive product
   */
  async archiveProduct(id) {
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { status: 'ARCHIVED' } },
      { new: true }
    );
    if (!product) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Product not found');
    }
    return product;
  }
}

module.exports = new ProductService();

