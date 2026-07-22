import { useState, useEffect, useCallback } from 'react'
import api from '@/services/authService'
import { Spinner, Avatar } from '@/components/ui'

const STATUS_TABS = [
  { key: 'all',       label: 'All'        },
  { key: 'active',    label: 'Active'     },
  { key: 'dispensed', label: 'Dispensed'  },
  { key: 'expired',   label: 'Expired'    },
]

const STATUS_STYLE = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  dispensed: 'bg-blue-50   text-blue-700   border-blue-200',
  expired:   'bg-neutral-100 text-neutral-500 border-neutral-200',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [total,         setTotal]         = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [status,        setStatus]        = useState('all')
  const [search,        setSearch]        = useState('')
  const [expanded,      setExpanded]      = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/prescriptions', {
        params: { status, limit: 100 },
      })
      setPrescriptions(res.data.prescriptions || [])
      setTotal(res.data.total || 0)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [status])

  useEffect(() => { load() }, [load])

  const visible = search.trim()
    ? prescriptions.filter(p => {
        const q = search.toLowerCase()
        return (
          p.patient?.fullName?.toLowerCase().includes(q) ||
          p.doctor?.fullName?.toLowerCase().includes(q) ||
          p.diagnosis?.toLowerCase().includes(q) ||
          p.patient?.userId?.toLowerCase().includes(q)
        )
      })
    : prescriptions

  const counts = {
    active:    prescriptions.filter(p => p.status === 'active').length,
    dispensed: prescriptions.filter(p => p.status === 'dispensed').length,
    expired:   prescriptions.filter(p => p.status === 'expired').length,
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Prescriptions</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {total} total prescription{total !== 1 ? 's' : ''} issued across the platform
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={[
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all',
              status === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300',
            ].join(' ')}
          >
            {tab.label}
            {tab.key !== 'all' && counts[tab.key] !== undefined && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                status === tab.key ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search patient, doctor, or diagnosis…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="md" /></div>
      ) : visible.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {visible.map(rx => {
            const isOpen = expanded === rx._id
            return (
              <div
                key={rx._id}
                className="bg-white border border-neutral-200 rounded-2xl overflow-hidden transition-all"
              >
                {/* Row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : rx._id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-4 px-5 py-4">

                    {/* Patient */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <Avatar name={rx.patient?.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{rx.patient?.fullName || '—'}</p>
                        <p className="text-[10px] font-mono text-neutral-400">{rx.patient?.userId}</p>
                      </div>
                    </div>

                    {/* Doctor */}
                    <div className="hidden sm:block flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-700 truncate">{rx.doctor?.fullName || '—'}</p>
                      <p className="text-xs text-blue-600 truncate">{rx.doctor?.specialization || ''}</p>
                    </div>

                    {/* Diagnosis */}
                    <div className="hidden md:block flex-1 min-w-0">
                      <p className="text-sm text-neutral-600 truncate">{rx.diagnosis || <span className="text-neutral-400 italic">No diagnosis</span>}</p>
                    </div>

                    {/* Meds count */}
                    <div className="flex-shrink-0 text-center hidden lg:block">
                      <p className="text-lg font-bold text-neutral-900">{rx.medications?.length ?? 0}</p>
                      <p className="text-[10px] text-neutral-400">Med{rx.medications?.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Date */}
                    <div className="flex-shrink-0 text-right hidden sm:block">
                      <p className="text-xs text-neutral-500">{fmtDate(rx.createdAt)}</p>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[rx.status] || 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                        {rx.status?.charAt(0).toUpperCase() + rx.status?.slice(1)}
                      </span>
                      <ChevronIcon open={isOpen} />
                    </div>
                  </div>
                </button>

                {/* Expanded medications */}
                {isOpen && (
                  <div className="border-t border-neutral-100 px-5 py-4 bg-neutral-50">
                    {rx.medications?.length > 0 ? (
                      <>
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Medications</p>
                        <div className="space-y-2">
                          {rx.medications.map((med, i) => (
                            <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-neutral-200 px-4 py-3">
                              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                                <PillIcon />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-neutral-900">{med.name}</p>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ')}
                                </p>
                                {med.instructions && (
                                  <p className="text-xs text-neutral-400 mt-0.5 italic">{med.instructions}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-neutral-400">No medications listed.</p>
                    )}
                    {rx.notes && (
                      <div className="mt-3 pt-3 border-t border-neutral-200">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Doctor Notes</p>
                        <p className="text-sm text-neutral-600">{rx.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          <p className="text-center text-xs text-neutral-400 pt-2">
            Showing {visible.length} of {total} prescription{total !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-8 py-16 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
        <RxEmptyIcon />
      </div>
      <h2 className="font-semibold text-neutral-800 mb-1.5">No prescriptions found</h2>
      <p className="text-sm text-neutral-500">Try adjusting your filters or search.</p>
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      className={`flex-shrink-0 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M3 5l4 4 4-4"/>
    </svg>
  )
}
function SearchIcon({ className }) {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
}
function PillIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#f97316" strokeWidth="1.4" strokeLinecap="round"><path d="M3 11L11 3M5.5 2.5L11.5 8.5a3 3 0 01-4.24 4.24L1.26 6.74A3 3 0 015.5 2.5z"/></svg>
}
function RxEmptyIcon() {
  return <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round"><path d="M5 3h12l4 4v16H5z"/><path d="M15 3v5h6M9 11h8M9 15h5"/></svg>
}
