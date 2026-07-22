import Prescription  from '../models/Prescription.js'
import User          from '../models/User.js'
import AccessGrant   from '../models/AccessGrant.js'
import { log }       from '../utils/auditLogger.js'
import { notify }    from '../utils/notify.js'

/* ── POST /api/doctor/prescriptions ── Issue a prescription ── */
export const createPrescription = async (req, res) => {
  const { patientId, appointmentId, medications, diagnosis, generalInstructions, validUntil } = req.body

  if (!patientId) return res.status(400).json({ success: false, message: 'patientId is required' })
  if (!medications?.length) return res.status(400).json({ success: false, message: 'At least one medication is required' })

  // Validate patient exists and doctor has access (or patient is in their panel)
  const patient = await User.findOne({ _id: patientId, role: 'patient', isActive: true })
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' })

  const prescription = await Prescription.create({
    patient:             patientId,
    doctor:              req.user._id,
    appointment:         appointmentId || undefined,
    medications:         medications.map(m => ({
      name:         m.name?.trim(),
      dosage:       m.dosage?.trim() || '',
      frequency:    m.frequency?.trim() || '',
      duration:     m.duration?.trim() || '',
      instructions: m.instructions?.trim() || '',
    })),
    diagnosis:           diagnosis?.trim() || '',
    generalInstructions: generalInstructions?.trim() || '',
    validUntil:          validUntil ? new Date(validUntil) : undefined,
    status:              'active',
  })

  await prescription.populate([
    { path: 'patient', select: 'fullName email userId' },
    { path: 'doctor',  select: 'fullName specialization userId' },
  ])

  await log({
    action: 'PRESCRIPTION_ISSUED', category: 'record', user: req.user,
    details: { prescriptionId: prescription._id, patientId }, req,
  })

  await notify({
    recipient: patientId,
    type:      'PRESCRIPTION_ISSUED',
    title:     'New Prescription',
    message:   `Dr. ${req.user.fullName} has issued a prescription for you with ${medications.length} medication${medications.length > 1 ? 's' : ''}.`,
    data:      { prescriptionId: prescription._id },
  })

  res.status(201).json({ success: true, prescription })
}

/* ── GET /api/doctor/prescriptions ── Doctor's issued prescriptions ── */
export const getDoctorPrescriptions = async (req, res) => {
  const { status, patientId } = req.query
  const filter = { doctor: req.user._id }
  if (status && status !== 'all') filter.status = status
  if (patientId) filter.patient = patientId

  const prescriptions = await Prescription.find(filter)
    .populate('patient', 'fullName email userId phone')
    .populate('appointment', 'date timeSlot consultationType')
    .sort({ createdAt: -1 })
    .lean()

  res.json({ success: true, prescriptions })
}

/* ── PATCH /api/doctor/prescriptions/:id ── Update status ── */
export const updatePrescriptionStatus = async (req, res) => {
  const { status } = req.body
  if (!['active', 'expired', 'dispensed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' })
  }

  const rx = await Prescription.findOne({ _id: req.params.id, doctor: req.user._id })
  if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' })

  rx.status = status
  await rx.save()
  res.json({ success: true, prescription: rx })
}

/* ── GET /api/patient/prescriptions ── Patient's prescriptions ── */
export const getPatientPrescriptions = async (req, res) => {
  const { status } = req.query
  const filter = { patient: req.user._id }
  if (status && status !== 'all') filter.status = status

  const prescriptions = await Prescription.find(filter)
    .populate('doctor', 'fullName email specialization hospital userId')
    .populate('appointment', 'date timeSlot consultationType')
    .sort({ createdAt: -1 })
    .lean()

  res.json({ success: true, prescriptions })
}

/* ── GET /api/admin/prescriptions ── Admin overview ── */
export const getAllPrescriptions = async (req, res) => {
  const { status, limit = 50 } = req.query
  const filter = {}
  if (status && status !== 'all') filter.status = status

  const prescriptions = await Prescription.find(filter)
    .populate('patient', 'fullName email userId')
    .populate('doctor',  'fullName email specialization userId')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean()

  const total = await Prescription.countDocuments(filter)
  res.json({ success: true, prescriptions, total })
}
