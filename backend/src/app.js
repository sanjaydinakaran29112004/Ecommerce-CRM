const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const config = require('./config/env');
const ApiError = require('./utils/apiError');
const STATUS_CODES = require('./constants/statusCodes');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

// Route imports
const healthRoutes = require('./modules/health/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const customerRoutes = require('./modules/customers/customer.routes');
const leadRoutes = require('./modules/leads/lead.routes');
const productRoutes = require('./modules/products/product.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const orderRoutes = require('./modules/orders/order.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const supportRoutes = require('./modules/support/support.routes');
const returnRoutes = require('./modules/returns/return.routes');
const campaignRoutes = require('./modules/campaigns/campaign.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const reportRoutes = require('./modules/reports/report.routes');
const auditLogRoutes = require('./modules/auditLogs/auditLog.routes');
const userRoutes = require('./modules/users/user.routes');

const app = express();

// 1. Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// 2. Request Logging & Body Parsers
if (config.env === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 3. Global API Rate Limiting
app.use('/api', apiLimiter);

// 4. API Routes Mounting
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/tickets', supportRoutes);
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/dashboard', reportRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/employees', userRoutes);

// Root route friendly welcome
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    message: 'E-Commerce CRM Enterprise REST API',
    docs: '/api/v1/health'
  });
});

// 5. 404 Handler for Unhandled Routes
app.use((req, res, next) => {
  next(new ApiError(STATUS_CODES.NOT_FOUND, `Route not found: [${req.method}] ${req.originalUrl}`));
});

// 6. Centralized Error Handler Middleware (Must be last)
app.use(errorHandler);

module.exports = app;

