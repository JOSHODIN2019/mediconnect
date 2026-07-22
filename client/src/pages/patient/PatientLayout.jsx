import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { Avatar, Badge } from '@/components/ui'
import NotificationBell from '@/components/ui/NotificationBell'
import api from '@/services/authService'

const NAV = [
  { to: '/patient',               label: 'Dashboard',        icon: DashIcon,    end: true },
  { to: '/patient/book',          label: 'Book Appointment', icon: BookIcon              },
  { to: '/patient/appointments',  label: 'My Appointments',  icon: CalendarIcon          },
  { to: '/patient/doctors',       label: 'My Doctors',       icon: DoctorIcon            },
  { to: '/patient/prescriptions', label: 'Prescriptions',    icon: RxIcon                },
  { to: '/patient/records',       label: 'Medical Records',  icon: RecordIcon            },
  { to: '/patient/chat',           label: 'Messages',         icon: ChatIcon              },
  { to: '/patient/notifications', label: 'Notifications',    icon: BellNavIcon           },
  { to: '/patient/settings',      label: 'Settings',         icon: SettingsIcon          },
]

export default function PatientLayout() {
  const { user, logout }         = useAuth()
  const { chatUnread, socket }   = useSocket()
  const navigate                 = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifUnread, setNotifUnread] = useState(0)

  useEffect(() => {
    api.get('/notifications').then(r => setNotifUnread(r.data.unreadCount || 0)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!socket) return
    const refresh = () => api.get('/notifications').then(r => setNotifUnread(r.data.unreadCount || 0)).catch(() => {})
    socket.on('new_notification_count', refresh)
    return () => socket.off('new_notification_count', refresh)
  }, [socket])

  const handleLogout = () => { logout(); navigate('/login/patient') }

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={[
        'fixed top-0 left-0 z-30 h-full w-60 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-300',
        'lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-neutral-100">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <HeartIcon />
            </div>
            <div>
              <p className="font-bold text-neutral-900 text-sm">Medi<span className="text-blue-600">Connect</span></p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Patient Portal</p>
            </div>
          </Link>
        </div>

        {/* Patient quick-info */}
        <div className="mx-3 mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="flex items-center gap-2.5">
            <Avatar name={user?.fullName} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-900 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-neutral-500">{user?.lga || 'Edo State'}</p>
              <p className="text-[10px] font-mono text-blue-600">{user?.userId}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest px-3 pb-2">Menu</p>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => [
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgb(37,99,235,0.25)]'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              ].join(' ')}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {label === 'Messages' && chatUnread > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
              {label === 'Notifications' && notifUnread > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white/40">
                  {notifUnread > 9 ? '9+' : notifUnread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-neutral-100 pt-3 space-y-1">
          <div className="flex items-center px-3 py-1">
            <Badge variant="info" size="sm">Patient</Badge>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogoutIcon size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 flex-shrink-0">
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100"
            onClick={() => setSidebarOpen(v => !v)}
          >
            <BurgerIcon />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-neutral-500 font-medium">MediConnect Active</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2">
              <Avatar name={user?.fullName} size="xs" />
              <span className="text-sm font-medium text-neutral-700">{user?.fullName?.split(' ')[0]}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function HeartIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12C7 12 1.5 8.5 1.5 4.5a3 3 0 015.5-1.65A3 3 0 0112.5 4.5c0 4-5.5 7.5-5.5 7.5z" fill="white" fillOpacity="0.95"/></svg>
}
function DashIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>
}
function BookIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="1.5" width="13" height="13" rx="2"/><path d="M1.5 6.5h13M5.5 1.5v5M10.5 1.5v5M5.5 10h5"/></svg>
}
function CalendarIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/><path d="M1.5 7h13M5 1.5v2M11 1.5v2"/></svg>
}
function DoctorIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="2.5"/><path d="M3 14c0-2.5 2-4 5-4s5 1.5 5 4"/><path d="M6 9.5h4M8 7.5v4"/></svg>
}
function RxIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4.5 2h7a1 1 0 011 1v10a1 1 0 01-1 1h-7a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M6 6h1.5v3M6 7.5h2.5"/></svg>
}
function RecordIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V5L10 1.5z"/><path d="M10 1.5V5H13.5M5.5 8.5h5M5.5 11h3"/></svg>
}
function ChatIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h9l3 3V3a1 1 0 00-1-1z"/><path d="M4 6h8M4 9h5"/></svg>
}
function SettingsIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="2"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"/></svg>
}
function LogoutIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10.5 11l3-3-3-3M13.5 8H6"/></svg>
}
function BurgerIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 5h14M2 9h14M2 13h14"/></svg>
}
function BellNavIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 6A4 4 0 0 0 4 6c0 4.5-2 6-2 6h12s-2-1.5-2-6"/><path d="M9.15 14a2 2 0 0 1-2.3 0"/></svg>
}
