import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    room:     { type: String, required: true, index: true },
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content:  { type: String, required: true, trim: true, maxlength: 2000 },
    isRead:   { type: Boolean, default: false },
  },
  { timestamps: true }
)

messageSchema.index({ room: 1, createdAt: 1 })

export default mongoose.model('Message', messageSchema)
