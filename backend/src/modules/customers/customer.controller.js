const customerService = require('./customer.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');
const { PERMISSIONS } = require('../../constants/permissions.constant');

class CustomerController {
  /**
   * Create Customer
   * POST /api/v1/customers
   */
  createCustomer = asyncHandler(async (req, res) => {
    const customer = await customerService.createCustomer(req.body);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Customer created successfully', { customer });
  });

  /**
   * List Customers with Search, Filter & Pagination
   * GET /api/v1/customers
   */
  getCustomers = asyncHandler(async (req, res) => {
    const result = await customerService.getCustomers(req.query);

    // Apply PII data masking if requester lacks pii:view permission
    const canViewPII = req.user.hasPermission(PERMISSIONS.PII_VIEW);
    let customerList = result.customers;

    if (!canViewPII) {
      customerList = customerList.map((c) => {
        if (c.email) {
          const [user, domain] = c.email.split('@');
          const masked = user.length > 2 ? `${user.substring(0, 2)}****` : '****';
          c.email = `${masked}@${domain}`;
        }
        if (c.phone) {
          c.phone = c.phone.length > 4 ? `+91 ******${c.phone.slice(-4)}` : '******';
        }
        return c;
      });
    }

    return ApiResponse.success(res, STATUS_CODES.OK, 'Customers retrieved successfully', {
      customers: customerList
    }, result.meta);
  });

  /**
   * Get Customer 360 Profile by ID
   * GET /api/v1/customers/:id
   */
  getCustomerById = asyncHandler(async (req, res) => {
    const customer = await customerService.getCustomerById(req.params.id);

    const canViewPII = req.user.hasPermission(PERMISSIONS.PII_VIEW);
    const responseData = canViewPII ? customer : customer.maskSensitiveData();

    return ApiResponse.success(res, STATUS_CODES.OK, 'Customer profile retrieved', {
      customer: responseData
    });
  });

  /**
   * Update Customer Profile
   * PUT /api/v1/customers/:id
   */
  updateCustomer = asyncHandler(async (req, res) => {
    const updatedCustomer = await customerService.updateCustomer(req.params.id, req.body);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Customer updated successfully', {
      customer: updatedCustomer
    });
  });

  /**
   * Archive / Soft Delete Customer
   * DELETE /api/v1/customers/:id
   */
  archiveCustomer = asyncHandler(async (req, res) => {
    await customerService.archiveCustomer(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Customer archived successfully');
  });

  /**
   * Add Staff Note to Customer 360
   * POST /api/v1/customers/:id/notes
   */
  addNote = asyncHandler(async (req, res) => {
    const note = await customerService.addNote(req.params.id, req.body.content, req.user);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Customer note added', { note });
  });

  /**
   * Get Customer RFM Segment Analytics
   * GET /api/v1/customers/stats/rfm
   */
  getSegmentStats = asyncHandler(async (req, res) => {
    const stats = await customerService.getSegmentStats();
    return ApiResponse.success(res, STATUS_CODES.OK, 'Customer segment statistics', { stats });
  });
}

module.exports = new CustomerController();

