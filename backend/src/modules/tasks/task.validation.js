const { z } = require('zod');

const createTaskSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Task title is required' }).min(3).max(150).trim(),
    description: z.string().trim().optional(),
    assignedTo: z.string({ required_error: 'Assigned user ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    customer: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    order: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).default('TODO'),
    dueDate: z.coerce.date().optional()
  })
});

const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID')
  }),
  body: z.object({
    title: z.string().min(3).max(150).trim().optional(),
    description: z.string().trim().optional(),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    dueDate: z.coerce.date().optional()
  })
});

const addTaskCommentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID')
  }),
  body: z.object({
    content: z.string({ required_error: 'Comment content is required' }).min(1).trim()
  })
});

const listTasksQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedTo: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc')
  })
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  addTaskCommentSchema,
  listTasksQuerySchema
};

