import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { Badge, Spinner, Alert, Card, CardBody } from '@/components/ui'

const CATEGORIES = ['all', 'auth', 'admin', 'record', 'access']

const ACTION_COLORS = {
  USER_REGISTERED:   'success',
  USER_LOGIN:        'primary',
  DOCTOR_REGISTERED: 'purple',
  DOCTOR_VERIFIED:   'success',
  DOCTOR_DEACTIVATED:'danger',
  DOCTOR_DELETED:    'danger',
  RECORD_UPLOADED:   'info',
  ACCESS_GRANTED:    'success',
  ACCESS_REVOKED:    'warning',
}

export default function AdminAudit() {
  const [logs,     setLogs]     = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [category, setCategory] = useState('all')

  const load = async (cat) => {
    setLoading(true)
    try {
      const params = cat !== 'all' ? { category: cat, limit: 100 } : { limit: 100 }
      const data = await adminService.getAuditLogs(params)
      setLogs(data.logs)
      setTotal(data.total)
    } catch {
      setError('Could not load audit logs — start the backend server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(category) }, [category])

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Audit Log</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{total} total system events recorded</p>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={[
              'px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all',
              category === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      <Card>
        <CardBody padded={false}>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"><path d="M11.5 2H5a1.5 1.5 0 00-1.5 1.5v15A1.5 1.5 0 005 18h10a1.5 1.5 0 001.5-1.5V6L11.5 2z"/><path d="M11.5 2V6H15"/></svg>
              </div>
              <p className="text-sm font-medium text-neutral-600">No audit events found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {['Timestamp', 'Action', 'Category', 'User', 'Role', 'Status'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log._id || i} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-medium text-neutral-700">{formatDate(log.createdAt)}</p>
                        <p className="text-[10px] text-neutral-400">{formatTime(log.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={ACTION_COLORS[log.action] || 'neutral'} size="sm">
                          {formatAction(log.action)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold capitalize px-2 py-1 rounded-lg ${categoryStyle(log.category)}`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-neutral-600 max-w-[160px] truncate">{log.userEmail || '—'}</td>
                      <td className="px-5 py-3.5">
                        {log.userRole
                          ? <span className="capitalize text-xs font-medium text-neutral-500">{log.userRole}</span>
                          : <span className="text-neutral-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold capitalize px-2 py-1 rounded-full
                          ${log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {log.status}
                        </span>
                      </td>
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

function formatAction(a) {
  return a?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? '—'
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}
function categoryStyle(cat) {
  return {
    auth:   'bg-blue-50 text-blue-700',
    admin:  'bg-purple-50 text-purple-700',
    record: 'bg-emerald-50 text-emerald-700',
    access: 'bg-amber-50 text-amber-700',
  }[cat] ?? 'bg-neutral-100 text-neutral-600'
}
