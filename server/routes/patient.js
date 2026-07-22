import { Router } from 'express'
import { protect, requireRole } from '../middleware/auth.js'
import {
  getStats, getDashboardStats,
  getRecords, uploadRecord, serveFile,
  getDoctors, grantAccess, revokeAccess,
  getAuditLogs,
} from '../controllers/patientController.js'
import {
  getAvailableSlots, bookAppointment, getPatientAppointments,
  cancelPatientAppointment, rescheduleAppointment,
} from '../controllers/appointmentController.js'
import { getPatientPrescriptions } from '../controllers/prescriptionController.js'
import { upload } from '../middleware/upload.js'

const router = Router()
router.use(protect, requireRole('patient'))

router.get('/dashboard',                      getDashboardStats)
router.get('/stats',                          getStats)
router.get('/records',                        getRecords)
router.post('/records',                       upload.single('file'), uploadRecord)
router.get('/records/:id/file',               serveFile)
router.get('/doctors',                        getDoctors)
router.post('/access/:doctorId',              grantAccess)
router.delete('/access/:doctorId',            revokeAccess)
router.get('/audit',                          getAuditLogs)
router.get('/appointments/slots',             getAvailableSlots)
router.get('/appointments',                   getPatientAppointments)
router.post('/appointments',                  bookAppointment)
router.patch('/appointments/:id',             rescheduleAppointment)
router.delete('/appointments/:id',            cancelPatientAppointment)
router.get('/prescriptions',                  getPatientPrescriptions)

export default router
