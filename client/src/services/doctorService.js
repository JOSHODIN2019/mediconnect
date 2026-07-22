import api from './authService'
export { openFile } from './adminService'

export const doctorService = {
  getStats:          ()                    => api.get('/doctor/stats').then(r => ({ data: r.data.stats })),
  getPatients:       ()                    => api.get('/doctor/patients').then(r => ({ data: r.data.patients })),
  registerPatient:   (data)                => api.post('/doctor/patients/register', data).then(r => r.data),
  getPatientRecords: (patientId)           => api.get(`/doctor/patients/${patientId}/records`).then(r => ({ data: r.data })),
  uploadRecord:      (patientId, formData) => api.post(`/doctor/patients/${patientId}/records`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  getRecordFile:     (patientId, recordId) => `/doctor/patients/${patientId}/records/${recordId}/file`,
  getAuditLogs:      ()                    => api.get('/doctor/audit').then(r => ({ data: r.data.logs })),

  // Appointments
  getAppointments:        (status) => api.get('/doctor/appointments', { params: status ? { status } : {} }).then(r => r.data),
  updateAppointment:      (id, body) => api.patch(`/doctor/appointments/${id}`, body).then(r => r.data),

  // Prescriptions
  getPrescriptions:        (params)  => api.get('/doctor/prescriptions', { params }).then(r => r.data),
  createPrescription:      (data)    => api.post('/doctor/prescriptions', data).then(r => r.data),
  updatePrescriptionStatus:(id, status) => api.patch(`/doctor/prescriptions/${id}/status`, { status }).then(r => r.data),
}
