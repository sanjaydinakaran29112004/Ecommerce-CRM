const taskService = require('./task.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const STATUS_CODES = require('../../constants/statusCodes');

class TaskController {
  createTask = asyncHandler(async (req, res) => {
    const task = await taskService.createTask(req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Task created successfully', { task });
  });

  getTasks = asyncHandler(async (req, res) => {
    const result = await taskService.getTasks(req.query);
    return ApiResponse.success(
      res,
      STATUS_CODES.OK,
      'Tasks retrieved successfully',
      { tasks: result.tasks },
      result.meta
    );
  });

  getTaskById = asyncHandler(async (req, res) => {
    const task = await taskService.getTaskById(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Task retrieved successfully', { task });
  });

  updateTask = asyncHandler(async (req, res) => {
    const task = await taskService.updateTask(req.params.id, req.body, req.user);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Task updated successfully', { task });
  });

  addComment = asyncHandler(async (req, res) => {
    const comment = await taskService.addComment(req.params.id, req.body.content, req.user);
    return ApiResponse.success(res, STATUS_CODES.CREATED, 'Comment added to task', { comment });
  });

  deleteTask = asyncHandler(async (req, res) => {
    await taskService.deleteTask(req.params.id);
    return ApiResponse.success(res, STATUS_CODES.OK, 'Task deleted successfully');
  });
}

module.exports = new TaskController();

