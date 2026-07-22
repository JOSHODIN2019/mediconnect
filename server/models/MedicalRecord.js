import mongoose from 'mongoose'

const medicalRecordSchema = new mongoose.Schema(
  {
    patient:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    recordType:  { type: String, enum: ['lab', 'prescription', 'imaging', 'consultation', 'surgery', 'vaccination', 'other'], default: 'other' },
    fileName:    { type: String },
    fileSize:    { type: Number },
    mimeType:    { type: String },
    filePath:    { type: String },
    isVerified:  { type: Boolean, default: false },
  },
  { timestamps: true }
)

medicalRecordSchema.index({ patient: 1, createdAt: -1 })

export default mongoose.model('MedicalRecord', medicalRecordSchema)
