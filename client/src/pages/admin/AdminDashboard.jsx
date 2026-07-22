import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { Card, CardBody, Badge, StatusBadge, RoleBadge, Avatar, Spinner, Alert } from '@/components/ui'

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null)
  const [doctors,  setDoctors]  = useState([])
  const [patients, setPatients] = useState([])
  const [audit,    setAudit]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d, p, a] = await Promise.all([
          adminService.getStats(),
          adminService.getDoctors(),
          adminService.getPatients(),
          adminService.getAuditLogs({ limit: 6 }),
        ])
        setStats(s.stats)
        setDoctors(d.doctors.slice(0, 5))
        setPatients(p.patients.slice(0, 5))
        setAudit(a.logs)
      } catch {
        setError('Could not connect to the server. Start the backend with: cd server && npm run dev')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingState />

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Dashboard Overview</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Welcome back, Administrator — here's what's happening.</p>
      </div>

      {error && <Alert variant="warning" title="Server offline">{error}</Alert>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients',   value: stats?.totalPatients  ?? '—', icon: <PatientStatIcon />, color: 'bg-blue-50',   iconBg: 'bg-blue-100',   text: 'text-blue-600'   },
          { label: 'Total Doctors',    value: stats?.totalDoctors   ?? '—', icon: <DoctorStatIcon />,  color: 'bg-emerald-50',iconBg: 'bg-emerald-100',text: 'text-emerald-600'},
          { label: 'Pending Doctors',  value: stats?.pendingDoctors ?? '—', icon: <PendingIcon />,     color: 'bg-amber-50',  iconBg: 'bg-amber-100',  text: 'text-amber-600'  },
          { label: 'Audit Events',     value: stats?.totalAudit     ?? '—', icon: <AuditStatIcon />,   color: 'bg-purple-50', iconBg: 'bg-purple-100', text: 'text-purple-600' },
        ].map(({ label, value, icon, color, iconBg, text }) => (
          <div key={label} className={`${color} rounded-2xl p-5 border border-white`}>
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
              <span className={text}>{icon}</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            <p className="text-xs text-neutral-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent Doctors */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Recent Doctors</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Latest registered physicians</p>
              </div>
              <Link to="/admin/doctors" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
                View all →
              </Link>
            </div>
            <CardBody padded={false}>
              {doctors.length === 0 ? (
                <EmptyRow message="No doctors registered yet" />
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      {['Doctor', 'Specialty', 'Hospital', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doc) => (
                      <tr key={doc._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={doc.fullName} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{doc.fullName}</p>
                              <p className="text-xs text-neutral-400">{doc.userId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-neutral-600">{doc.specialization || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-neutral-500 max-w-[140px] truncate">{doc.hospital || '—'}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={doc.isVerified ? 'verified' : 'pending'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Recent Activity</h2>
              <Link to="/admin/audit" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
                View all →
              </Link>
            </div>
            <CardBody>
              {audit.length === 0 ? (
                <EmptyRow message="No events yet" />
              ) : (
                <div className="space-y-4">
                  {audit.map((log, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${categoryColor(log.category)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-800">{formatAction(log.action)}</p>
                        <p className="text-xs text-neutral-400 truncate">{log.userEmail}</p>
                        <p className="text-[10px] text-neutral-300 mt-0.5">{formatDate(log.createdAt)}</p>
                      </div>
                      <Badge variant={log.status === 'success' ? 'success' : 'danger'} size="sm">
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Recent Patients */}
      <Card>
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Recent Patients</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Latest registered patients</p>
          </div>
          <Link to="/admin/patients" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
            View all →
          </Link>
        </div>
        <CardBody padded={false}>
          {patients.length === 0 ? (
            <EmptyRow message="No patients registered yet" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  {['Patient', 'Patient ID', 'Phone', 'Role', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.fullName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{p.fullName}</p>
                          <p className="text-xs text-neutral-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded">{p.userId}</span></td>
                    <td className="px-5 py-3.5 text-sm text-neutral-500">{p.phone || '—'}</td>
                    <td className="px-5 py-3.5"><RoleBadge role={p.role} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

/* ── Helpers ── */
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Loading dashboard…</p>
      </div>
    </div>
  )
}
function EmptyRow({ message }) {
  return <p className="text-sm text-neutral-400 text-center py-8">{message}</p>
}
function categoryColor(cat) {
  return { auth: 'bg-blue-500', admin: 'bg-purple-500', record: 'bg-emerald-500', access: 'bg-amber-500' }[cat] ?? 'bg-neutral-400'
}
function formatAction(action) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/* ── Stat Icons ── */
function PatientStatIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="6" r="3"/><path d="M3 16c0-3 2.7-5 6-5s6 2 6 5"/></svg>
}
function DoctorStatIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="5.5" r="2.5"/><path d="M3 15c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5"/><path d="M7 11h4M9 9.5v4"/></svg>
}
function PendingIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l2.5 2.5"/></svg>
}
function AuditStatIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11.5 2H5a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 005 16h8a1.5 1.5 0 001.5-1.5V6L11.5 2z"/><path d="M11.5 2V6H15M6.5 9.5h5M6.5 12.5h3"/></svg>
}

