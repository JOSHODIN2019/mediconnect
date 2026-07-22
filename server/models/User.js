import mongoose from 'mongoose'
import { hash, compare } from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    fullName:      { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true, minlength: 8, select: false },
    role:          { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    phone:         { type: String, trim: true },
    dateOfBirth:   { type: Date },
    state:         { type: String, default: 'Edo State' },
    lga:           { type: String, trim: true },         // Local Government Area
    userId:        { type: String, unique: true },       // PAT-XXXXXX / DOC-XXXXXX / ADM-XXXXXX
    isActive:      { type: Boolean, default: true },
    isVerified:    { type: Boolean, default: false },    // admin verifies doctors

    // Doctor-specific
    specialization: { type: String },
    hospital:       { type: String },
    licenseNumber:  { type: String },
    yearsExperience:{ type: Number },
  },
  { timestamps: true }
)

/* ── Auto-generate userId before save ── */
userSchema.pre('save', async function () {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await hash(this.password, 12)
  }

  // Generate userId on creation
  if (!this.userId) {
    const prefixMap = { patient: 'PAT', doctor: 'DOC', admin: 'ADM' }
    const prefix = prefixMap[this.role] ?? 'USR'
    const suffix = Math.floor(100000 + Math.random() * 900000)
    this.userId = `${prefix}-${suffix}`
  }
})

/* ── Compare password ── */
userSchema.methods.comparePassword = async function (candidate) {
  return compare(candidate, this.password)
}

/* ── Strip sensitive fields from JSON output ── */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export default mongoose.model('User', userSchema)
