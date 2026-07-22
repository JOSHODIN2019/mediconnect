import Appointment, { TIME_SLOTS } from '../models/Appointment.js'
import User         from '../models/User.js'
import { log }     from '../utils/auditLogger.js'
import { notify }  from '../utils/notify.js'

/* ── GET /api/patient/appointments/slots?doctorId=&date= ── */
export const getAvailableSlots = async (req, res) => {
  const { doctorId, date } = req.query
  if (!doctorId || !date) {
    return res.status(400).json({ success: false, message: 'doctorId and date are required' })
  }

  const dateObj   = new Date(date)
  const dayOfWeek = dateObj.getDay() // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.json({ success: true, slots: [] })
  }

  const start = new Date(date); start.setHours(0, 0, 0, 0)
  const end   = new Date(date); end.setHours(23, 59, 59, 999)

  const booked = await Appointment.find({
    doctor: doctorId,
    date: { $gte: start, $lte: end },
    status: { $nin: ['cancelled'] },
  }).select('timeSlot').lean()

  const bookedSet = new Set(booked.map(a => a.timeSlot))
  const slots     = TIME_SLOTS.filter(s => !bookedSet.has(s))

  res.json({ success: true, slots })
}

/* ── POST /api/patient/appointments ── Book appointment ── */
export const bookAppointment = async (req, res) => {
  const { doctorId, date, timeSlot, consultationType = 'video', reason } = req.body

  if (!doctorId || !date || !timeSlot) {
    return res.status(400).json({ success: false, message: 'doctorId, date, and timeSlot are required' })
  }

  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isVerified: true, isActive: true })
  if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })

  const dateObj   = new Date(date)
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  if (dateObj < today) {
    return res.status(400).json({ success: false, message: 'Cannot book appointments in the past' })
  }
  const dayOfWeek = dateObj.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.status(400).json({ success: false, message: 'Appointments are only available on weekdays' })
  }

  if (!TIME_SLOTS.includes(timeSlot)) {
    return res.status(400).json({ success: false, message: 'Invalid time slot' })
  }

  const start = new Date(date); start.setHours(0, 0, 0, 0)
  const end   = new Date(date); end.setHours(23, 59, 59, 999)

  const conflict = await Appointment.findOne({
    doctor: doctorId,
    date: { $gte: start, $lte: end },
    timeSlot,
    status: { $nin: ['cancelled'] },
  })
  if (conflict) return res.status(409).json({ success: false, message: 'This time slot is already booked' })

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor:  doctorId,
    date:    dateObj,
    timeSlot,
    consultationType,
    reason:  reason?.trim(),
    status:  'pending',
  })

  await appointment.populate([
    { path: 'patient', select: 'fullName email userId' },
    { path: 'doctor',  select: 'fullName email specialization hospital userId' },
  ])

  const dateLabel = dateObj.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })

  await log({
    action: 'APPOINTMENT_BOOKED', category: 'appointment', user: req.user,
    details: { appointmentId: appointment._id, doctorId, date, timeSlot }, req,
  })

  await notify({
    recipient: doctorId,
    type:      'APPOINTMENT_BOOKED',
    title:     'New Appointment Request',
    message:   `${req.user.fullName} has requested a ${consultationType} consultation on ${dateLabel} at ${timeSlot}.`,
    data:      { appointmentId: appointment._id },
  })

  res.status(201).json({ success: true, appointment })
}

/* ── GET /api/patient/appointments ── List patient appointments ── */
export const getPatientAppointments = async (req, res) => {
  const { status } = req.query
  const filter = { patient: req.user._id }
  if (status && status !== 'all') filter.status = status

  const appointments = await Appointment.find(filter)
    .populate('doctor', 'fullName email specialization hospital userId')
    .sort({ date: -1, timeSlot: -1 })
    .lean()

  res.json({ success: true, appointments })
}

/* ── DELETE /api/patient/appointments/:id ── Cancel ── */
export const cancelPatientAppointment = async (req, res) => {
  const apt = await Appointment.findOne({ _id: req.params.id, patient: req.user._id })
    .populate('doctor', 'fullName')
  if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found' })

  if (['completed', 'cancelled'].includes(apt.status)) {
    return res.status(400).json({ success: false, message: `Cannot cancel a ${apt.status} appointment` })
  }

  apt.status       = 'cancelled'
  apt.cancelledBy  = 'patient'
  apt.cancelReason = req.body?.reason?.trim() || ''
  await apt.save()

  await log({
    action: 'APPOINTMENT_CANCELLED', category: 'appointment', user: req.user,
    details: { appointmentId: apt._id }, req,
  })

  await notify({
    recipient: apt.doctor._id,
    type:      'APPOINTMENT_CANCELLED',
    title:     'Appointment Cancelled',
    message:   `${req.user.fullName} cancelled the ${apt.consultationType} appointment on ${new Date(apt.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} at ${apt.timeSlot}.`,
    data:      { appointmentId: apt._id },
  })

  res.json({ success: true, appointment: apt })
}

/* ── PATCH /api/patient/appointments/:id ── Reschedule ── */
export const rescheduleAppointment = async (req, res) => {
  const { date, timeSlot } = req.body
  if (!date || !timeSlot) return res.status(400).json({ success: false, message: 'date and timeSlot required' })

  const apt = await Appointment.findOne({ _id: req.params.id, patient: req.user._id })
  if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found' })

  if (['completed', 'cancelled'].includes(apt.status)) {
    return res.status(400).json({ success: false, message: `Cannot reschedule a ${apt.status} appointment` })
  }

  const start = new Date(date); start.setHours(0, 0, 0, 0)
  const end   = new Date(date); end.setHours(23, 59, 59, 999)

  const conflict = await Appointment.findOne({
    _id:    { $ne: apt._id },
    doctor: apt.doctor,
    date:   { $gte: start, $lte: end },
    timeSlot,
    status: { $nin: ['cancelled'] },
  })
  if (conflict) return res.status(409).json({ success: false, message: 'That time slot is already booked' })

  apt.date     = new Date(date)
  apt.timeSlot = timeSlot
  apt.status   = 'pending'
  await apt.save()

  res.json({ success: true, appointment: apt })
}

/* ── GET /api/doctor/appointments ── Doctor's list ── */
export const getDoctorAppointments = async (req, res) => {
  const { status } = req.query
  const filter = { doctor: req.user._id }
  if (status && status !== 'all') filter.status = status

  const appointments = await Appointment.find(filter)
    .populate('patient', 'fullName email phone userId lga dateOfBirth')
    .sort({ date: 1, timeSlot: 1 })
    .lean()

  res.json({ success: true, appointments })
}

/* ── PATCH /api/doctor/appointments/:id ── Confirm / complete / cancel ── */
export const updateDoctorAppointment = async (req, res) => {
  const { action, notes, cancelReason } = req.body

  if (!['confirm', 'complete', 'cancel'].includes(action)) {
    return res.status(400).json({ success: false, message: 'action must be confirm, complete, or cancel' })
  }

  const apt = await Appointment.findOne({ _id: req.params.id, doctor: req.user._id })
    .populate('patient', 'fullName email _id')
  if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found' })

  if (action === 'confirm') {
    if (apt.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending appointments can be confirmed' })
    }
    apt.status = 'confirmed'
    await notify({
      recipient: apt.patient._id,
      type:      'APPOINTMENT_CONFIRMED',
      title:     'Appointment Confirmed',
      message:   `Dr. ${req.user.fullName} confirmed your ${apt.consultationType} appointment on ${new Date(apt.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} at ${apt.timeSlot}.`,
      data:      { appointmentId: apt._id },
    })
  } else if (action === 'complete') {
    if (!['confirmed', 'pending'].includes(apt.status)) {
      return res.status(400).json({ success: false, message: 'Cannot complete this appointment' })
    }
    apt.status = 'completed'
    if (notes?.trim()) apt.doctorNotes = notes.trim()
  } else {
    if (['completed', 'cancelled'].includes(apt.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${apt.status} appointment` })
    }
    apt.status       = 'cancelled'
    apt.cancelledBy  = 'doctor'
    apt.cancelReason = cancelReason?.trim() || ''
    await notify({
      recipient: apt.patient._id,
      type:      'APPOINTMENT_CANCELLED',
      title:     'Appointment Cancelled by Doctor',
      message:   `Dr. ${req.user.fullName} cancelled your appointment on ${new Date(apt.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} at ${apt.timeSlot}.`,
      data:      { appointmentId: apt._id },
    })
  }

  await apt.save()

  await log({
    action: `APPOINTMENT_${action.toUpperCase()}ED`, category: 'appointment', user: req.user,
    details: { appointmentId: apt._id }, req,
  })

  res.json({ success: true, appointment: apt })
}
