import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { SocketProvider } from '@/contexts/SocketContext'

// ── Eager: always-needed shell pages ────────────────────────────────────────
import Landing  from '@/pages/Landing'
import Login    from '@/pages/Login'
import Register from '@/pages/Register'

// ── Lazy: role-specific pages loaded on demand ───────────────────────────────
const DesignSystem   = lazy(() => import('@/pages/DesignSystem'))
const Settings       = lazy(() => import('@/pages/Settings'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const VideoRoom      = lazy(() => import('@/pages/VideoRoom'))

const AdminLayout       = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminDashboard    = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminDoctors      = lazy(() => import('@/pages/admin/AdminDoctors'))
const AdminPatients     = lazy(() => import('@/pages/admin/AdminPatients'))
const AdminAudit        = lazy(() => import('@/pages/admin/AdminAudit'))
const AdminRecords      = lazy(() => import('@/pages/admin/AdminRecords'))
const AdminAnalytics    = lazy(() => import('@/pages/admin/AdminAnalytics'))
const AdminAppointments  = lazy(() => import('@/pages/admin/AdminAppointments'))
const AdminPrescriptions = lazy(() => import('@/pages/admin/AdminPrescriptions'))

const PatientLayout       = lazy(() => import('@/pages/patient/PatientLayout'))
const PatientDashboard    = lazy(() => import('@/pages/patient/PatientDashboard'))
const PatientRecords      = lazy(() => import('@/pages/patient/PatientRecords'))
const PatientDoctors      = lazy(() => import('@/pages/patient/PatientDoctors'))
const PatientAppointments = lazy(() => import('@/pages/patient/PatientAppointments'))
const PatientBook         = lazy(() => import('@/pages/patient/PatientBook'))
const PatientPrescriptions = lazy(() => import('@/pages/patient/PatientPrescriptions'))
const PatientSettings      = lazy(() => import('@/pages/patient/PatientSettings'))
const PatientChat          = lazy(() => import('@/pages/patient/PatientChat'))

const DoctorLayout         = lazy(() => import('@/pages/doctor/DoctorLayout'))
const DoctorDashboard      = lazy(() => import('@/pages/doctor/DoctorDashboard'))
const DoctorAppointments   = lazy(() => import('@/pages/doctor/DoctorAppointments'))
const DoctorPrescriptions  = lazy(() => import('@/pages/doctor/DoctorPrescriptions'))
const DoctorPatients       = lazy(() => import('@/pages/doctor/DoctorPatients'))
const DoctorPatientRecords = lazy(() => import('@/pages/doctor/DoctorPatientRecords'))
const DoctorAudit          = lazy(() => import('@/pages/doctor/DoctorAudit'))
const DoctorChat           = lazy(() => import('@/pages/doctor/DoctorChat'))

// ── Loading fallback ──────────────────────────────────────────────────────────
function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    </div>
  )
}

// ── Route guards ─────────────────────────────────────────────────────────────

// GuestRoute: role = the portal this login page belongs to.
// Only redirect to dashboard when the logged-in user's role matches this portal.
// If a doctor visits /login/patient they see the patient login (to switch accounts).
function GuestRoute({ children, role }) {
  const { isAuthenticated, isAuthReady, user } = useAuth()
  if (!isAuthReady) return <PageSpinner />
  if (isAuthenticated && user?.role === role) {
    const routes = { patient: '/patient', doctor: '/doctor', admin: '/admin' }
    return <Navigate to={routes[role] || '/'} replace />
  }
  return children
}

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, isAuthReady, user } = useAuth()
  // Wait for the initial getMe() check before making any routing decision.
  // Without this, a page refresh briefly shows as unauthenticated before the
  // token is verified, causing a redirect flash to the login page.
  if (!isAuthReady) return <PageSpinner />
  if (!isAuthenticated) {
    const loginRoutes = { patient: '/login/patient', doctor: '/login/doctor', admin: '/login/admin' }
    return <Navigate to={role ? (loginRoutes[role] || '/login/patient') : '/login/patient'} replace />
  }
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}

// ── Route tree ────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/"       element={<Landing />} />
        <Route path="/design" element={<DesignSystem />} />

        {/* Auth */}
        <Route path="/login/patient" element={<GuestRoute role="patient"><Login role="patient" /></GuestRoute>} />
        <Route path="/login/doctor"  element={<GuestRoute role="doctor"><Login role="doctor"   /></GuestRoute>} />
        <Route path="/login/admin"   element={<GuestRoute role="admin"><Login role="admin"     /></GuestRoute>} />
        <Route path="/login"         element={<Navigate to="/login/patient" replace />} />
        <Route path="/register"      element={<GuestRoute role="patient"><Register /></GuestRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index           element={<AdminDashboard />} />
          <Route path="doctors"  element={<AdminDoctors />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="appointments"  element={<AdminAppointments />} />
          <Route path="prescriptions" element={<AdminPrescriptions />} />
          <Route path="records"       element={<AdminRecords />} />
          <Route path="analytics"     element={<AdminAnalytics />} />
          <Route path="audit"      element={<AdminAudit />} />
          <Route path="settings"   element={<Settings />} />
        </Route>

        {/* Patient */}
        <Route path="/patient" element={<ProtectedRoute role="patient"><PatientLayout /></ProtectedRoute>}>
          <Route index                   element={<PatientDashboard />} />
          <Route path="book"             element={<PatientBook />} />
          <Route path="appointments"     element={<PatientAppointments />} />
          <Route path="doctors"          element={<PatientDoctors />} />
          <Route path="prescriptions"    element={<PatientPrescriptions />} />
          <Route path="records"          element={<PatientRecords />} />
          <Route path="chat"             element={<PatientChat />} />
          <Route path="chat/:partnerId"  element={<PatientChat />} />
          <Route path="notifications"    element={<NotificationsPage />} />
          <Route path="settings"         element={<PatientSettings />} />
        </Route>

        {/* Doctor */}
        <Route path="/doctor" element={<ProtectedRoute role="doctor"><DoctorLayout /></ProtectedRoute>}>
          <Route index                      element={<DoctorDashboard />} />
          <Route path="appointments"        element={<DoctorAppointments />} />
          <Route path="prescriptions"       element={<DoctorPrescriptions />} />
          <Route path="chat"                element={<DoctorChat />} />
          <Route path="chat/:partnerId"     element={<DoctorChat />} />
          <Route path="notifications"       element={<NotificationsPage />} />
          <Route path="patients"            element={<DoctorPatients />} />
          <Route path="patients/:patientId" element={<DoctorPatientRecords />} />
          <Route path="audit"               element={<DoctorAudit />} />
          <Route path="settings"            element={<Settings />} />
        </Route>

        {/* Video — full screen, no layout wrapper */}
        <Route path="/video/:appointmentId" element={
          <ProtectedRoute>
            <VideoRoom />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
