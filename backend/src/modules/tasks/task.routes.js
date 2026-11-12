const express = require('express');
const router = express.Router();
const taskController = require('./task.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../middleware/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions.constant');
const {
  createTaskSchema,
  updateTaskSchema,
  addTaskCommentSchema,
  listTasksQuerySchema
} = require('./task.validation');

router.use(authenticate);

router.get(
  '/',
  requirePermissions(PERMISSIONS.TASKS_READ),
  validate(listTasksQuerySchema),
  taskController.getTasks
);

router.post(
  '/',
  requirePermissions(PERMISSIONS.TASKS_CREATE),
  validate(createTaskSchema),
  taskController.createTask
);

router.get(
  '/:id',
  requirePermissions(PERMISSIONS.TASKS_READ),
  taskController.getTaskById
);

router.put(
  '/:id',
  requirePermissions(PERMISSIONS.TASKS_UPDATE),
  validate(updateTaskSchema),
  taskController.updateTask
);

router.post(
  '/:id/comments',
  requirePermissions(PERMISSIONS.TASKS_UPDATE),
  validate(addTaskCommentSchema),
  taskController.addComment
);

router.delete(
  '/:id',
  requirePermissions(PERMISSIONS.TASKS_UPDATE),
  taskController.deleteTask
);

module.exports = router;

