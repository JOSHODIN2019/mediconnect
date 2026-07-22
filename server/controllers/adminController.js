import { unlinkSync, existsSync } from 'fs'
import User          from '../models/User.js'
import AuditLog      from '../models/AuditLog.js'
import MedicalRecord from '../models/MedicalRecord.js'
import Appointment   from '../models/Appointment.js'
import Prescription  from '../models/Prescription.js'
import { log }       from '../utils/auditLogger.js'
import { notify }    from '../utils/notify.js'

/* ── GET /api/admin/appointments ── */
export const getAllAppointments = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 30 } = req.query
    const filter = {}
    if (status && status !== 'all') filter.status = status
    if (type   && type   !== 'all') filter.consultationType = type

    const [appointments, total, pending, confirmed, completed, cancelled] = await Promise.all([
      Appointment.find(filter)
        .sort({ date: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('patient', 'fullName email userId')
        .populate('doctor',  'fullName email specialization userId')
        .lean(),
      Appointment.countDocuments(filter),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
    ])

    res.json({
      success: true,
      appointments,
      total,
      page:   Number(page),
      pages:  Math.ceil(total / Number(limit)),
      counts: { pending, confirmed, completed, cancelled, all: total },
    })
  } catch (err) {
    console.error('[adminController] getAllAppointments:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/* ── GET /api/admin/stats ── */
export const getStats = async (req, res) => {
  const [totalPatients, totalDoctors, verifiedDoctors, pendingDoctors, totalAudit] = await Promise.all([
    User.countDocuments({ role: 'patient', isActive: true }),
    User.countDocuments({ role: 'doctor' }),
    User.countDocuments({ role: 'doctor', isVerified: true }),
    User.countDocuments({ role: 'doctor', isVerified: false }),
    AuditLog.countDocuments(),
  ])

  res.json({
    success: true,
    stats: { totalPatients, totalDoctors, verifiedDoctors, pendingDoctors, totalAudit },
  })
}

/* ── GET /api/admin/doctors ── */
export const getDoctors = async (req, res) => {
  const doctors = await User.find({ role: 'doctor' }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, doctors })
}

/* ── POST /api/admin/doctors ── */
export const registerDoctor = async (req, res) => {
  const { fullName, email, password, phone, specialization, hospital, licenseNumber } = req.body

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' })
  }

  const existing = await User.findOne({ email })
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered' })
  }

  const doctor = await User.create({
    fullName, email, password, phone,
    specialization, hospital, licenseNumber,
    role: 'doctor',
    isVerified: true,
    isActive: true,
  })

  await log({ action: 'DOCTOR_REGISTERED', category: 'admin', user: req.user, details: { doctorEmail: email }, req })

  await notify({
    recipient: doctor._id,
    type:      'ACCOUNT_CREATED',
    title:     'Welcome to MediConnect',
    message:   'Your doctor account has been created and verified by the administrator. You can now log in.',
    data:      {},
  })

  res.status(201).json({ success: true, doctor: doctor.toSafeObject() })
}

/* ── PATCH /api/admin/doctors/:id ── */
export const updateDoctor = async (req, res) => {
  const { isVerified, isActive } = req.body
  const doctor = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'doctor' },
    { ...(isVerified !== undefined && { isVerified }), ...(isActive !== undefined && { isActive }) },
    { new: true }
  )
  if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })

  const action = isActive === false ? 'DOCTOR_DEACTIVATED' : isVerified ? 'DOCTOR_VERIFIED' : 'DOCTOR_UPDATED'
  await log({ action, category: 'admin', user: req.user, details: { doctorId: doctor._id }, req })

  res.json({ success: true, doctor: doctor.toSafeObject() })
}

/* ── DELETE /api/admin/doctors/:id ── */
export const deleteDoctor = async (req, res) => {
  const doctor = await User.findOneAndDelete({ _id: req.params.id, role: 'doctor' })
  if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })
  await log({ action: 'DOCTOR_DELETED', category: 'admin', user: req.user, details: { doctorEmail: doctor.email }, req })
  res.json({ success: true, message: 'Doctor removed' })
}

/* ── GET /api/admin/patients ── */
export const getPatients = async (req, res) => {
  const patients = await User.find({ role: 'patient' }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, patients })
}

/* ── GET /api/admin/records ── All patient records ── */
export const getRecords = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const filter = status === 'verified' ? { isVerified: true }
               : status === 'pending'  ? { isVerified: false }
               : {}

  const [records, total] = await Promise.all([
    MedicalRecord.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('patient',    'fullName email userId')
      .populate('uploadedBy', 'fullName role')
      .lean(),
    MedicalRecord.countDocuments(filter),
  ])

  const pendingCount  = await MedicalRecord.countDocuments({ isVerified: false })
  const verifiedCount = await MedicalRecord.countDocuments({ isVerified: true })

  res.json({ success: true, records, total, page: Number(page), pages: Math.ceil(total / Number(limit)), pendingCount, verifiedCount })
}

/* ── PATCH /api/admin/records/:id/verify ── Admin marks a record as verified ── */
export const verifyRecord = async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
  if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

  const updated = await MedicalRecord.findByIdAndUpdate(
    record._id,
    { isVerified: true },
    { new: true }
  ).populate('patient', 'fullName email userId').populate('uploadedBy', 'fullName role').lean()

  await log({ action: 'RECORD_VERIFIED', category: 'record', user: req.user,
    details: { recordId: record._id, patientId: record.patient }, req })

  res.json({ success: true, record: updated })
}

/* ── DELETE /api/admin/records/:id ── Admin deletes a record ── */
export const deleteRecord = async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
  if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

  if (record.filePath && existsSync(record.filePath)) {
    try { unlinkSync(record.filePath) } catch { /* file already gone */ }
  }

  await MedicalRecord.findByIdAndDelete(record._id)
  await log({
    action: 'RECORD_DELETED', category: 'record', user: req.user,
    details: { recordId: record._id, title: record.title, patientId: record.patient }, req,
  })

  res.json({ success: true, message: 'Record deleted' })
}

/* ── GET /api/admin/records/:id/file ── Admin views / downloads a file ── */
export const serveRecordFile = async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
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

/* ── GET /api/admin/audit ── */
export const getAuditLogs = async (req, res) => {
  const { category, limit = 50, page = 1 } = req.query
  const filter = category ? { category } : {}
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean(),
    AuditLog.countDocuments(filter),
  ])
  res.json({ success: true, logs, total, page: Number(page), pages: Math.ceil(total / limit) })
}

/* ── GET /api/admin/analytics ── */
export const getAnalytics = async (req, res) => {
  try {
    const days     = parseInt(req.query.days) || 30
    const since    = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Build a full date series so days with zero data still appear
    const dateLabels = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      dateLabels.push(d.toISOString().slice(0, 10))
    }

    const fillSeries = (agg) => {
      const map = {}
      agg.forEach(a => { map[a._id] = a.count })
      return dateLabels.map(d => ({ date: d, value: map[d] || 0 }))
    }

    const [
      apptByDay, usersByDay, statusBreakdown, consultBreakdown,
      recordsByType, topDoctors,
      totalAppts, totalPatients, totalDoctors, totalRecords, totalPrescriptions,
    ] = await Promise.all([
      Appointment.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: since }, role: { $ne: 'admin' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        { $group: { _id: '$consultationType', count: { $sum: 1 } } },
      ]),
      MedicalRecord.aggregate([
        { $group: { _id: '$recordType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Appointment.aggregate([
        { $group: { _id: '$doctor', total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'doc' } },
        { $unwind: { path: '$doc', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$doc.fullName', spec: '$doc.specialization', total: 1, completed: 1 } },
      ]),
      Appointment.countDocuments(),
      User.countDocuments({ role: 'patient', isActive: true }),
      User.countDocuments({ role: 'doctor' }),
      MedicalRecord.countDocuments(),
      Prescription.countDocuments(),
    ])

    res.json({
      success: true,
      overview: { totalAppts, totalPatients, totalDoctors, totalRecords, totalPrescriptions },
      trends: {
        appointments: fillSeries(apptByDay),
        users:        fillSeries(usersByDay),
        labels:       dateLabels.map(d => d.slice(5)), // MM-DD
      },
      breakdowns: {
        status:      statusBreakdown,
        consult:     consultBreakdown,
        recordTypes: recordsByType,
      },
      topDoctors,
    })
  } catch (err) {
    console.error('[adminController] getAnalytics:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
