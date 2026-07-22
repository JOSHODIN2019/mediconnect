import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:       { type: String, required: true },   // RECORD_UPLOADED, ACCESS_GRANTED, etc.
    title:      { type: String, required: true },
    message:    { type: String, required: true },
    isRead:     { type: Boolean, default: false },
    data:       { type: mongoose.Schema.Types.Mixed, default: {} }, // extra context (recordId, etc.)
  },
  { timestamps: true }
)

export default mongoose.model('Notification', notificationSchema)
