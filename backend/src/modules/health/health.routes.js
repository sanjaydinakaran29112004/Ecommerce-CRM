const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ApiResponse = require('../../utils/apiResponse');
const STATUS_CODES = require('../../constants/statusCodes');
const config = require('../../config/env');

router.get('/', (req, res) => {
  const dbStatusMap = {
    0: 'DISCONNECTED',
    1: 'CONNECTED',
    2: 'CONNECTING',
    3: 'DISCONNECTING'
  };

  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1;

  const healthData = {
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    environment: config.env,
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStatusMap[dbState] || 'UNKNOWN',
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A'
    },
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    }
  };

  const httpStatus = isHealthy ? STATUS_CODES.OK : STATUS_CODES.SERVICE_UNAVAILABLE;
  return ApiResponse.success(res, httpStatus, 'System health report', healthData);
});

module.exports = router;

