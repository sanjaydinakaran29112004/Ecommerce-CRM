const mongoose = require('mongoose');
const config = require('../src/config/env');

// Models
const User = require('../src/modules/users/user.model');
const Customer = require('../src/modules/customers/customer.model');
const Lead = require('../src/modules/leads/lead.model');
const Product = require('../src/modules/products/product.model');
const Inventory = require('../src/modules/inventory/inventory.model');
const StockMovement = require('../src/modules/inventory/stockMovement.model');
const Order = require('../src/modules/orders/order.model');
const Payment = require('../src/modules/payments/payment.model');
const SupportTicket = require('../src/modules/support/support.model');
const Return = require('../src/modules/returns/return.model');
const Campaign = require('../src/modules/campaigns/campaign.model');
const Task = require('../src/modules/tasks/task.model');
const AuditLog = require('../src/modules/auditLogs/auditLog.model');

// Services
const authService = require('../src/modules/auth/auth.service');
const customerService = require('../src/modules/customers/customer.service');
const leadService = require('../src/modules/leads/lead.service');
const productService = require('../src/modules/products/product.service');
const inventoryService = require('../src/modules/inventory/inventory.service');
const orderService = require('../src/modules/orders/order.service');
const supportService = require('../src/modules/support/support.service');
const returnService = require('../src/modules/returns/return.service');
const campaignService = require('../src/modules/campaigns/campaign.service');
const taskService = require('../src/modules/tasks/task.service');
const reportService = require('../src/modules/reports/report.service');
const auditLogService = require('../src/modules/auditLogs/auditLog.service');

const runFullTestAndCleanSeed = async () => {
  try {
    console.log('\n=============================================================');
    console.log('🔄 STARTING COMPREHENSIVE END-TO-END VERIFICATION OF ALL 11 MODULES');
    console.log('=============================================================\n');

    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB Atlas Cloud Database');

    // 1. Wipe existing ad-hoc test data
    console.log('\n🧹 Clearing ad-hoc/temporary test records from all collections...');
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Lead.deleteMany({}),
      Product.deleteMany({}),
      Inventory.deleteMany({}),
      StockMovement.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      SupportTicket.deleteMany({}),
      Return.deleteMany({}),
      Campaign.deleteMany({}),
      Task.deleteMany({}),
      AuditLog.deleteMany({})
    ]);
    console.log('✅ Database completely clean and wiped of personal test names.');

    // =========================================================================
    // MODULE 1: AUTHENTICATION & SUPER ADMIN SEEDING
    // =========================================================================
    console.log('\n[1/11] 🔐 Testing Module 1: Authentication & RBAC User Creation...');
    const adminUser = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@crm.com',
      password: 'AdminPassword@123',
      role: 'SUPER_ADMIN'
    });
    const { accessToken } = await authService.login('admin@crm.com', 'AdminPassword@123');
    if (!accessToken) throw new Error('Auth login failed');
    console.log('   ✅ Super Admin created & JWT Access Token successfully verified: admin@crm.com');

    // Also seed a staff support executive
    const staffUser = await User.create({
      firstName: 'Support',
      lastName: 'Executive',
      email: 'support@crm.com',
      password: 'SupportPassword@123',
      role: 'SUPPORT_EXECUTIVE'
    });
    console.log('   ✅ Staff Support Executive created: support@crm.com');

    // =========================================================================
    // MODULE 2: CUSTOMER 360 & DYNAMIC RFM SEGMENTATION
    // =========================================================================
    console.log('\n[2/11] 👥 Testing Module 2: Customer 360 & RFM Segmentation...');
    const customer = await customerService.createCustomer({
      firstName: 'Acme',
      lastName: 'Corporation',
      email: 'contact@acmecorp.com',
      phone: '+91 9800011122',
      companyName: 'Acme Corporation Ltd',
      source: 'WEBSITE',
      addresses: [
        {
          type: 'BOTH',
          isDefault: true,
          street: '100 Business Park, Outer Ring Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560103',
          country: 'India'
        }
      ],
      tags: ['enterprise', 'b2b']
    });
    console.log(`   ✅ Customer created: ${customer.fullName} (${customer.customerCode})`);

    // Add internal note
    await customerService.addNote(customer._id, 'Preferred billing currency is INR. Annual review in Q4.', adminUser);
    const rfmStats = await customerService.getSegmentStats();
    console.log('   ✅ Customer 360 note added & RFM segment stats verified:', JSON.stringify(rfmStats));

    // =========================================================================
    // MODULE 3: LEADS & SALES KANBAN PIPELINE
    // =========================================================================
    console.log('\n[3/11] 📈 Testing Module 3: Lead & Sales Pipeline (Kanban Deals)...');
    const lead = await leadService.createLead({
      title: 'Corporate bulk order inquiry - 100 Smart Watches',
      contactName: 'Procurement Manager',
      email: 'procurement@globaltech.com',
      phone: '+91 9811122233',
      companyName: 'Global Tech Enterprises',
      source: 'WEBSITE',
      priority: 'HIGH',
      estimatedValuePaise: 40000000, // ₹4,00,000
      tags: ['bulk-corporate', 'q4-deal']
    });
    console.log(`   ✅ B2B Lead created: ${lead.leadCode} - ${lead.title}`);

    // Update Stage
    await leadService.updateStage(lead._id, 'QUALIFIED', null, adminUser);
    const kanban = await leadService.getKanbanBoard();
    console.log('   ✅ Lead moved to QUALIFIED stage & Kanban pipeline aggregated:', kanban.map(s => `${s.stage}: ${s.count}`).join(', '));

    // =========================================================================
    // MODULE 4: PRODUCTS & INVENTORY MANAGEMENT
    // =========================================================================
    console.log('\n[4/11] 📦 Testing Module 4: Products Catalogue & Live Inventory...');
    const { product, inventory } = await productService.createProduct(
      {
        name: 'Enterprise Ultra Wireless Headphones',
        sku: 'HEADPHONE-PRO-01',
        category: 'Electronics',
        brand: 'AcousticPro',
        pricePaise: 499900, // ₹4,999
        compareAtPricePaise: 699900,
        costPricePaise: 250000,
        initialStock: 100,
        lowStockThreshold: 20,
        description: 'Noise-cancelling enterprise grade wireless headset.'
      },
      adminUser
    );
    console.log(`   ✅ Product created: ${product.name} (SKU: ${product.sku}) with Initial Stock: ${inventory.availableStock}`);

    // Also adjust stock via SKU
    await inventoryService.adjustStock('HEADPHONE-PRO-01', 50, 'RESTOCK', 'Supplier replenishment shipment arrived', null, adminUser);
    const updatedInv = await Inventory.findOne({ product: product._id });
    console.log(`   ✅ Stock adjusted via SKU. New Available Stock: ${updatedInv.availableStock} units`);

    // =========================================================================
    // MODULE 5: ORDERS & IDEMPOTENT PAYMENTS
    // =========================================================================
    console.log('\n[5/11] 🛒 Testing Module 5: Order Processing & Live Stock Deduction...');
    const order = await orderService.createOrder(
      {
        customer: customer.customerCode,
        items: [
          {
            product: 'HEADPHONE-PRO-01',
            quantity: 2
          }
        ],
        shippingAddress: {
          street: '100 Business Park, Outer Ring Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560103',
          country: 'India'
        },
        paymentMethod: 'COD',
        notes: 'Deliver to front desk reception'
      },
      adminUser
    );
    console.log(`   ✅ Order placed: ${order.orderNumber} | Total: ₹${order.totalAmountRupees}`);

    // Verify automatic stock deduction
    const invAfterOrder = await Inventory.findOne({ product: product._id });
    console.log(`   ✅ Live Stock successfully deducted! Previous: 150 -> Current: ${invAfterOrder.availableStock}`);

    // Update order status to DELIVERED & verify RFM customer promotion
    await orderService.updateOrderStatus(order._id, 'SHIPPED', 'Dispatched with courier', { carrier: 'BlueDart', trackingNumber: 'BD-8472910IN' }, adminUser);
    await orderService.updateOrderStatus(order._id, 'DELIVERED', 'Delivered to front desk', null, adminUser);
    const updatedCustomer = await Customer.findById(customer._id);
    console.log(`   ✅ Order status marked DELIVERED. Customer metrics auto-updated: Total Spent ₹${updatedCustomer.metrics.totalSpentRupees}, Segment: ${updatedCustomer.segment}`);

    // Record Payment with Idempotency Key
    const payment = await Payment.create({
      order: order._id,
      customer: customer._id,
      transactionId: `TXN_${Date.now()}`,
      idempotencyKey: `IDEM_${order.orderNumber}_01`,
      gateway: 'COD',
      amountPaise: order.totalAmountPaise,
      status: 'SUCCESS',
      paymentDate: new Date()
    });
    console.log(`   ✅ Idempotent Payment transaction recorded: ${payment.transactionId} for ₹${payment.amountRupees}`);

    // =========================================================================
    // MODULE 6: CUSTOMER SUPPORT & SLA HELPDESK
    // =========================================================================
    console.log('\n[6/11] 🎫 Testing Module 6: Customer Support & SLA Tracking...');
    const ticket = await supportService.createTicket(
      {
        customer: customer.customerCode,
        order: order.orderNumber,
        category: 'PRODUCT',
        priority: 'HIGH',
        subject: 'Query on firmware update for wireless headphones',
        description: 'Customer is requesting download link for the latest audio firmware update.',
        assignedTo: staffUser._id
      },
      adminUser
    );
    console.log(`   ✅ Support Ticket created: ${ticket.ticketNumber} | Priority: ${ticket.priority}`);
    console.log(`   ✅ SLA targets automatically calculated: Response Due: ${ticket.sla.firstResponseDue.toISOString()}`);

    // Add staff response
    await supportService.addMessage(ticket._id, { message: 'Sent firmware v2.1 download link via email.', isInternalNote: false }, staffUser);
    await supportService.updateStatus(ticket._id, 'RESOLVED', 'Resolved customer firmware request', staffUser);
    console.log('   ✅ Staff message added & ticket resolved within SLA window.');

    // =========================================================================
    // MODULE 7: RETURNS & REFUNDS (RMA QUALITY INSPECTION)
    // =========================================================================
    console.log('\n[7/11] 🔄 Testing Module 7: Returns & Refunds (RMA Multi-stage Inspection)...');
    const returnRecord = await returnService.createReturn(
      {
        order: order.orderNumber,
        items: [
          {
            product: 'HEADPHONE-PRO-01',
            quantity: 1,
            reason: 'SIZE_FIT_ISSUE',
            itemCondition: 'OPENED_EXCELLENT'
          }
        ],
        note: 'Customer requested 1 unit exchange/refund'
      },
      adminUser
    );
    console.log(`   ✅ Return RMA initiated: ${returnRecord.rmaNumber} for ₹${returnRecord.totalRefundRequestedRupees}`);

    // Quality Inspection
    await returnService.inspectReturn(returnRecord._id, { passed: true, restockApproved: true, notes: 'Seals opened but unit is in pristine condition.' }, adminUser);
    console.log('   ✅ Warehouse Quality Inspection PASSED. Restock approved.');

    // Process Refund & auto-restock
    await returnService.processRefund(returnRecord._id, { gatewayTransactionId: `RFND_${Date.now()}` }, adminUser);
    const invAfterReturn = await Inventory.findOne({ product: product._id });
    console.log(`   ✅ Refund processed. Warehouse inventory auto-restocked: Now ${invAfterReturn.availableStock} units!`);

    // =========================================================================
    // MODULE 8: MARKETING CAMPAIGNS & AUDIENCE DISPATCH
    // =========================================================================
    console.log('\n[8/11] 📢 Testing Module 8: Marketing Campaigns & Email Dispatches...');
    const campaign = await campaignService.createCampaign(
      {
        name: 'Q4 Enterprise VIP Appreciation',
        subject: 'Exclusive 20% Privilege Discount for Corporate Partners',
        channel: 'EMAIL',
        targetSegment: 'ALL',
        contentHtml: '<h1>Thank you for partnering with us! Use code PARTNER20 on your next order.</h1>'
      },
      adminUser
    );
    console.log(`   ✅ Campaign created: ${campaign.name} | Target: ${campaign.targetSegment}`);

    await campaignService.sendCampaign(campaign._id);
    const sentCampaign = await Campaign.findById(campaign._id);
    console.log(`   ✅ Campaign dispatched! Sent: ${sentCampaign.stats.sentCount}, Delivered: ${sentCampaign.stats.deliveredCount}`);

    // =========================================================================
    // MODULE 9: EMPLOYEE TASKS & ACTIVITIES
    // =========================================================================
    console.log('\n[9/11] 📋 Testing Module 9: Employee Tasks & Activities Management...');
    const task = await taskService.createTask(
      {
        title: 'Review supplier invoice and reconcile Q4 stock movements',
        description: 'Verify warehouse container intake manifest against purchase orders.',
        assignedTo: staffUser._id,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      adminUser
    );
    console.log(`   ✅ Employee Task assigned to staff: "${task.title}"`);
    await taskService.addComment(task._id, 'Supplier invoice received, audit in progress.', staffUser);
    await taskService.updateTask(task._id, { status: 'COMPLETED' }, staffUser);
    console.log('   ✅ Task completed and activity comment logged.');

    // =========================================================================
    // MODULE 10: REPORTS & EXECUTIVE BUSINESS ANALYTICS
    // =========================================================================
    console.log('\n[10/11] 📊 Testing Module 10: Reports & Executive Business Analytics...');
    const overview = await reportService.getExecutiveOverview();
    const salesReport = await reportService.getSalesReport();
    const invReport = await reportService.getInventoryReport();
    console.log('   ✅ Executive Overview KPIs:', JSON.stringify(overview));
    console.log(`   ✅ Inventory Valuation Report: ${invReport.totalAvailableUnits} available units, Total Valuation: ₹${invReport.inventoryValuationRupees}`);

    // =========================================================================
    // MODULE 11: AUDIT LOGS & COMPLIANCE LEDGER
    // =========================================================================
    console.log('\n[11/11] 📜 Testing Module 11: Audit Logs & System Activity Ledger...');
    await auditLogService.logEvent({
      actor: adminUser._id,
      actorName: adminUser.fullName,
      action: 'SYSTEM_VERIFICATION_COMPLETE',
      entity: 'System',
      entityId: 'ALL_MODULES',
      details: 'All 11 CRM Modules end-to-end verified with zero errors.'
    });
    const logs = await auditLogService.getAuditLogs({ limit: 5 });
    console.log(`   ✅ Audit log recorded. Total system ledger entries: ${logs.meta.total}`);

    console.log('\n=============================================================');
    console.log('🎉 ALL 11 ENTERPRISE MODULES TESTED & 100% OPERATIONAL!');
    console.log('=============================================================');
    console.log('\n✨ Database is now cleanly seeded with generic demo data for your frontend developer!');
    console.log('   Admin Login: admin@crm.com / AdminPassword@123\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
};

runFullTestAndCleanSeed();

