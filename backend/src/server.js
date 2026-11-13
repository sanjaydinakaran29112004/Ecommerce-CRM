const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');

let server;

// Handle Uncaught Exceptions (Synchronous errors)
process.on('uncaughtException', (err) => {
  console.error('\x1b[31m[UNCAUGHT EXCEPTION] Shutting down...\x1b[0m');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start HTTP Listener
    server = app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 CRM Backend Server running in \x1b[34m${config.env.toUpperCase()}\x1b[0m mode`);
      console.log(`📡 URL: \x1b[36mhttp://localhost:${config.port}\x1b[0m`);
      console.log(`🏥 Health Check: \x1b[36mhttp://localhost:${config.port}/api/v1/health\x1b[0m`);
      console.log(`🔐 Auth Endpoints: \x1b[36mhttp://localhost:${config.port}/api/v1/auth\x1b[0m`);
      console.log(`======================================================\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\x1b[31m[PORT CONFLICT] Port ${config.port} is already in use by another process.\x1b[0m`);
      } else {
        console.error(`\x1b[31m[SERVER ERROR]\x1b[0m`, err.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(`\x1b[31m[SERVER START ERROR]\x1b[0m Failed to start application:`, error.message);
    // Don't exit immediately in dev so developer can see the error in console
  }
};

startServer();

// Handle Unhandled Promise Rejections (Asynchronous errors)
process.on('unhandledRejection', (err) => {
  console.error('\x1b[31m[UNHANDLED REJECTION] Gracefully shutting down...\x1b[0m');
  console.error(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle SIGTERM & SIGINT (Graceful Shutdown on Ctrl+C or Docker stop)
const gracefulShutdown = (signal) => {
  console.log(`\n\x1b[33m[${signal}] Received. Closing HTTP server & database connections...\x1b[0m`);
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

