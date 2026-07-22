import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { patientService } from '@/services/patientService'
import { Spinner } from '@/components/ui'

const STAT_CARDS = [
  {
    key:   'upcomingAppointments',
    label: 'Upcoming Appointments',
    sub:   'Next 7 days',
    icon:  <CalendarIcon />,
    color: 'blue',
    href:  '/patient/appointments',
  },
  {
    key:   'completedConsultations',
    label: 'Consultations Done',
    sub:   'All time',
    icon:  <VideoIcon />,
    color: 'emerald',
    href:  '/patient/appointments',
  },
  {
    key:   'activePrescriptions',
    label: 'Active Prescriptions',
    sub:   'Current',
    icon:  <RxIcon />,
    color: 'orange',
    href:  '/patient/prescriptions',
  },
  {
    key:   'myDoctors',
    label: 'My Doctors',
    sub:   'With record access',
    icon:  <DoctorIcon />,
    color: 'purple',
    href:  '/patient/doctors',
  },
]

const COLOR = {
  blue:    { wrap: 'bg-blue-50 border-blue-100',       icon: 'bg-blue-100 text-blue-600',    num: 'text-blue-600'    },
  emerald: { wrap: 'bg-emerald-50 border-emerald-100', icon: 'bg-emerald-100 text-emerald-600', num: 'text-emerald-600' },
  orange:  { wrap: 'bg-orange-50 border-orange-100',   icon: 'bg-orange-100 text-orange-600',  num: 'text-orange-600'  },
  purple:  { wrap: 'bg-purple-50 border-purple-100',   icon: 'bg-purple-100 text-purple-600',  num: 'text-purple-600'  },
}

const QUICK_ACTIONS = [
  { to: '/patient/book',          label: 'Book a Consultation', desc: 'Schedule with a doctor',          icon: <QABookIcon />,   primary: true  },
  { to: '/patient/doctors',       label: 'Find a Doctor',       desc: 'Browse available specialists',    icon: <QASearchIcon />, primary: false },
  { to: '/patient/records',       label: 'My Medical Records',  desc: 'Access your health history',      icon: <QARecordIcon />, primary: false },
  { to: '/patient/prescriptions', label: 'Prescriptions',       desc: 'View and download prescriptions', icon: <QARxIcon />,     primary: false },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PatientDashboard() {
  const { user }    = useAuth()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const firstName = user?.fullName?.split(' ')[0] || 'Patient'

  useEffect(() => {
    patientService.getDashboardStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats({ upcomingAppointments: 0, completedConsultations: 0, activePrescriptions: 0, myDoctors: 0 }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="px-6 py-8 space-y-8 max-w-6xl mx-auto">

      {/* ── WELCOME BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl px-8 py-7 shadow-lg">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 right-12 w-48 h-48 rounded-full bg-white/5" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-blue-200 text-xs font-medium">{formatDate()}</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {greeting()}, {firstName}!
            </h1>
            <p className="text-blue-200 text-sm mt-1.5 max-w-sm">
              {user?.lga
                ? `Serving you from ${user.lga}, Edo State.`
                : 'Quality healthcare at your fingertips.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ID: {user?.userId}
              </span>
              {user?.lga && (
                <span className="flex items-center gap-1 text-xs text-blue-100">
                  <PinIcon />
                  {user.lga}
                </span>
              )}
            </div>
          </div>
          <Link
            to="/patient/book"
            className="self-start sm:self-center flex items-center gap-2 whitespace-nowrap bg-white text-blue-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow"
          >
            <CalendarIcon size={14} />
            Book Consultation
          </Link>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, sub, icon, color, href }) => {
          const c   = COLOR[color]
          const val = stats?.[key] ?? 0
          return (
            <Link
              key={key}
              to={href}
              className={`group bg-white border rounded-2xl p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${c.wrap}`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
                  {icon}
                </div>
                <ArrowIcon />
              </div>
              <div className="mt-4">
                {loading
                  ? <div className="h-7 w-10 bg-neutral-100 rounded animate-pulse" />
                  : <p className={`text-2xl font-bold ${c.num}`}>{val}</p>
                }
                <p className="text-sm font-medium text-neutral-700 mt-0.5">{label}</p>
                <p className="text-xs text-neutral-400">{sub}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── TWO COLUMN CONTENT ── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Upcoming Appointments — wide column */}
        <div className="lg:col-span-3 bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <CalendarIcon size={14} />
              </div>
              <h2 className="font-semibold text-neutral-900 text-sm">Upcoming Appointments</h2>
            </div>
            <Link to="/patient/appointments" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : (stats?.upcomingAppointments ?? 0) === 0 ? (
            <div className="flex flex-col items-center text-center px-8 py-12">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <EmptyCalIcon />
              </div>
              <h3 className="font-semibold text-neutral-800 mb-1.5">No upcoming appointments</h3>
              <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
                Book a consultation with a licensed Nigerian doctor and get care without leaving your community.
              </p>
              <Link
                to="/patient/book"
                className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <CalendarIcon size={14} />
                Book Your First Consultation
              </Link>
            </div>
          ) : null}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Quick Actions */}
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900 text-sm">Quick Actions</h2>
            </div>
            <div className="p-3 space-y-1.5">
              {QUICK_ACTIONS.map(({ to, label, desc, icon, primary }) => (
                <Link
                  key={to}
                  to={to}
                  className={[
                    'flex items-center gap-3 p-3 rounded-xl transition-all duration-150 group',
                    primary ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-neutral-50',
                  ].join(' ')}
                >
                  <div className={[
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    primary ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200',
                  ].join(' ')}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${primary ? 'text-white' : 'text-neutral-800'}`}>{label}</p>
                    <p className={`text-xs truncate ${primary ? 'text-blue-200' : 'text-neutral-400'}`}>{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-4">
            <h2 className="font-semibold text-neutral-900 text-sm mb-3">Your Account</h2>
            <div className="space-y-2.5">
              <InfoRow label="Name"       value={user?.fullName} />
              <InfoRow label="Email"      value={user?.email} />
              <InfoRow label="Phone"      value={user?.phone || '—'} />
              <InfoRow label="LGA"        value={user?.lga || '—'} />
              <InfoRow label="State"      value={user?.state || 'Edo State'} />
              <InfoRow label="Patient ID" value={user?.userId} mono />
            </div>
            <div className="border-t border-neutral-100 mt-4 pt-3">
              <Link
                to="/patient/settings"
                className="block text-center text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Edit Profile & Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-neutral-400 flex-shrink-0">{label}</span>
      <span className={`text-neutral-700 truncate text-right ${mono ? 'font-mono text-[11px]' : ''}`}>{value || '—'}</span>
    </div>
  )
}

/* ── Icons ── */
function CalendarIcon({ size = 18, className = 'text-blue-600' }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/><path d="M1.5 7h13M5 1.5v2M11 1.5v2"/></svg>
}
function VideoIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-emerald-600"><rect x="1" y="4" width="11" height="10" rx="2"/><path d="M12 7l5-2.5v7L12 9V7z"/></svg>
}
function RxIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-orange-600"><path d="M5 2h8a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M7 7h1.5v3M7 8.5h3"/></svg>
}
function DoctorIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-purple-600"><circle cx="9" cy="6" r="3"/><path d="M3 16c0-3 2.5-5 6-5s6 2 6 5"/><path d="M7 11h4M9 9v4"/></svg>
}
function ArrowIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-neutral-300 group-hover:text-neutral-400 transition-colors"><path d="M3 7h8M8 4l3 3-3 3"/></svg>
}
function PinIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#bfdbfe" strokeWidth="1.3" strokeLinecap="round"><path d="M5.5 1a3 3 0 013 3c0 2.5-3 6-3 6S2.5 6.5 2.5 4a3 3 0 013-3z"/><circle cx="5.5" cy="4" r="1"/></svg>
}
function EmptyCalIcon() {
  return <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="24" height="22" rx="3"/><path d="M2 12h24M8 2v4M20 2v4M8 18h4M16 18h4M8 22h4"/></svg>
}
function QABookIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="1.5" width="12" height="12" rx="2"/><path d="M1.5 6h12M5 1.5V6M10 1.5V6M5 9.5h5"/></svg>
}
function QASearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M9.5 9.5L13 13"/></svg>
}
function QARecordIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 1H3.5a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 003.5 14h8a1.5 1.5 0 001.5-1.5V4.5L9 1z"/><path d="M9 1V5h3.5M5 8h5M5 11h3"/></svg>
}
function QARxIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 1h7a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z"/><path d="M6 5h1v3M6 6.5h2.5"/></svg>
}
