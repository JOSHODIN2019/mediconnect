import mongoose from 'mongoose'

const accessGrantSchema = new mongoose.Schema(
  {
    patient:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive:   { type: Boolean, default: true },
    grantedAt:  { type: Date, default: Date.now },
    revokedAt:  { type: Date },
  },
  { timestamps: true }
)

accessGrantSchema.index({ patient: 1, doctor: 1 }, { unique: true })
accessGrantSchema.index({ patient: 1, isActive: 1 })

export default mongoose.model('AccessGrant', accessGrantSchema)
