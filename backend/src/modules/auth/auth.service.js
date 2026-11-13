const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');
const config = require('../../config/env');
const { ROLES } = require('../../constants/roles.constant');
const { PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } = require('../../constants/permissions.constant');

const computeUserPermissions = (user) => {
  const base = ROLE_DEFAULT_PERMISSIONS[user.role] || [];
  const list = user.role === ROLES.SUPER_ADMIN
    ? Object.values(PERMISSIONS)
    : [...new Set([...base, ...(user.customPermissions || [])])];
  const set = new Set();
  list.forEach((p) => {
    set.add(p);
    set.add(p.replace(':', '.'));
    set.add(p.replace('.', ':'));
  });
  return Array.from(set);
};

class AuthService {
  /**
   * Register a new user/employee (Strictly restricted to Admin/Super Admin only)
   */
  async register(userData) {
    // Only Super Admin and Admin can be registered publicly.
    // General staff employees MUST be provisioned by Admin in the Employees module.
    if (userData.role && userData.role !== ROLES.SUPER_ADMIN && userData.role !== ROLES.ADMIN) {
      throw new ApiError(
        STATUS_CODES.FORBIDDEN,
        'Staff employees cannot self-register. Please contact Super Admin or Admin to create your account in the Employees portal.'
      );
    }

    const cleanEmail = (userData.email || '').toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      throw new ApiError(STATUS_CODES.CONFLICT, 'An account with this email already exists');
    }

    const user = await User.create({
      ...userData,
      email: cleanEmail,
      role: userData.role || ROLES.ADMIN
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Persist refresh token in database for session tracking & revocation
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Exclude sensitive fields from output and ensure name and avatar are attached
    const userJson = user.toObject();
    delete userJson.password;
    delete userJson.refreshToken;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    userJson.name = fullName;
    userJson.fullName = fullName;
    userJson.avatar = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4f46e5&color=fff&bold=true`;
    userJson.permissions = computeUserPermissions(user);

    return { user: userJson, accessToken, refreshToken };
  }

  /**
   * Login user with credentials
   */
  async login(email, password) {
    const cleanEmail = (email || '').toLowerCase().trim();
    // Explicitly query password which has select: false
    let user = await User.findOne({ email: cleanEmail }).select('+password +refreshToken');

    // On-the-fly bootstrapping for Super Admin and Admin leadership accounts if fresh
    if (!user) {
      const defaultAccounts = {
        'sanjay@entrykode.com': { firstName: 'Sanjay', lastName: 'D', password: 'superadmin@123', role: 'SUPER_ADMIN' },
        'ishwarya@entrykode.com': { firstName: 'Ishwarya', lastName: 'R', password: 'admin@123', role: 'ADMIN' },
      };
      const def = defaultAccounts[cleanEmail];
      if (def && def.password === password) {
        const created = await User.create({
          firstName: def.firstName,
          lastName: def.lastName,
          email: cleanEmail,
          password: def.password,
          role: def.role,
          isActive: true,
        });
        user = await User.findById(created._id).select('+password +refreshToken');
      }
    }

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
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    userJson.name = fullName;
    userJson.fullName = fullName;
    userJson.avatar = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4f46e5&color=fff&bold=true`;
    userJson.permissions = computeUserPermissions(user);

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

