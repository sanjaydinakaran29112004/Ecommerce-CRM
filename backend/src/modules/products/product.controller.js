const productService = require('./product.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');

class ProductController {
  /**
   * Create Product
   * POST /api/v1/products
   */
  createProduct = asyncHandler(async (req, res) => {
    const result = await productService.createProduct(req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Product created successfully', result);
  });

  /**
   * List Products
   * GET /api/v1/products
   */
  getProducts = asyncHandler(async (req, res) => {
    const result = await productService.getProducts(req.query);
    return ApiResponse.success(
      res,
      STATUS_CODES.OK,
      'Products retrieved successfully',
      { products: result.products },
      result.meta
    );
  });

  /**
   * Get Product Details by ID
   * GET /api/v1/products/:id
   */
  getProductById = asyncHandler(async (req, res) => {
    const result = await productService.getProductById(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Product retrieved successfully', result);
  });

  /**
   * Update Product
   * PUT /api/v1/products/:id
   */
  updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Product updated successfully', { product });
  });

  /**
   * Archive / Delete Product
   * DELETE /api/v1/products/:id
   */
  archiveProduct = asyncHandler(async (req, res) => {
    await productService.archiveProduct(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Product archived successfully');
  });
}

module.exports = new ProductController();

