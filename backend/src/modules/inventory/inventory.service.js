const mongoose = require('mongoose');
const Inventory = require('./inventory.model');
const StockMovement = require('./stockMovement.model');
const Product = require('../products/product.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');

class InventoryService {
  /**
   * Get all inventory items with pagination and low-stock filters
   */
  async getInventory(query) {
    const { page, limit, search, isLowStock, sortBy, order } = query;
    const filter = {};

    const skip = (page - 1) * limit;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    if (search) {
      filter.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { warehouseLocation: { $regex: search, $options: 'i' } }
      ];
    }

    if (isLowStock) {
      filter.$expr = { $lte: ['$availableStock', '$lowStockThreshold'] };
    }

    const [inventoryItems, total] = await Promise.all([
      Inventory.find(filter)
        .populate('product', 'name category brand pricePaise images status')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Inventory.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      inventory: inventoryItems,
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
   * Adjust stock level with immutable audit log
   * Accepts either MongoDB ObjectId or SKU (e.g. HEADPHONE-NC-001)
   */
  async adjustStock(identifier, delta, type, reason, referenceId, user) {
    let inventory = null;

    // 1. Try finding by product ObjectId if valid ObjectId string
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      inventory = await Inventory.findOne({
        $or: [{ product: identifier }, { _id: identifier }]
      });
    }

    // 2. If not found or not ObjectId, search by SKU
    if (!inventory) {
      inventory = await Inventory.findOne({
        sku: identifier.toUpperCase().trim()
      });
    }

    if (!inventory) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, `Inventory record for '${identifier}' does not exist`);
    }

    const previousStock = inventory.availableStock;
    const newStock = previousStock + delta;

    if (newStock < 0) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `Cannot reduce stock by ${Math.abs(delta)}. Current available stock is only ${previousStock}.`
      );
    }

    inventory.availableStock = newStock;
    await inventory.save();

    // Create audit ledger entry
    const movement = await StockMovement.create({
      product: inventory.product,
      sku: inventory.sku,
      type,
      quantityDelta: delta,
      previousStock,
      newStock,
      reason,
      referenceId,
      performedBy: user._id,
      performedByName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim()
    });

    return { inventory, movement };
  }

  /**
   * Get Low Stock Alerts for Operational Dashboard
   */
  async getLowStockAlerts() {
    const alerts = await Inventory.find({
      $expr: { $lte: ['$availableStock', '$lowStockThreshold'] }
    })
      .populate('product', 'name sku category pricePaise images')
      .sort({ availableStock: 1 })
      .lean();

    return alerts;
  }

  /**
   * Get Stock Movement Audit History
   */
  async getStockMovements(productId, page = 1, limit = 20) {
    const filter = {};
    if (productId) filter.product = productId;

    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('product', 'name sku')
        .populate('performedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockMovement.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      movements,
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }
}

module.exports = new InventoryService();

