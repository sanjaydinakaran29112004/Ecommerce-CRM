const mongoose = require('mongoose');
const config = require('./env');
const { ensureLocalMongo } = require('./localDbServer');

/**
 * Connect to MongoDB with enterprise event monitoring
 */
const connectDB = async () => {
  try {
    let uri = config.mongodb.uri;

    // Auto-bootstrap local persistent MongoDB if local URI is configured
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      uri = await ensureLocalMongo();
    }

    const conn = await mongoose.connect(uri, {
      autoIndex: config.env !== 'production', // Build indexes in dev, manage manually in prod
      serverSelectionTimeoutMS: 10000 // Timeout after 10s
    });

    console.log(`\x1b[32m[DATABASE] MongoDB Connected: ${conn.connection.host} / DB: ${conn.connection.name}\x1b[0m`);

    // Auto-seed default staff accounts and catalog if not yet created in MongoDB
    await autoSeedDefaultUsers();
    await autoSeedCatalogAndCustomers();

    mongoose.connection.on('error', (err) => {
      console.error('\x1b[31m[DATABASE ERROR]\x1b[0m', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('\x1b[33m[DATABASE WARN] MongoDB disconnected. Attempting reconnection...\x1b[0m');
    });

    return conn;
  } catch (error) {
    console.error(`\x1b[31m[DATABASE FATAL] Connection failed: ${error.message}\x1b[0m`);
    // In production we exit with failure; during local setup we log guidance
    console.error('\x1b[33m[TIP] Check your MONGODB_URI in the .env file. Ensure your MongoDB Atlas cluster or local MongoDB service is running.\x1b[0m');
    throw error;
  }
};

const autoSeedDefaultUsers = async () => {
  try {
    const User = require('../modules/users/user.model');
    const sanjayUser = await User.findOne({ email: 'sanjay@entrykode.com' });
    if (!sanjayUser) {
      console.log('\x1b[36m[AUTO-SEED] Seeding Super Admin & Admin leadership accounts into MongoDB...\x1b[0m');
      const seedUsers = [
        {
          firstName: 'Sanjay',
          lastName: 'D',
          email: 'sanjay@entrykode.com',
          phone: '+91 98401 23456',
          password: 'superadmin@123',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
        {
          firstName: 'Ishwarya',
          lastName: 'R',
          email: 'ishwarya@entrykode.com',
          phone: '+91 98840 54321',
          password: 'admin@123',
          role: 'ADMIN',
          isActive: true,
        }
      ];
      for (const u of seedUsers) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
          await User.create(u);
        }
      }
      console.log('\x1b[32m[AUTO-SEED] Super Admin and Admin accounts initialized! Staff accounts must be created by Admin.\x1b[0m');
    }
  } catch (err) {
    console.warn('[AUTO-SEED WARN] Could not seed users:', err.message);
  }
};

const autoSeedCatalogAndCustomers = async () => {
  try {
    const Product = require('../modules/products/product.model');
    const Inventory = require('../modules/inventory/inventory.model');
    const Customer = require('../modules/customers/customer.model');
    const Order = require('../modules/orders/order.model');

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('\x1b[36m[AUTO-SEED] Seeding official product catalog into MongoDB...\x1b[0m');
      const seedProducts = [
        {
          sku: 'EK-TECH-001',
          name: 'Aura Pro Wireless ANC Headphones',
          description: 'Studio-grade noise cancelling wireless over-ear headphones with 40h battery life.',
          category: 'Consumer Electronics',
          pricePaise: 1499900,
          costPricePaise: 950000,
          taxRatePercent: 18,
          brand: 'Aura',
          isActive: true
        },
        {
          sku: 'EK-TECH-002',
          name: 'Zenith Mechanical Gaming Keyboard',
          description: 'Hot-swappable RGB mechanical keyboard with custom lubricated linear switches.',
          category: 'Computer Accessories',
          pricePaise: 849900,
          costPricePaise: 500000,
          taxRatePercent: 18,
          brand: 'Zenith',
          isActive: true
        },
        {
          sku: 'EK-TECH-003',
          name: 'Lumina 4K Ultra Webcam',
          description: 'HDR 4K streaming and conferencing webcam with stereo beamforming microphones.',
          category: 'Computer Accessories',
          pricePaise: 1129900,
          costPricePaise: 700000,
          taxRatePercent: 18,
          brand: 'Lumina',
          isActive: true
        }
      ];

      for (const p of seedProducts) {
        const createdProd = await Product.create(p);
        await Inventory.create({
          product: createdProd._id,
          sku: createdProd.sku,
          warehouseLocation: 'Main Warehouse - Chennai Hub',
          availableStock: 50,
          reservedStock: 0,
          lowStockThreshold: 10
        });
      }
      console.log('\x1b[32m[AUTO-SEED] Product catalog & Inventory records initialized!\x1b[0m');
    }

    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      console.log('\x1b[36m[AUTO-SEED] Seeding standard enterprise customers into MongoDB...\x1b[0m');
      const seedCusts = [
        {
          customerCode: 'CUST-10001',
          firstName: 'Ananya',
          lastName: 'Ramaswamy',
          email: 'ananya.ramaswamy@gmail.com',
          phone: '+91 98401 23456',
          companyName: 'Ramaswamy Tech Solutions',
          source: 'WEBSITE',
          segment: 'VIP',
          addresses: [
            {
              type: 'SHIPPING',
              isDefault: true,
              street: 'Flat 4B, Emerald Heights, Anna Nagar',
              city: 'Chennai',
              state: 'Tamil Nadu',
              postalCode: '600040',
              country: 'India'
            }
          ]
        },
        {
          customerCode: 'CUST-10002',
          firstName: 'Vikram',
          lastName: 'Sundaram',
          email: 'vikram.sundaram@gmail.com',
          phone: '+91 98840 54321',
          companyName: 'Apex Logistics Pvt Ltd',
          source: 'DIRECT_LEAD',
          segment: 'RETURNING',
          addresses: [
            {
              type: 'SHIPPING',
              isDefault: true,
              street: 'No. 23, Gandhi Road, T. Nagar',
              city: 'Chennai',
              state: 'Tamil Nadu',
              postalCode: '600017',
              country: 'India'
            }
          ]
        }
      ];
      await Customer.insertMany(seedCusts);
      console.log('\x1b[32m[AUTO-SEED] Enterprise customer profiles initialized!\x1b[0m');
    }

    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      console.log('\x1b[36m[AUTO-SEED] Seeding sample enterprise orders into MongoDB...\x1b[0m');
      const cust = await Customer.findOne({ email: 'ananya.ramaswamy@gmail.com' });
      const prod = await Product.findOne({ sku: 'EK-TECH-001' });
      if (cust && prod) {
        await Order.create({
          orderNumber: 'ORD-2026-9042',
          customer: cust._id,
          customerSnapshot: {
            name: `${cust.firstName} ${cust.lastName || ''}`.trim(),
            email: cust.email,
            phone: cust.phone
          },
          items: [
            {
              product: prod._id,
              sku: prod.sku,
              name: prod.name,
              unitPricePaise: prod.pricePaise,
              quantity: 1,
              totalPricePaise: prod.pricePaise
            }
          ],
          subtotalPaise: prod.pricePaise,
          discountPaise: 0,
          taxPaise: Math.round(prod.pricePaise * 0.18),
          shippingFeePaise: 0,
          totalAmountPaise: prod.pricePaise + Math.round(prod.pricePaise * 0.18),
          orderStatus: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: 'RAZORPAY',
          shippingAddress: cust.addresses[0]
        });
        console.log('\x1b[32m[AUTO-SEED] Sample orders initialized!\x1b[0m');
      }
    }

    // Auto-seed Leads
    const Lead = require('../modules/leads/lead.model');
    const leadCount = await Lead.countDocuments();
    if (leadCount === 0) {
      const staff = await require('../modules/users/user.model').findOne({ role: 'SALES_EMPLOYEE' }) || await require('../modules/users/user.model').findOne();
      await Lead.create({
        leadCode: 'LEAD-2026-9041',
        title: 'Apex Logistics Bulk Headphone Deal',
        contactName: 'Vikram Sundaram',
        companyName: 'Apex Logistics Pvt Ltd',
        email: 'vikram.sundaram@gmail.com',
        phone: '+91 98840 54321',
        estimatedValuePaise: 15000000,
        source: 'WEBSITE',
        stage: 'QUALIFIED',
        priority: 'HIGH',
        assignedTo: staff?._id,
        assignedToName: staff ? `${staff.firstName} ${staff.lastName || ''}`.trim() : 'Karthik Raja'
      });
      console.log('\x1b[32m[AUTO-SEED] Sample enterprise leads initialized!\x1b[0m');
    }

    // Auto-seed Tasks
    const Task = require('../modules/tasks/task.model');
    const taskCount = await Task.countDocuments();
    if (taskCount === 0) {
      const superAdmin = await require('../modules/users/user.model').findOne({ role: 'SUPER_ADMIN' }) || await require('../modules/users/user.model').findOne();
      await Task.create([
        {
          title: 'Audit damaged keyboard units with warehouse logistics team',
          assignedTo: superAdmin?._id,
          priority: 'MEDIUM',
          status: 'TODO',
          dueDate: new Date(Date.now() + 86400000)
        },
        {
          title: 'Follow up on pending Razorpay refund reconciliation for return #41',
          assignedTo: superAdmin?._id,
          priority: 'HIGH',
          status: 'COMPLETED',
          dueDate: new Date(Date.now() + 172800000),
          completedAt: new Date()
        }
      ]);
      console.log('\x1b[32m[AUTO-SEED] Operational tasks initialized!\x1b[0m');
    }

    // Auto-seed Campaigns
    const Campaign = require('../modules/campaigns/campaign.model');
    const campaignCount = await Campaign.countDocuments();
    if (campaignCount === 0) {
      const admin = await require('../modules/users/user.model').findOne({ role: 'ADMIN' }) || await require('../modules/users/user.model').findOne();
      await Campaign.create({
        name: 'Diwali Festive Electronics Clearance',
        subject: 'Diwali Special 20% Off ANC Headphones',
        channel: 'EMAIL',
        targetSegment: 'VIP',
        contentHtml: '<h1>Diwali Special Offer</h1><p>Enjoy exclusive 20% off on all EntryKode premium ANC headphones this festive season!</p>',
        audienceCount: 1500,
        status: 'COMPLETED',
        createdBy: admin?._id
      });
      console.log('\x1b[32m[AUTO-SEED] Marketing campaigns initialized!\x1b[0m');
    }

    // Auto-seed Support Tickets
    const SupportTicket = require('../modules/support/support.model');
    const ticketCount = await SupportTicket.countDocuments();
    if (ticketCount === 0) {
      const cust = await Customer.findOne();
      const supportUser = await require('../modules/users/user.model').findOne({ role: 'SUPPORT_EMPLOYEE' }) || await require('../modules/users/user.model').findOne();
      if (cust) {
        await SupportTicket.create({
          ticketNumber: 'TKT-2026-9041',
          customer: cust._id,
          customerSnapshot: {
            name: `${cust.firstName} ${cust.lastName || ''}`.trim(),
            email: cust.email,
            phone: cust.phone
          },
          subject: 'Warranty Claim: Headphone Bluetooth pairing issue',
          description: 'Customer reports left ear cup disconnects intermittently during calls.',
          category: 'PRODUCT',
          priority: 'HIGH',
          status: 'OPEN',
          assignedTo: supportUser?._id,
          messages: [
            {
              senderType: 'CUSTOMER',
              senderName: `${cust.firstName} ${cust.lastName || ''}`.trim(),
              message: 'Hello, my Aura Pro headset connects to phone but left side audio drops off.'
            }
          ]
        });
        console.log('\x1b[32m[AUTO-SEED] Support tickets initialized!\x1b[0m');
      }
    }
  } catch (err) {
    console.warn('[AUTO-SEED WARN] Catalog seed note:', err.message);
  }
};

module.exports = connectDB;

