import { createRequire } from 'module'
import Appointment from '../models/Appointment.js'

const _require = createRequire(import.meta.url)
let RtcTokenBuilder, RtcRole
try {
  const pkg = _require('agora-access-token')
  RtcTokenBuilder = pkg.RtcTokenBuilder
  RtcRole = pkg.RtcRole
} catch (e) {
  console.warn('[video] agora-access-token not loaded:', e.message)
}

export const getVideoToken = async (req, res) => {
  try {
    const { appointmentId } = req.query
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'appointmentId is required' })
    }

    const apt = await Appointment.findById(appointmentId)
      .populate('patient', 'fullName _id')
      .populate('doctor', 'fullName _id')

    if (!apt) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    const userId = req.user._id.toString()
    const isParticipant =
      apt.patient._id.toString() === userId ||
      apt.doctor._id.toString() === userId

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized for this appointment' })
    }

    if (apt.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Appointment must be confirmed to start a video call' })
    }

    if (apt.consultationType !== 'video') {
      return res.status(400).json({ success: false, message: 'This appointment is not a video consultation' })
    }

    const appId = process.env.AGORA_APP_ID || ''
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || ''
    const channelName = appointmentId

    // Deterministic numeric UID from the last 7 hex chars of the user ObjectId
    const uid = parseInt(userId.slice(-7), 16) % 1_000_000

    let token = null
    if (appId && appCertificate && RtcTokenBuilder) {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600
      token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        expiresAt
      )
    }

    res.json({
      success: true,
      token,
      channelName,
      uid,
      appId,
      appointment: {
        _id: apt._id,
        patient: apt.patient,
        doctor: apt.doctor,
        date: apt.date,
        timeSlot: apt.timeSlot,
      },
    })
  } catch (err) {
    console.error('[video] getVideoToken error:', err)
    res.status(500).json({ success: false, message: 'Server error generating video token' })
  }
}
