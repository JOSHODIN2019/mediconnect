import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    action:    { type: String, required: true },   // e.g. 'USER_REGISTERED', 'RECORD_UPLOADED'
    category:  { type: String, required: true },   // 'auth' | 'record' | 'access' | 'admin'
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String },
    userRole:  { type: String },
    details:   { type: Object, default: {} },       // extra context
    ipAddress: { type: String },
    status:    { type: String, enum: ['success', 'failure', 'warning'], default: 'success' },
  },
  { timestamps: true }
)

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ userId: 1 })
auditLogSchema.index({ category: 1 })

export default mongoose.model('AuditLog', auditLogSchema)
