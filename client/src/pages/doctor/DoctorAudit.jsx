import { useEffect, useState } from 'react'
import { doctorService } from '@/services/doctorService'
import { Badge, Spinner, Alert } from '@/components/ui'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ACTION_CFG = {
  USER_LOGIN:      { label: 'Login',           color: 'info',    icon: '🔐' },
  USER_LOGOUT:     { label: 'Logout',          color: 'default', icon: '🚪' },
  RECORD_VIEWED:   { label: 'Record Viewed',   color: 'info',    icon: '👁' },
  ACCESS_GRANTED:  { label: 'Access Granted',  color: 'success', icon: '✅' },
  ACCESS_REVOKED:  { label: 'Access Revoked',  color: 'warning', icon: '🚫' },
  USER_REGISTERED: { label: 'Registered',      color: 'success', icon: '👤' },
}

export default function DoctorAudit() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    doctorService.getAuditLogs()
      .then(r => setLogs(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" color="blue" /></div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Activity Log</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Immutable record of all actions on your account.
        </p>
      </div>

      {error && <Alert variant="danger" onDismiss={() => setError(null)}>{error}</Alert>}

      {logs.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <ClockBigIcon className="mx-auto mb-3 text-neutral-300 w-10 h-10" />
          <p className="font-medium">No activity yet</p>
          <p className="text-sm mt-1">Actions will appear here.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-200" />
          <div className="space-y-3 pl-10">
            {logs.map((log, i) => {
              const cfg = ACTION_CFG[log.action] || { label: log.action, color: 'default', icon: '•' }
              const dotCm = { success: 'bg-emerald-100', info: 'bg-blue-100', warning: 'bg-yellow-100', danger: 'bg-red-100', default: 'bg-neutral-100' }
              return (
                <div key={log._id || i} className="relative">
                  <div className={`absolute -left-[2.15rem] w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] ${dotCm[cfg.color] || dotCm.default}`}>
                    {cfg.icon}
                  </div>
                  <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={cfg.color === 'info' ? 'info' : cfg.color === 'success' ? 'success' : cfg.color === 'warning' ? 'warning' : cfg.color === 'danger' ? 'danger' : 'default'} size="sm">{cfg.label}</Badge>
                          {log.status === 'failure' && <Badge variant="danger" size="sm">Failed</Badge>}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-xs text-neutral-500 mt-1.5">
                            {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 flex-shrink-0">{fmtDate(log.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-400 text-center pt-2">
        Showing latest {logs.length} events
      </p>
    </div>
  )
}

function ClockBigIcon({ className }) {
  return <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="20" cy="20" r="16"/><path d="M20 12v9l5 3"/></svg>
}
