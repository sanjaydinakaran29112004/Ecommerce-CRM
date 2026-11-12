const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    actorName: { type: String, required: true },
    action: {
      type: String,
      required: true,
      uppercase: true,
      index: true
    },
    entity: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: String,
      index: true
    },
    details: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

