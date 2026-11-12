const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const STATUS_CODES = require('../constants/statusCodes');
const User = require('../modules/users/user.model');

/**
 * Enterprise Authentication Middleware
 * Validates JWT access token from Authorization header or HTTP-only cookies
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to HTTP-only cookie
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Authentication required. Please log in.');
  }

  // 3. Verify JWT
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.accessSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Access token has expired. Please refresh your session.');
    }
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid access token.');
  }

  // 4. Check if user still exists and is active
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'User account no longer exists.');
  }

  if (!user.isActive) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, 'User account has been deactivated. Contact an administrator.');
  }

  // 5. Attach user object to request
  req.user = user;
  next();
});

module.exports = {
  authenticate
};

