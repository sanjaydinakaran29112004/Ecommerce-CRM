const User = require('./user.model');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');
const { ROLE_DEFAULT_PERMISSIONS } = require('../../constants/permissions.constant');

class UserController {
  /**
   * List all employees / users
   * GET /api/v1/users or /api/v1/employees
   */
  getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password -refreshToken').sort({ createdAt: -1 }).lean();

    const formatted = users.map((u) => {
      let dept = u.department || 'Operations';
      if (!u.department) {
        if (u.role === 'SUPER_ADMIN') dept = 'Leadership & Engineering';
        else if (u.role === 'ADMIN') dept = 'Backend & Operations';
        else if (u.role === 'SALES_EMPLOYEE') dept = 'Sales & Business Development';
        else if (u.role === 'SUPPORT_EMPLOYEE') dept = 'Customer Support & Success';
      }

      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
      const avatarUrl = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4f46e5&color=fff&bold=true`;

      return {
        ...u,
        id: u._id?.toString() || u.id,
        name: fullName,
        department: dept,
        avatar: avatarUrl,
        permissions: ROLE_DEFAULT_PERMISSIONS[u.role] || [],
        status: u.isActive ? 'ACTIVE' : 'INACTIVE'
      };
    });

    return ApiResponse.success(res, STATUS_CODES.OK, 'Employees retrieved successfully', { users: formatted });
  });

  /**
   * Invite / Create employee
   * POST /api/v1/users or /api/v1/employees
   */
  createUser = asyncHandler(async (req, res) => {
    const { name, firstName, lastName, email, role, password, phone, department, avatar } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      throw new ApiError(STATUS_CODES.CONFLICT, 'An employee with this email already exists');
    }

    const nameParts = (name || '').split(' ');
    const fName = firstName || nameParts[0] || 'Staff';
    const lName = lastName || nameParts.slice(1).join(' ') || '';

    const fullName = `${fName} ${lName}`.trim();
    const finalAvatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4f46e5&color=fff&bold=true`;

    const newUser = await User.create({
      firstName: fName,
      lastName: lName,
      email: cleanEmail,
      phone: phone || '+91 98401 23456',
      password: password || 'Welcome@123',
      role: role || 'SALES_EMPLOYEE',
      department: department || 'Operations',
      avatar: finalAvatar,
      isActive: true
    });

    const userObj = newUser.toObject();
    delete userObj.password;
    delete userObj.refreshToken;
    userObj.name = fullName;
    userObj.id = newUser._id.toString();

    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Employee provisioned successfully', { user: userObj });
  });

  /**
   * Update employee status (Activate / Deactivate)
   */
  updateStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: Boolean(isActive) },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) throw new ApiError(STATUS_CODES.NOT_FOUND, 'Employee not found');
    return ApiResponse.success(res, STATUS_CODES.OK, 'Employee status updated', { user });
  });

  /**
   * Update employee role
   */
  updateRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) throw new ApiError(STATUS_CODES.NOT_FOUND, 'Employee not found');
    return ApiResponse.success(res, STATUS_CODES.OK, 'Employee role updated', { user });
  });
}

module.exports = new UserController();

