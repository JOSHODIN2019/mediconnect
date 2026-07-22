import api from './authService'
export { openFile } from './adminService'

export const patientService = {
  getDashboardStats: ()           => api.get('/patient/dashboard').then(r => ({ data: r.data.stats })),
  getStats:          ()           => api.get('/patient/stats').then(r => ({ data: r.data.stats })),
  getRecords:        ()           => api.get('/patient/records').then(r => ({ data: r.data.records })),
  uploadRecord:      (formData)   => api.post('/patient/records', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  getRecordFile:     (id)         => `/patient/records/${id}/file`,
  getDoctors:        ()           => api.get('/patient/doctors').then(r => ({
    data: (r.data.doctors || []).map(d => ({
      ...d,
      hasAccess: d.grant?.isActive === true,
      grantedAt: d.grant?.grantedAt || null,
    }))
  })),
  grantAccess:       (doctorId)   => api.post(`/patient/access/${doctorId}`).then(r => r.data),
  revokeAccess:      (doctorId)   => api.delete(`/patient/access/${doctorId}`).then(r => r.data),
  getAuditLogs:      ()           => api.get('/patient/audit').then(r => ({ data: r.data.logs })),

  // Appointments
  getAvailableSlots:      (doctorId, date) => api.get('/patient/appointments/slots', { params: { doctorId, date } }).then(r => r.data),
  bookAppointment:        (data)           => api.post('/patient/appointments', data).then(r => r.data),
  getAppointments:        (status)         => api.get('/patient/appointments', { params: status ? { status } : {} }).then(r => r.data),
  cancelAppointment:      (id, reason)     => api.delete(`/patient/appointments/${id}`, { data: { reason } }).then(r => r.data),
  rescheduleAppointment:  (id, date, timeSlot) => api.patch(`/patient/appointments/${id}`, { date, timeSlot }).then(r => r.data),

  // Prescriptions
  getPrescriptions: (status) => api.get('/patient/prescriptions', { params: status ? { status } : {} }).then(r => r.data),
}
