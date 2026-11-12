/**
 * Enterprise Standard API Response Wrapper
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - User-friendly message
   * @param {any} data - Response payload
   * @param {object|null} meta - Optional pagination / metadata
   */
  constructor(statusCode, message = 'Success', data = null, meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
    if (meta !== null) {
      this.meta = meta;
    }
  }

  static success(res, statusCode, message, data = null, meta = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data, meta));
  }
}

module.exports = ApiResponse;

