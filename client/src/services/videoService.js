import api from './authService'

export const videoService = {
  getToken: (appointmentId) =>
    api.get(`/video/token?appointmentId=${appointmentId}`).then(r => r.data),
}
