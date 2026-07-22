import { existsSync } from 'fs'
import User                         from '../models/User.js'
import MedicalRecord                from '../models/MedicalRecord.js'
import AccessGrant                  from '../models/AccessGrant.js'
import AuditLog                     from '../models/AuditLog.js'
import Appointment                  from '../models/Appointment.js'
import Prescription                 from '../models/Prescription.js'
import { log }                      from '../utils/auditLogger.js'
import { notify }                   from '../utils/notify.js'

/* ── GET /api/doctor/stats ── */
export const getStats = async (req, res) => {
  const doctorId = req.user._id
  const now = new Date()
  const [activePatients, totalRecordsViewed, auditEvents, upcomingAppointments, totalPrescriptions] = await Promise.all([
    AccessGrant.countDocuments({ doctor: doctorId, isActive: true }),
    AuditLog.countDocuments({ userId: doctorId, action: 'RECORD_VIEWED' }),
    AuditLog.countDocuments({ userId: doctorId }),
    Appointment.countDocuments({ doctor: doctorId, status: { $in: ['pending', 'confirmed'] }, date: { $gte: now } }),
    Prescription.countDocuments({ doctor: doctorId }),
  ])
  res.json({ success: true, stats: { activePatients, totalRecordsViewed, auditEvents, upcomingAppointments, totalPrescriptions } })
}

/* ── GET /api/doctor/patients ── Patients who granted access to this doctor ── */
export const getPatients = async (req, res) => {
  const grants = await AccessGrant.find({ doctor: req.user._id, isActive: true })
    .populate('patient', 'fullName email phone dateOfBirth userId')
    .sort({ grantedAt: -1 })
    .lean()

  // Attach record count per patient
  const patients = await Promise.all(grants.map(async g => {
    const recordCount = await MedicalRecord.countDocuments({ patient: g.patient?._id })
    return { ...g.patient, grantedAt: g.grantedAt, recordCount }
  }))

  res.json({ success: true, patients })
}

/* ── GET /api/doctor/patients/:patientId/records ── View a patient's records ── */
export const getPatientRecords = async (req, res) => {
  const { patientId } = req.params

  // Verify this doctor has active access
  const grant = await AccessGrant.findOne({ patient: patientId, doctor: req.user._id, isActive: true })
  if (!grant) return res.status(403).json({ success: false, message: 'Access not granted by this patient' })

  const [patient, records] = await Promise.all([
    User.findById(patientId).select('fullName email userId dateOfBirth phone').lean(),
    MedicalRecord.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'fullName role')
      .lean(),
  ])

  res.json({ success: true, patient, records })
}

/* ── POST /api/doctor/patients/:patientId/records ── Doctor uploads a record ── */
export const uploadPatientRecord = async (req, res) => {
  const { patientId } = req.params

  const grant = await AccessGrant.findOne({ patient: patientId, doctor: req.user._id, isActive: true })
  if (!grant) return res.status(403).json({ success: false, message: 'Access not granted by this patient' })

  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

  const { title, description, recordType = 'other' } = req.body
  if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' })

  const cleanTitle       = title.trim()
  const cleanDescription = description?.trim() || ''

  const record = await MedicalRecord.create({
    patient:     patientId,
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
    details: { recordId: record._id, patientId, title: cleanTitle }, req })

  await notify({
    recipient: patientId,
    type:      'RECORD_UPLOADED',
    title:     'New Medical Record Added',
    message:   `Dr. ${req.user.fullName} uploaded a new record: "${cleanTitle}"`,
    data:      { recordId: record._id },
  })

  res.status(201).json({ success: true, record })
}

/* ── GET /api/doctor/patients/:patientId/records/:recordId/file ── */
export const servePatientFile = async (req, res) => {
  const { patientId, recordId } = req.params

  // Confirm active access grant
  const grant = await AccessGrant.findOne({ patient: patientId, doctor: req.user._id, isActive: true })
  if (!grant) return res.status(403).json({ success: false, message: 'Access not granted by this patient' })

  const record = await MedicalRecord.findOne({ _id: recordId, patient: patientId })
  if (!record) return res.status(404).json({ success: false, message: 'Record not found' })
  if (!record.filePath || !existsSync(record.filePath)) {
    return res.status(404).json({ success: false, message: 'File not found on server' })
  }

  await log({ action: 'RECORD_VIEWED', category: 'record', user: req.user, details: { recordId: record._id, patientId }, req })

  const inline = req.query.inline === '1'
  if (inline) {
    res.setHeader('Content-Type', record.mimeType || 'application/octet-stream')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(record.fileName || 'file')}"`)
    res.sendFile(record.filePath)
  } else {
    res.download(record.filePath, record.fileName || 'download')
  }
}

/* ── POST /api/doctor/patients/register ── Doctor registers a new patient ── */
export const registerPatient = async (req, res) => {
  try {
    const { fullName, email, password, phone, dateOfBirth } = req.body

    if (!fullName?.trim())      return res.status(400).json({ success: false, message: 'Full name is required' })
    if (!email?.trim())         return res.status(400).json({ success: false, message: 'Email is required' })
    if (!password)              return res.status(400).json({ success: false, message: 'Password is required' })
    if (password.length < 8)   return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) return res.status(409).json({ success: false, message: 'A patient with this email already exists' })

    const patient = await User.create({
      fullName:    fullName.trim(),
      email:       email.toLowerCase().trim(),
      password,
      role:        'patient',
      phone:       phone?.trim()  || undefined,
      dateOfBirth: dateOfBirth    || undefined,
    })

    await AccessGrant.create({ patient: patient._id, doctor: req.user._id, isActive: true })

    await log({ action: 'PATIENT_REGISTERED', category: 'record', user: req.user, details: { patientId: patient._id, patientEmail: email }, req })

    // Notify the new patient they have been registered
    await notify({
      recipient: patient._id,
      type:      'ACCOUNT_CREATED',
      title:     'Welcome to MediConnect',
      message:   `Your account was created by Dr. ${req.user.fullName}. You can now log in and view your medical records.`,
      data:      {},
    })

    res.status(201).json({ success: true, patient: patient.toSafeObject() })
  } catch (err) {
    console.error('registerPatient error:', err)
    const msg = err.code === 11000
      ? 'A patient with this email already exists'
      : (err.message || 'Could not register patient')
    res.status(400).json({ success: false, message: msg })
  }
}

/* ── GET /api/doctor/audit ── */
export const getAuditLogs = async (req, res) => {
  const logs = await AuditLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean()
  res.json({ success: true, logs })
}

/* ── GET /api/doctor/analytics ── */
export const getDoctorAnalytics = async (req, res) => {
  try {
    const doctorId = req.user._id
    const days     = parseInt(req.query.days) || 14
    const since    = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const dateLabels = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      dateLabels.push(d.toISOString().slice(0, 10))
    }

    const [
      totalAppts, completed, cancelled, pending, confirmed,
      rxCount, uniquePatientIds,
      apptByDay, apptByType,
      thisMonthAppts, lastMonthAppts,
    ] = await Promise.all([
      Appointment.countDocuments({ doctor: doctorId }),
      Appointment.countDocuments({ doctor: doctorId, status: 'completed' }),
      Appointment.countDocuments({ doctor: doctorId, status: 'cancelled' }),
      Appointment.countDocuments({ doctor: doctorId, status: 'pending' }),
      Appointment.countDocuments({ doctor: doctorId, status: 'confirmed' }),
      Prescription.countDocuments({ doctor: doctorId }),
      Appointment.distinct('patient', { doctor: doctorId }),
      Appointment.aggregate([
        { $match: { doctor: doctorId, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Appointment.aggregate([
        { $match: { doctor: doctorId } },
        { $group: { _id: '$consultationType', count: { $sum: 1 } } },
      ]),
      Appointment.countDocuments({ doctor: doctorId, createdAt: { $gte: monthAgo } }),
      Appointment.countDocuments({ doctor: doctorId,
        createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), $lt: monthAgo } }),
    ])

    const map = {}
    apptByDay.forEach(a => { map[a._id] = a.count })
    const trend = dateLabels.map(d => ({ date: d.slice(5), value: map[d] || 0 }))

    const completionRate = totalAppts > 0 ? Math.round((completed / totalAppts) * 100) : 0
    const growthRate = lastMonthAppts > 0
      ? Math.round(((thisMonthAppts - lastMonthAppts) / lastMonthAppts) * 100)
      : thisMonthAppts > 0 ? 100 : 0

    res.json({
      success: true,
      stats: {
        totalAppts, completed, cancelled, pending, confirmed,
        rxCount, uniquePatients: uniquePatientIds.length,
        completionRate, growthRate,
        thisMonthAppts, lastMonthAppts,
      },
      trend,
      consultTypes: apptByType,
    })
  } catch (err) {
    console.error('[doctorController] getDoctorAnalytics:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
