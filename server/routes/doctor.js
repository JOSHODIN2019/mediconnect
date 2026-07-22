import { Router } from 'express'
import { protect, requireRole } from '../middleware/auth.js'
import { getStats, getPatients, getPatientRecords, uploadPatientRecord, servePatientFile, getAuditLogs, registerPatient, getDoctorAnalytics } from '../controllers/doctorController.js'
import { getDoctorAppointments, updateDoctorAppointment } from '../controllers/appointmentController.js'
import { createPrescription, getDoctorPrescriptions, updatePrescriptionStatus } from '../controllers/prescriptionController.js'
import { upload } from '../middleware/upload.js'

const router = Router()
router.use(protect, requireRole('doctor'))

router.get('/stats',                                         getStats)
router.get('/patients',                                      getPatients)
router.post('/patients/register',                            registerPatient)
router.get('/patients/:patientId/records',                   getPatientRecords)
router.post('/patients/:patientId/records',                  upload.single('file'), uploadPatientRecord)
router.get('/patients/:patientId/records/:recordId/file',    servePatientFile)
router.get('/audit',                                         getAuditLogs)
router.get('/appointments',                                  getDoctorAppointments)
router.patch('/appointments/:id',                            updateDoctorAppointment)
router.get('/prescriptions',                                 getDoctorPrescriptions)
router.post('/prescriptions',                                createPrescription)
router.patch('/prescriptions/:id/status',                    updatePrescriptionStatus)
router.get('/analytics',                                     getDoctorAnalytics)

export default router
