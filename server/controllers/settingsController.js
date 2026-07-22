import User from '../models/User.js'
import { log } from '../utils/auditLogger.js'

/* ── GET /api/settings/profile ── */
export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').lean()
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  res.json({ success: true, user })
}

/* ── PUT /api/settings/profile ── */
export const updateProfile = async (req, res) => {
  const { fullName, phone, dateOfBirth, specialization, hospital, licenseNumber } = req.body

  if (!fullName?.trim()) return res.status(400).json({ success: false, message: 'Full name is required' })

  const updates = {
    fullName: fullName.trim(),
    phone:    phone?.trim() || undefined,
    dateOfBirth: dateOfBirth || undefined,
  }

  // Doctor-only fields
  if (req.user.role === 'doctor') {
    updates.specialization  = specialization?.trim()  || undefined
    updates.hospital        = hospital?.trim()        || undefined
    updates.licenseNumber   = licenseNumber?.trim()   || undefined
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password').lean()

  await log({ action: 'PROFILE_UPDATED', category: 'auth', user: req.user, details: { fields: Object.keys(updates) }, req })

  res.json({ success: true, user })
}

/* ── PUT /api/settings/password ── */
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All password fields are required' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' })
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'New passwords do not match' })
  }

  const user = await User.findById(req.user._id).select('+password')
  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' })

  user.password = newPassword
  await user.save()

  await log({ action: 'PASSWORD_CHANGED', category: 'auth', user: req.user, details: {}, req })

  res.json({ success: true, message: 'Password updated successfully' })
}

