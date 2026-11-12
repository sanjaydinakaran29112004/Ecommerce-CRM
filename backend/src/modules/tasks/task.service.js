const Task = require('./task.model');
const ApiError = require('../../utils/apiError');
const STATUS_CODES = require('../../constants/statusCodes');

class TaskService {
  async createTask(taskData, user) {
    const task = await Task.create({
      ...taskData,
      createdBy: user._id
    });
    return task;
  }

  async getTasks(query) {
    const { page, limit, search, status, priority, assignedTo, sortBy, order } = query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'firstName lastName email role')
        .populate('customer', 'customerCode firstName lastName email')
        .populate('order', 'orderNumber totalAmountPaise')
        .populate('createdBy', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      tasks,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages
      }
    };
  }

  async getTaskById(id) {
    const task = await Task.findById(id)
      .populate('assignedTo', 'firstName lastName email role')
      .populate('customer', 'customerCode firstName lastName email phone')
      .populate('order', 'orderNumber totalAmountPaise')
      .populate('createdBy', 'firstName lastName email');

    if (!task) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Task not found');
    }

    return task;
  }

  async updateTask(id, updateData, user) {
    if (updateData.status === 'COMPLETED' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const task = await Task.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .populate('assignedTo', 'firstName lastName email role');

    if (!task) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Task not found');
    }

    return task;
  }

  async addComment(id, content, user) {
    const task = await this.getTaskById(id);

    task.comments.push({
      author: user._id,
      authorName: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
      content
    });

    await task.save();
    return task.comments[task.comments.length - 1];
  }

  async deleteTask(id) {
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, 'Task not found');
    }
    return true;
  }
}

module.exports = new TaskService();

