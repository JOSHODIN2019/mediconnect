import mongoose from 'mongoose'

const medicationSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  dosage:       { type: String, trim: true },       // e.g. "500mg"
  frequency:    { type: String, trim: true },       // e.g. "Twice daily"
  duration:     { type: String, trim: true },       // e.g. "7 days"
  instructions: { type: String, trim: true },       // e.g. "Take after meals"
}, { _id: false })

const prescriptionSchema = new mongoose.Schema(
  {
    patient:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointment:         { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    medications:         { type: [medicationSchema], default: [] },
    diagnosis:           { type: String, trim: true },
    generalInstructions: { type: String, trim: true },
    status:              { type: String, enum: ['active', 'expired', 'dispensed'], default: 'active' },
    validUntil:          { type: Date },
  },
  { timestamps: true }
)

prescriptionSchema.index({ patient: 1, createdAt: -1 })
prescriptionSchema.index({ doctor: 1, createdAt: -1 })

export default mongoose.model('Prescription', prescriptionSchema)
