import { existsSync } from 'fs'
import User               from '../models/User.js'
import MedicalRecord      from '../models/MedicalRecord.js'
import AccessGrant        from '../models/AccessGrant.js'
import AuditLog           from '../models/AuditLog.js'
import Appointment        from '../models/Appointment.js'
import Prescription       from '../models/Prescription.js'
import { log }            from '../utils/auditLogger.js'
import { notify }         from '../utils/notify.js'

/* ── GET /api/patient/stats ── */
export const getStats = async (req, res) => {
  const patientId = req.user._id
  const [totalRecords, verifiedRecords, activeGrants, auditEvents] = await Promise.all([
    MedicalRecord.countDocuments({ patient: patientId }),
    MedicalRecord.countDocuments({ patient: patientId, isVerified: true }),
    AccessGrant.countDocuments({ patient: patientId, isActive: true }),
    AuditLog.countDocuments({ userId: patientId }),
  ])
  res.json({ success: true, stats: { totalRecords, verifiedRecords, activeGrants, auditEvents } })
}

/* ── GET /api/patient/dashboard ── Telemedicine dashboard stats ── */
export const getDashboardStats = async (req, res) => {
  const patientId = req.user._id
  const now       = new Date()
  const [myDoctors, totalRecords, upcomingAppointments, completedConsultations, activePrescriptions] = await Promise.all([
    AccessGrant.countDocuments({ patient: patientId, isActive: true }),
    MedicalRecord.countDocuments({ patient: patientId }),
    Appointment.countDocuments({ patient: patientId, status: { $in: ['pending', 'confirmed'] }, date: { $gte: now } }),
    Appointment.countDocuments({ patient: patientId, status: 'completed' }),
    Prescription.countDocuments({ patient: patientId, status: 'active' }),
  ])
  res.json({
    success: true,
    stats: {
      upcomingAppointments,
      completedConsultations,
      activePrescriptions,
      myDoctors,
      totalRecords,
    },
  })
}

/* ── GET /api/patient/records ── */
export const getRecords = async (req, res) => {
  const records = await MedicalRecord.find({ patient: req.user._id })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'fullName role')
    .lean()
  res.json({ success: true, records })
}

/* ── GET /api/patient/doctors ── All verified doctors for access control ── */
export const getDoctors = async (req, res) => {
  const doctors = await User.find({ role: 'doctor', isVerified: true, isActive: true })
    .select('fullName email specialization hospital userId')
    .lean()

  // Attach grant status for this patient
  const grants = await AccessGrant.find({ patient: req.user._id }).lean()
  const grantMap = {}
  grants.forEach(g => { grantMap[g.doctor.toString()] = g })

  const result = doctors.map(d => ({
    ...d,
    grant: grantMap[d._id.toString()] || null,
  }))

  res.json({ success: true, doctors: result })
}

/* ── POST /api/patient/access/:doctorId ── Grant access ── */
export const grantAccess = async (req, res) => {
  const doctor = await User.findOne({ _id: req.params.doctorId, role: 'doctor', isVerified: true })
  if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })

  const grant = await AccessGrant.findOneAndUpdate(
    { patient: req.user._id, doctor: doctor._id },
    { isActive: true, grantedAt: new Date(), revokedAt: null },
    { upsert: true, new: true }
  )

  await log({ action: 'ACCESS_GRANTED', category: 'access', user: req.user, details: { doctorId: doctor._id, doctorEmail: doctor.email }, req })

  await notify({
    recipient: doctor._id,
    type:      'ACCESS_GRANTED',
    title:     'Access Granted',
    message:   `${req.user.fullName} has granted you access to their medical records.`,
    data:      { patientId: req.user._id },
  })

  res.json({ success: true, grant })
}

/* ── DELETE /api/patient/access/:doctorId ── Revoke access ── */
export const revokeAccess = async (req, res) => {
  const grant = await AccessGrant.findOneAndUpdate(
    { patient: req.user._id, doctor: req.params.doctorId },
    { isActive: false, revokedAt: new Date() },
    { new: true }
  )
  if (!grant) return res.status(404).json({ success: false, message: 'Access grant not found' })

  await log({ action: 'ACCESS_REVOKED', category: 'access', user: req.user, details: { doctorId: req.params.doctorId }, req })

  await notify({
    recipient: req.params.doctorId,
    type:      'ACCESS_REVOKED',
    title:     'Access Revoked',
    message:   `${req.user.fullName} has revoked your access to their medical records.`,
    data:      { patientId: req.user._id },
  })

  res.json({ success: true, grant })
}

/* ── POST /api/patient/records ── Upload a medical record ── */
export const uploadRecord = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

  const { title, description, recordType = 'other' } = req.body
  if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' })

  const cleanTitle       = title.trim()
  const cleanDescription = description?.trim() || ''

  const record = await MedicalRecord.create({
    patient:     req.user._id,
    uploadedBy:  req.user._id,
    title:       cleanTitle,
    description: cleanDescription,
    recordType,
    fileName:    req.file.originalname,
    fileSize:    req.file.size,
    mimeType:    req.file.mimetype,
    filePath:    req.file.path,
    isVerified:  false,
  })

  await log({ action: 'RECORD_UPLOADED', category: 'record', user: req.user,
    details: { recordId: record._id, title: cleanTitle }, req })

  res.status(201).json({ success: true, record })
}

/* ── GET /api/patient/records/:id/file ── Download / view file ── */
export const serveFile = async (req, res) => {
  const record = await MedicalRecord.findOne({ _id: req.params.id, patient: req.user._id })
  if (!record) return res.status(404).json({ success: false, message: 'Record not found' })
  if (!record.filePath || !existsSync(record.filePath)) {
    return res.status(404).json({ success: false, message: 'File not found on server' })
  }

  const inline = req.query.inline === '1'
  if (inline) {
    res.setHeader('Content-Type', record.mimeType || 'application/octet-stream')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(record.fileName || 'file')}"`)
    res.sendFile(record.filePath)
  } else {
    res.download(record.filePath, record.fileName || 'download')
  }
}

/* ── GET /api/patient/audit ── Patient's own audit events ── */
export const getAuditLogs = async (req, res) => {
  const logs = await AuditLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean()
  res.json({ success: true, logs })
}
