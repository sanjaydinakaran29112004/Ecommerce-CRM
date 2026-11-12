const rateLimit = require('express-rate-limit');
const STATUS_CODES = require('../constants/statusCodes');

/**
 * Standard API Rate Limiter
 * 300 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: STATUS_CODES.TOO_MANY_REQUESTS,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

/**
 * Strict Auth Rate Limiter (Brute-Force Protection)
 * 10 failed/login attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: STATUS_CODES.TOO_MANY_REQUESTS,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};

