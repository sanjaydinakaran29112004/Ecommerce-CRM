const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../modules/users/user.model');
const Order = require('../modules/orders/order.model');
const Lead = require('../modules/leads/lead.model');
const SupportTicket = require('../modules/support/support.model');
const ReturnModel = require('../modules/returns/return.model');
const Payment = require('../modules/payments/payment.model');
const Task = require('../modules/tasks/task.model');

async function resetToCleanState() {
  try {
    console.log('Connecting to database:', config.mongodb.uri);
    await mongoose.connect(config.mongodb.uri);
    console.log('[DATABASE CONNECTED] Starting fresh data cleanup...');

    // 1. Clean test orders, payments, leads, tickets, tasks, returns
    const ordersRes = await Order.deleteMany({});
    const paymentsRes = await Payment.deleteMany({});
    const leadsRes = await Lead.deleteMany({});
    const ticketsRes = await SupportTicket.deleteMany({});
    const returnsRes = await ReturnModel.deleteMany({});
    const tasksRes = await Task.deleteMany({});

    console.log(`- Cleared ${ordersRes.deletedCount} orders`);
    console.log(`- Cleared ${paymentsRes.deletedCount} payments`);
    console.log(`- Cleared ${leadsRes.deletedCount} leads`);
    console.log(`- Cleared ${ticketsRes.deletedCount} support tickets`);
    console.log(`- Cleared ${returnsRes.deletedCount} returns`);
    console.log(`- Cleared ${tasksRes.deletedCount} tasks`);

    // 2. Remove all general employees, leaving ONLY Super Admin and Admin
    const staffDeleteRes = await User.deleteMany({
      role: { $in: ['SALES_EMPLOYEE', 'SUPPORT_EMPLOYEE'] }
    });
    console.log(`- Removed ${staffDeleteRes.deletedCount} test staff accounts.`);

    // 3. Ensure Super Admin (Sanjay D) and Admin (Ishwarya R) exist
    const sanjayExists = await User.findOne({ email: 'sanjay@entrykode.com' });
    if (!sanjayExists) {
      await User.create({
        firstName: 'Sanjay',
        lastName: 'D',
        email: 'sanjay@entrykode.com',
        phone: '+91 98401 23456',
        password: 'superadmin@123',
        role: 'SUPER_ADMIN',
        isActive: true,
      });
      console.log('✓ Created Super Admin: sanjay@entrykode.com (superadmin@123)');
    } else {
      console.log('✓ Verified Super Admin: sanjay@entrykode.com');
    }

    const ishwaryaExists = await User.findOne({ email: 'ishwarya@entrykode.com' });
    if (!ishwaryaExists) {
      await User.create({
        firstName: 'Ishwarya',
        lastName: 'R',
        email: 'ishwarya@entrykode.com',
        phone: '+91 98840 54321',
        password: 'admin@123',
        role: 'ADMIN',
        isActive: true,
      });
      console.log('✓ Created Admin: ishwarya@entrykode.com (admin@123)');
    } else {
      console.log('✓ Verified Admin: ishwarya@entrykode.com');
    }

    console.log('\n======================================================');
    console.log('🎉 Project reset complete! Database is now in clean state:');
    console.log('   - Only Super Admin and Admin exist.');
    console.log('   - General staff must now be created from /employees.');
    console.log('   - Orders, Leads, Tickets, Returns are clean.');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Reset error:', error.message);
    process.exit(1);
  }
}

resetToCleanState();

