const Order = require('../orders/order.model');
const Customer = require('../customers/customer.model');
const Product = require('../products/product.model');
const Inventory = require('../inventory/inventory.model');
const SupportTicket = require('../support/support.model');
const Lead = require('../leads/lead.model');

class ReportService {
  /**
   * Executive Master Overview KPIs for Dashboard
   */
  async getExecutiveOverview() {
    const [
      totalRevenueAgg,
      totalOrders,
      totalCustomers,
      openTickets,
      lowStockCount,
      activeLeads
    ] = await Promise.all([
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$totalAmountPaise' } } }
      ]),
      Order.countDocuments(),
      Customer.countDocuments({ status: 'ACTIVE' }),
      SupportTicket.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } }),
      Inventory.countDocuments({ $expr: { $lte: ['$availableStock', '$lowStockThreshold'] } }),
      Lead.countDocuments({ stage: { $nin: ['CONVERTED', 'LOST'] } })
    ]);

    const totalRevenuePaise = totalRevenueAgg[0]?.total || 0;

    return {
      revenue: {
        totalPaise: totalRevenuePaise,
        totalRupees: totalRevenuePaise / 100,
        currency: 'INR'
      },
      orders: {
        totalCount: totalOrders,
        averageOrderValueRupees: totalOrders > 0 ? (totalRevenuePaise / totalOrders / 100).toFixed(2) : 0
      },
      customers: {
        totalActive: totalCustomers
      },
      support: {
        activeTickets: openTickets
      },
      inventory: {
        lowStockAlerts: lowStockCount
      },
      leads: {
        activePipelineDeals: activeLeads
      }
    };
  }

  /**
   * Sales & Revenue Report (Trend aggregation)
   */
  async getSalesReport() {
    const salesTrend = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'CANCELLED' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSalesPaise: { $sum: '$totalAmountPaise' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    const formattedTrend = salesTrend.map((d) => ({
      date: d._id,
      salesRupees: d.totalSalesPaise / 100,
      ordersCount: d.ordersCount
    }));

    return { trend: formattedTrend };
  }

  /**
   * Customer Acquisition & Segmentation Report
   */
  async getCustomersReport() {
    const [segmentStats, sourceStats] = await Promise.all([
      Customer.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: '$segment', count: { $sum: 1 } } }
      ]),
      Customer.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ])
    ]);

    return {
      segments: segmentStats.map((s) => ({ segment: s._id, count: s.count })),
      sources: sourceStats.map((s) => ({ source: s._id, count: s.count }))
    };
  }

  /**
   * Product & Inventory Value Report
   */
  async getInventoryReport() {
    const [totalProducts, inventoryValueAgg] = await Promise.all([
      Product.countDocuments({ status: 'ACTIVE' }),
      Inventory.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productDoc'
          }
        },
        { $unwind: '$productDoc' },
        {
          $group: {
            _id: null,
            totalAvailableUnits: { $sum: '$availableStock' },
            totalReservedUnits: { $sum: '$reservedStock' },
            totalValuationPaise: {
              $sum: { $multiply: ['$availableStock', '$productDoc.pricePaise'] }
            }
          }
        }
      ])
    ]);

    const val = inventoryValueAgg[0] || {
      totalAvailableUnits: 0,
      totalReservedUnits: 0,
      totalValuationPaise: 0
    };

    return {
      totalActiveProducts: totalProducts,
      totalAvailableUnits: val.totalAvailableUnits,
      totalReservedUnits: val.totalReservedUnits,
      inventoryValuationRupees: val.totalValuationPaise / 100
    };
  }
}

module.exports = new ReportService();

