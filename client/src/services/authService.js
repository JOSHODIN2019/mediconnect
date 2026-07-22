import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mediconnect_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Registered by AuthContext so 401s call clearSession() without a full-page reload
let onUnauthorized = null
export function setUnauthorizedHandler(fn) { onUnauthorized = fn }

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || ''
      const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register')
      const isOnLogin   = window.location.pathname.startsWith('/login')
      if (!isAuthRoute && !isOnLogin) {
        localStorage.removeItem('mediconnect_token')
        localStorage.removeItem('mediconnect_user')
        onUnauthorized?.()   // triggers clearSession() → React re-renders → clean navigation
      }
    }
    return Promise.reject(err)
  }
)

export const authService = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login:    (data) => api.post('/auth/login',    data).then(r => r.data),
  getMe:    ()     => api.get('/auth/me').then(r => r.data),
}

export default api
