const AuditLog = require('./auditLog.model');

class AuditLogService {
  async logEvent(eventData) {
    return AuditLog.create(eventData);
  }

  async getAuditLogs(query) {
    const { page = 1, limit = 20, action, entity, actor, sortBy = 'createdAt', order = 'desc' } = query;
    const filter = {};

    if (action) filter.action = action.toUpperCase();
    if (entity) filter.entity = entity;
    if (actor) filter.actor = actor;

    const skip = (page - 1) * limit;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'firstName lastName email role')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      logs,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages
      }
    };
  }
}

module.exports = new AuditLogService();

