import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { doctorService } from '@/services/doctorService'
import api from '@/services/authService'
import { Spinner, Alert, Avatar } from '@/components/ui'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function calcAge(dob) {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

export default function DoctorDashboard() {
  const { user }  = useAuth()
  const [stats,    setStats]    = useState(null)
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    Promise.all([
      doctorService.getStats(),
      doctorService.getPatients(),
      api.get('/doctor/analytics'),
    ])
      .then(([s, p, a]) => {
        setStats(s.data)
        setPatients((p.data || []).slice(0, 5))
        setAnalytics(a.data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" color="blue" /></div>

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {error && <Alert variant="danger" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 flex items-center justify-between">
        <div>
          <p className="text-emerald-100 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold mt-0.5">{user?.fullName}</h1>
          <p className="text-emerald-200 text-xs mt-1">{user?.specialization} · {user?.hospital}</p>
        </div>
        <div className="hidden sm:block">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <DoctorHeroIcon />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Patients"      value={stats?.activePatients ?? 0}       sub="granted you access" icon={<PatIcon />}   color="emerald" linkTo="/doctor/patients" />
        <StatCard label="Upcoming Appts"       value={stats?.upcomingAppointments ?? 0} sub="pending & confirmed" icon={<CalIcon />}   color="blue"    linkTo="/doctor/appointments" />
        <StatCard label="Prescriptions Issued" value={stats?.totalPrescriptions ?? 0}   sub="all time"           icon={<RxIcon />}    color="orange"  linkTo="/doctor/prescriptions" />
        <StatCard label="Audit Events"         value={stats?.auditEvents ?? 0}           sub="all activity"       icon={<ClockIcon />} color="purple"  linkTo="/doctor/audit" />
      </div>

      {/* Analytics mini-section */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Completion rate + growth */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-neutral-800">Performance</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-neutral-400">Completion Rate</p>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">{analytics.stats?.completionRate ?? 0}%</p>
                <div className="mt-1.5 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analytics.stats?.completionRate ?? 0}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400">This Month</p>
                <p className="text-lg font-bold text-neutral-900 tabular-nums">{analytics.stats?.thisMonthAppts ?? 0}</p>
                {analytics.stats?.growthRate !== undefined && (
                  <p className={`text-xs font-semibold ${analytics.stats.growthRate >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {analytics.stats.growthRate >= 0 ? '+' : ''}{analytics.stats.growthRate}% vs last mo.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sparkline trend */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <p className="text-sm font-semibold text-neutral-800 mb-1">Appointment Trend</p>
            <p className="text-xs text-neutral-400 mb-3">Last 14 days</p>
            <Sparkline data={analytics.trend || []} color="#059669" />
          </div>

          {/* Consult type breakdown */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <p className="text-sm font-semibold text-neutral-800 mb-3">Consult Types</p>
            <div className="space-y-2">
              {(analytics.consultTypes || []).map((ct, i) => {
                const total = (analytics.consultTypes || []).reduce((s, x) => s + x.count, 0) || 1
                const pct   = Math.round((ct.count / total) * 100)
                const colors = { video: '#6366f1', phone: '#f59e0b', 'in-person': '#10b981' }
                const color  = colors[ct._id] || '#94a3b8'
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs text-neutral-600 capitalize flex-1">{ct._id || 'Other'}</span>
                    <div className="w-20 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-xs font-semibold text-neutral-700 w-6 text-right tabular-nums">{ct.count}</span>
                  </div>
                )
              })}
              {(!analytics.consultTypes || analytics.consultTypes.length === 0) && (
                <p className="text-xs text-neutral-300">No data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent patients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-neutral-900">My Patients</h2>
          <Link to="/doctor/patients" className="text-xs text-emerald-600 hover:underline font-medium">View all →</Link>
        </div>
        {patients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center">
            <p className="text-neutral-400 font-medium">No patients have granted you access yet.</p>
            <p className="text-sm text-neutral-300 mt-1">Patients can grant access from their portal.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map(p => (
              <Link key={p._id} to={`/doctor/patients/${p._id}`} className="flex items-center gap-4 bg-white rounded-xl border border-neutral-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all">
                <Avatar name={p.fullName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-neutral-900">{p.fullName}</p>
                  <p className="text-xs text-neutral-400 font-mono">{p.userId}</p>
                  {p.dateOfBirth && <p className="text-xs text-neutral-400">{calcAge(p.dateOfBirth)} yrs old</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                    {p.recordCount} record{p.recordCount !== 1 ? 's' : ''}
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-1">Since {fmtDate(p.grantedAt)}</p>
                </div>
                <ChevronIcon />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-neutral-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/doctor/appointments" className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-neutral-200 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><CalIcon /></div>
            <div><p className="font-medium text-sm text-neutral-900">Appointments</p><p className="text-xs text-neutral-500">Manage consultations</p></div>
          </Link>
          <Link to="/doctor/prescriptions" className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-neutral-200 hover:border-orange-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600"><RxIcon /></div>
            <div><p className="font-medium text-sm text-neutral-900">Prescriptions</p><p className="text-xs text-neutral-500">Issue & manage Rx</p></div>
          </Link>
          <Link to="/doctor/patients" className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-neutral-200 hover:border-emerald-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><PatIcon /></div>
            <div><p className="font-medium text-sm text-neutral-900">My Patients</p><p className="text-xs text-neutral-500">Browse patient records</p></div>
          </Link>
          <Link to="/doctor/audit" className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-neutral-200 hover:border-purple-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><ClockIcon /></div>
            <div><p className="font-medium text-sm text-neutral-900">Activity Log</p><p className="text-xs text-neutral-500">View recent actions</p></div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function CalIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="2.5" width="15" height="14" rx="2"/><path d="M1.5 8h15M6 1.5v2M12 1.5v2"/></svg> }
function RxIcon()  { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 2h8a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M7 7h1.5v3M7 8.5h3"/></svg> }

function StatCard({ label, value, sub, icon, color, linkTo, className = '' }) {
  const cm = { emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600', orange: 'bg-orange-50 text-orange-600' }
  return (
    <Link to={linkTo} className={`bg-white rounded-2xl border border-neutral-200 p-5 hover:border-emerald-200 hover:shadow-sm transition-all ${className}`}>
      <div className={`w-10 h-10 rounded-xl ${cm[color]} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-sm font-medium text-neutral-700 mt-0.5">{label}</p>
      <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
    </Link>
  )
}

function DoctorHeroIcon() { return <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M10 6C10 6 6 6 6 11C6 16 10 16 10 21C10 24 12 26 15 26C18 26 20 24 20 21V28" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><circle cx="20" cy="24" r="3" stroke="white" strokeWidth="1.8"/></svg> }
function PatIcon()   { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="6" r="3"/><path d="M1 16c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="14" cy="6" r="2"/><path d="M17 16c0-2-1.2-3.5-3-4"/></svg> }
function EyeIcon()   { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/><circle cx="9" cy="9" r="2.5"/></svg> }
function ClockIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="7.5"/><path d="M9 5.5v4l2.5 1.5"/></svg> }
function ChevronIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="flex-shrink-0 text-neutral-400"><path d="M5 3l4 4-4 4"/></svg> }

function Sparkline({ data, color }) {
  if (!data?.length) return <p className="text-xs text-neutral-300 text-center py-4">No data</p>
  const W = 300, H = 60
  const vals = data.map(d => d.value)
  const max  = Math.max(...vals, 1)
  const toX  = (i) => (i / Math.max(data.length - 1, 1)) * W
  const toY  = (v) => H - (v / max) * H * 0.85 - 4
  const pts  = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')
  const area = [`M ${toX(0)},${H}`, ...data.map((d, i) => `L ${toX(i)},${toY(d.value)}`), `L ${toX(data.length - 1)},${H}`, 'Z'].join(' ')
  const peak = vals.indexOf(Math.max(...vals))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <path d={area} fill={color} opacity="0.1" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {vals[peak] > 0 && <circle cx={toX(peak)} cy={toY(vals[peak])} r="3.5" fill="white" stroke={color} strokeWidth="1.5" />}
    </svg>
  )
}
