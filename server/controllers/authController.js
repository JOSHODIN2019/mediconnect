import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

const authResponse = (res, user, statusCode = 200) => {
  const token = signToken(user._id, user.role)
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeObject(),
  })
}

/* ── POST /api/auth/register ── */
export const register = async (req, res) => {
  const { fullName, email, password, phone, dateOfBirth, lga, state } = req.body

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Full name, email and password are required' })
  }

  const existing = await User.findOne({ email })
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' })
  }

  const user = await User.create({
    fullName,
    email,
    password,
    phone,
    dateOfBirth,
    lga,
    state: state || 'Edo State',
    role: 'patient',
    isVerified: true,
  })

  authResponse(res, user, 201)
}

/* ── POST /api/auth/login ── */
export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' })
  }

  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' })
  }

  authResponse(res, user)
}

/* ── GET /api/auth/me ── */
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() })
}

/* ── PUT /api/auth/profile ── Update own profile ── */
export const updateProfile = async (req, res) => {
  const { fullName, phone, lga, state } = req.body
  const allowed = {}
  if (fullName?.trim()) allowed.fullName = fullName.trim()
  if (phone !== undefined) allowed.phone = phone.trim()
  if (lga   !== undefined) allowed.lga   = lga
  if (state !== undefined) allowed.state = state

  const user = await User.findByIdAndUpdate(req.user._id, allowed, { new: true, runValidators: true })
  res.json({ success: true, user: user.toSafeObject(), message: 'Profile updated' })
}

