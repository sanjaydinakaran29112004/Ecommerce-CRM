const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');
const config = require('../../config/env');

class AuthService {
  /**
   * Register a new user/employee
   */
  async register(userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(STATUS_CODES.CONFLICT, 'An account with this email already exists');
    }

    const user = await User.create(userData);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Persist refresh token in database for session tracking & revocation
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Exclude sensitive fields from output
    const userJson = user.toObject();
    delete userJson.password;
    delete userJson.refreshToken;

    return { user: userJson, accessToken, refreshToken };
  }

  /**
   * Login user with credentials
   */
  async login(email, password) {
    // Explicitly query password which has select: false
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new ApiError(STATUS_CODES.FORBIDDEN, 'Your account is deactivated. Please contact support.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid email or password');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Update refresh token and last login timestamp
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const userJson = user.toObject();
    delete userJson.password;
    delete userJson.refreshToken;

    return { user: userJson, accessToken, refreshToken };
  }

  /**
   * Rotate and refresh access token using valid refresh token
   */
  async refreshTokens(incomingRefreshToken) {
    if (!incomingRefreshToken) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Refresh token required');
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, config.jwt.refreshSecret);
    } catch (err) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Refresh token is invalid or has been revoked');
    }

    // Token Rotation: Generate new token pair
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Invalidate user session
   */
  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    return true;
  }
}

module.exports = new AuthService();

