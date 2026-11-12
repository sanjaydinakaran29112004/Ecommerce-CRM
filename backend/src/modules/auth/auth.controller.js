const authService = require('./auth.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');
const config = require('../../config/env');

// Helper to configure secure HTTP-only cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = config.env === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    setAuthCookies(res, accessToken, refreshToken);

    return ApiResponse.success(res, STATUS_CODES.CREATED, 'User registered successfully', {
      user,
      accessToken,
      refreshToken
    });
  });

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password);
    setAuthCookies(res, accessToken, refreshToken);

    return ApiResponse.success(res, STATUS_CODES.OK, 'Login successful', {
      user,
      accessToken,
      refreshToken
    });
  });

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refreshToken = asyncHandler(async (req, res) => {
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken;
    const { accessToken, refreshToken } = await authService.refreshTokens(incomingToken);

    setAuthCookies(res, accessToken, refreshToken);

    return ApiResponse.success(res, STATUS_CODES.OK, 'Token refreshed successfully', {
      accessToken,
      refreshToken
    });
  });

  /**
   * Logout user and clear tokens
   * POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user._id);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return ApiResponse.success(res, STATUS_CODES.OK, 'Logged out successfully');
  });

  /**
   * Get current authenticated user profile
   * GET /api/v1/auth/me
   */
  getMe = asyncHandler(async (req, res) => {
    return ApiResponse.success(res, STATUS_CODES.OK, 'Current user retrieved', {
      user: req.user
    });
  });
}

module.exports = new AuthController();

