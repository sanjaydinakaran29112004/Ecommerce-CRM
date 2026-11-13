const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/rbac.middleware');

// All employee / user routes require authentication
router.use(authenticate);

router.get('/', userController.getUsers);
// Only Super Admin and Admin can create / provision employees
router.post('/', authorizeRoles('SUPER_ADMIN', 'ADMIN'), userController.createUser);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'ADMIN'), userController.updateStatus);
router.patch('/:id/role', authorizeRoles('SUPER_ADMIN'), userController.updateRole);

module.exports = router;

