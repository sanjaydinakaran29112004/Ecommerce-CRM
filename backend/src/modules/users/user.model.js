const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const { ALL_ROLES, ROLES } = require('../../constants/roles.constant');
const { ROLE_DEFAULT_PERMISSIONS } = require('../../constants/permissions.constant');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false // Crucial: Never return password in queries by default
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.SALES_EXECUTIVE,
      index: true
    },
    customPermissions: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    refreshToken: {
      type: String,
      select: false
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName || ''}`.trim();
});

// Pre-save hook: Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(config.security.saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method: Verify candidate password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Generate Short-lived JWT Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry }
  );
};

// Instance method: Generate Long-lived JWT Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );
};

// Instance method: Check if user has specific permission
userSchema.methods.hasPermission = function (permissionKey) {
  // Super Admin bypasses all checks
  if (this.role === ROLES.SUPER_ADMIN) return true;

  // Check custom granted permissions
  if (this.customPermissions && this.customPermissions.includes(permissionKey)) {
    return true;
  }

  // Check role default permissions
  const defaultPermissions = ROLE_DEFAULT_PERMISSIONS[this.role] || [];
  return defaultPermissions.includes(permissionKey);
};

module.exports = mongoose.model('User', userSchema);

