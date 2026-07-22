import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Badge } from '@/components/ui'
import NotificationBell from '@/components/ui/NotificationBell'

const NAV = [
  { to: '/admin',                  label: 'Dashboard',     icon: DashIcon,        end: true },
  { to: '/admin/doctors',          label: 'Doctors',       icon: DoctorIcon                },
  { to: '/admin/patients',         label: 'Patients',      icon: PatientIcon               },
  { to: '/admin/appointments',     label: 'Appointments',  icon: CalIcon                   },
  { to: '/admin/prescriptions',    label: 'Prescriptions', icon: RxIcon                    },
  { to: '/admin/records',          label: 'Records',       icon: RecordsIcon               },
  { to: '/admin/analytics',        label: 'Analytics',     icon: AnalyticsIcon             },
  { to: '/admin/audit',            label: 'Audit Log',     icon: AuditIcon                 },
  { to: '/admin/settings',         label: 'Settings',      icon: SettingsIcon              },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate          = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login/admin') }

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={[
        'fixed top-0 left-0 z-30 h-full w-60 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-300 ease-out',
        'lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <ShieldIcon />
            </div>
            <div>
              <p className="font-bold text-neutral-900 text-sm leading-none">
                Medi<span className="text-blue-600">Connect</span>
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest px-3 pb-2">
            Main Menu
          </p>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => [
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgb(37,99,235,0.35)]'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              ].join(' ')}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User card + logout */}
        <div className="px-3 pb-4 border-t border-neutral-100 pt-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50">
            <Avatar name={user?.fullName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-900 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-neutral-400 truncate">{user?.email}</p>
            </div>
            <Badge variant="purple" size="sm">Admin</Badge>
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

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 flex-shrink-0">
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100"
            onClick={() => setSidebarOpen(v => !v)}
          >
            <BurgerIcon />
          </button>
          <div className="flex items-center gap-2 lg:gap-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-neutral-500 font-medium">MediConnect Active</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-600">
              <Avatar name={user?.fullName} size="xs" />
              <span className="font-medium">{user?.fullName?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/* ── Icons ── */
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L2 3v4c0 3 2 4.5 5 6 3-1.5 5-3 5-6V3L7 1z" fill="white" fillOpacity="0.9"/>
      <path d="M4.5 7l2 2L10 5.5" stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function DashIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5"/>
    </svg>
  )
}
function DoctorIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="5" r="2.5"/>
      <path d="M3 14c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/>
      <path d="M6 10h4M8 8.5v4"/>
    </svg>
  )
}
function PatientIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="5" r="2.5"/>
      <path d="M3 14c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/>
    </svg>
  )
}
function RecordsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M10 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V5l-3.5-3.5z"/>
      <path d="M10 1.5V5H13.5M5.5 8.5h5M5.5 11h3"/>
      <path d="M7.5 8.5L9 10l2-2" strokeWidth="1.3"/>
    </svg>
  )
}
function AuditIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M10 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V5l-3.5-3.5z"/>
      <path d="M10 1.5V5H13.5M5.5 8.5h5M5.5 11h3"/>
    </svg>
  )
}
function AnalyticsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 14.5h13"/>
      <path d="M3 10.5V14M6 7V14M9 9.5V14M12 5V14"/>
      <path d="M2.5 6.5l3-3 3 2.5 4-4.5"/>
    </svg>
  )
}
function CalIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/><path d="M1.5 7h13M5 1.5v2M11 1.5v2"/></svg>
}
function RxIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4.5 2h7a1 1 0 011 1v10a1 1 0 01-1 1h-7a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M6 6h1.5v3M6 7.5h2.5M9 11l2 2"/></svg>
}
function ChainIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6.5 9.5l-1 1a2.5 2.5 0 003.54 3.54l2.5-2.5a2.5 2.5 0 000-3.54l-.75-.75"/>
      <path d="M9.5 6.5l1-1a2.5 2.5 0 00-3.54-3.54l-2.5 2.5a2.5 2.5 0 000 3.54l.75.75"/>
    </svg>
  )
}
function LogoutIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10.5 11l3-3-3-3M13.5 8H6"/>
    </svg>
  )
}
function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 5h14M2 9h14M2 13h14"/>
    </svg>
  )
}
function SettingsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="2"/>
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"/>
    </svg>
  )
}
