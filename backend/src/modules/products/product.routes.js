const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');
const {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema
} = require('./product.validation');

// Authentication Guard
router.use(authenticate);

// List Products
router.get(
  '/',
  requirePermissions(PERMISSIONS.PRODUCTS_READ),
  validate(listProductsQuerySchema),
  productController.getProducts
);

// Create Product
router.post(
  '/',
  requirePermissions(PERMISSIONS.PRODUCTS_CREATE),
  validate(createProductSchema),
  productController.createProduct
);

// Get Product by ID
router.get(
  '/:id',
  requirePermissions(PERMISSIONS.PRODUCTS_READ),
  productController.getProductById
);

// Update Product
router.put(
  '/:id',
  requirePermissions(PERMISSIONS.PRODUCTS_UPDATE),
  validate(updateProductSchema),
  productController.updateProduct
);

// Archive Product
router.delete(
  '/:id',
  requirePermissions(PERMISSIONS.PRODUCTS_DELETE),
  productController.archiveProduct
);

module.exports = router;

