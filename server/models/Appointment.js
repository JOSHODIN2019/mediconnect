import mongoose from 'mongoose'

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
]

const appointmentSchema = new mongoose.Schema(
  {
    patient:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:             { type: Date, required: true },
    timeSlot:         { type: String, required: true, enum: TIME_SLOTS },
    consultationType: { type: String, enum: ['video', 'phone', 'in-person'], default: 'video' },
    status:           { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
    reason:           { type: String, trim: true },
    doctorNotes:      { type: String, trim: true },
    cancelledBy:      { type: String, enum: ['patient', 'doctor', 'admin'] },
    cancelReason:     { type: String, trim: true },
  },
  { timestamps: true }
)

appointmentSchema.index({ patient: 1, date: -1 })
appointmentSchema.index({ doctor: 1, date: 1 })
// Unique: one booking per doctor per slot per day (cancelled slots are excluded in app logic)
appointmentSchema.index({ doctor: 1, date: 1, timeSlot: 1 })

export default mongoose.model('Appointment', appointmentSchema)
