import { Router } from 'express'
import { protect, requireRole } from '../middleware/auth.js'
import {
  getStats, getDoctors, registerDoctor, updateDoctor, deleteDoctor,
  getPatients, getAuditLogs,
  getRecords, verifyRecord, deleteRecord, serveRecordFile,
  getAnalytics, getAllAppointments,
} from '../controllers/adminController.js'
import { getAllPrescriptions } from '../controllers/prescriptionController.js'

const router = Router()
router.use(protect, requireRole('admin'))

router.get('/stats',            getStats)
router.get('/doctors',          getDoctors)
router.post('/doctors',         registerDoctor)
router.patch('/doctors/:id',    updateDoctor)
router.delete('/doctors/:id',   deleteDoctor)
router.get('/patients',         getPatients)
router.get('/records',          getRecords)
router.get('/records/:id/file', serveRecordFile)
router.patch('/records/:id/verify', verifyRecord)
router.delete('/records/:id',   deleteRecord)
router.get('/audit',            getAuditLogs)
router.get('/appointments',     getAllAppointments)
router.get('/prescriptions',    getAllPrescriptions)
router.get('/analytics',        getAnalytics)

export default router
