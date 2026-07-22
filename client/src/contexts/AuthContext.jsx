import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService, setUnauthorizedHandler } from '@/services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(() => {
    try { return JSON.parse(localStorage.getItem('mediconnect_user')) } catch { return null }
  })
  const [token,     setToken]     = useState(() => localStorage.getItem('mediconnect_token') || null)
  const [isLoading, setIsLoading] = useState(false)

  // true once the initial getMe() check has completed (success or failure)
  // Prevents route guards from redirecting before we know the real auth state
  const [isAuthReady, setIsAuthReady] = useState(!localStorage.getItem('mediconnect_token'))

  const isAuthenticated = !!token && !!user

  const saveSession = useCallback((token, user) => {
    localStorage.setItem('mediconnect_token', token)
    localStorage.setItem('mediconnect_user',  JSON.stringify(user))
    setToken(token)
    setUser(user)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem('mediconnect_token')
    localStorage.removeItem('mediconnect_user')
    setToken(null)
    setUser(null)
  }, [])

  const login = async (credentials) => {
    setIsLoading(true)
    try {
      const data = await authService.login(credentials)
      saveSession(data.token, data.user)
      return { success: true, user: data.user }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (formData) => {
    setIsLoading(true)
    try {
      const data = await authService.register(formData)
      saveSession(data.token, data.user)
      return { success: true, user: data.user }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.getMe()
      setUser(data.user)
      localStorage.setItem('mediconnect_user', JSON.stringify(data.user))
    } catch { /* ignore */ }
  }, [])

  // Register the 401 handler so the axios interceptor can trigger clearSession()
  // without a full-page reload
  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  // On mount: verify the stored token is still valid.
  // We race getMe() against an 8-second timeout so Render cold starts
  // (which can take 30-60 s) don't make the spinner block the UI indefinitely
  // or reset the session. On timeout we keep the localStorage session as-is.
  useEffect(() => {
    if (!token) {
      setIsAuthReady(true)
      return
    }
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject({ _timeout: true }), 8000)
    )
    Promise.race([authService.getMe(), timeout])
      .then(data => {
        setUser(data.user)
        localStorage.setItem('mediconnect_user', JSON.stringify(data.user))
      })
      .catch((err) => {
        if (err._timeout) return // server slow / cold start — keep localStorage session
        if (err.response?.status === 401) clearSession()
      })
      .finally(() => setIsAuthReady(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated, isAuthReady, isLoading,
      login, register, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
