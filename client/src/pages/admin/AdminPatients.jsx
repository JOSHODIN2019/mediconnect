import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { Avatar, Badge, StatusBadge, RoleBadge, Spinner, Alert, Card, CardBody, Input } from '@/components/ui'

export default function AdminPatients() {
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    adminService.getPatients()
      .then(d => setPatients(d.patients))
      .catch(() => setError('Could not load patients — start the backend server.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p =>
    `${p.fullName} ${p.email} ${p.userId} ${p.phone}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Manage Patients</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{patients.length} registered patient{patients.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      <div className="max-w-sm">
        <Input placeholder="Search by name, email, ID…" value={search} onChange={e => setSearch(e.target.value)} icon={SearchIcon} />
      </div>

      <Card>
        <CardBody padded={false}>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5"/></svg>
              </div>
              <p className="text-sm font-medium text-neutral-600">No patients found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {['Patient', 'Patient ID', 'Phone', 'Date of Birth', 'Status'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.fullName} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">{p.fullName}</p>
                            <p className="text-xs text-neutral-400">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">{p.userId}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-neutral-600">{p.phone || '—'}</td>
                      <td className="px-5 py-4 text-sm text-neutral-500">
                        {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={p.isActive ? 'active' : 'inactive'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function SearchIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
}
