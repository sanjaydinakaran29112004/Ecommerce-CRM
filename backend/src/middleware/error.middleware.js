const { ZodError } = require('zod');
const ApiError = require('../utils/apiError');
const STATUS_CODES = require('../constants/statusCodes');
const config = require('../config/env');

/**
 * Enterprise Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    error = new ApiError(STATUS_CODES.BAD_REQUEST, 'Validation failed', formattedErrors);
  }
  // Handle Mongoose CastError (e.g. invalid ObjectId)
  else if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new ApiError(STATUS_CODES.NOT_FOUND, message);
  }
  // Handle Mongoose Duplicate Key Error (code 11000)
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Value must be unique.`;
    error = new ApiError(STATUS_CODES.CONFLICT, message);
  }
  // Handle Mongoose Schema Validation Errors
  else if (err.name === 'ValidationError') {
    const formattedErrors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
    error = new ApiError(STATUS_CODES.BAD_REQUEST, 'Database validation error', formattedErrors);
  }
  // Handle JWT Invalid Token
  else if (err.name === 'JsonWebTokenError') {
    error = new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid authentication token');
  }
  // Handle JWT Expired Token
  else if (err.name === 'TokenExpiredError') {
    error = new ApiError(STATUS_CODES.UNAUTHORIZED, 'Authentication token expired');
  }
  // Default to Generic 500 if not already an ApiError
  else if (!(error instanceof ApiError)) {
    const statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = err.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  // Response Payload
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(config.env === 'development' && { stack: error.stack })
  };

  if (config.env === 'development') {
    console.error(`\x1b[31m[ERROR ${error.statusCode}] ${req.method} ${req.originalUrl}:\x1b[0m`, error.message);
  }

  return res.status(error.statusCode).json(response);
};

module.exports = errorHandler;

