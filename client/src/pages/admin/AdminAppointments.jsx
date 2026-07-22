import { useState, useEffect, useCallback } from 'react'
import api from '@/services/authService'
import { Spinner, Avatar } from '@/components/ui'

const STATUS_TABS = [
  { key: 'all',       label: 'All'       },
  { key: 'pending',   label: 'Pending'   },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const TYPE_LABELS = { video: 'Video', phone: 'Phone', 'in-person': 'In-Person' }

const STATUS_STYLE = {
  pending:   'bg-amber-50  text-amber-700  border-amber-200',
  confirmed: 'bg-blue-50   text-blue-700   border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50    text-red-600    border-red-200',
}

const TYPE_STYLE = {
  video:      'bg-indigo-50 text-indigo-700',
  phone:      'bg-orange-50 text-orange-700',
  'in-person':'bg-teal-50   text-teal-700',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(slot) {
  if (!slot) return ''
  const [h, m] = slot.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [counts,       setCounts]       = useState({})
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [pages,        setPages]        = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [status,       setStatus]       = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [search,       setSearch]       = useState('')

  const load = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/admin/appointments', {
        params: { status, type: typeFilter, page: pg, limit: 30 },
      })
      setAppointments(res.data.appointments || [])
      setCounts(res.data.counts || {})
      setTotal(res.data.total || 0)
      setPage(res.data.page || 1)
      setPages(res.data.pages || 1)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [status, typeFilter])

  useEffect(() => { load(1) }, [load])

  const visible = search.trim()
    ? appointments.filter(a => {
        const q = search.toLowerCase()
        return (
          a.patient?.fullName?.toLowerCase().includes(q) ||
          a.doctor?.fullName?.toLowerCase().includes(q) ||
          a.patient?.userId?.toLowerCase().includes(q) ||
          a.doctor?.userId?.toLowerCase().includes(q)
        )
      })
    : appointments

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Appointments</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {total} total appointment{total !== 1 ? 's' : ''} across all doctors
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setStatus(tab.key); setPage(1) }}
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

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient or doctor name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-neutral-700"
        >
          <option value="all">All Types</option>
          <option value="video">Video</option>
          <option value="phone">Phone</option>
          <option value="in-person">In-Person</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="md" /></div>
      ) : visible.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Patient</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Doctor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date & Time</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {visible.map(a => (
                    <tr key={a._id} className="hover:bg-neutral-50 transition-colors">
                      {/* Patient */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={a.patient?.fullName} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-900 truncate">{a.patient?.fullName || '—'}</p>
                            <p className="text-[10px] font-mono text-neutral-400">{a.patient?.userId}</p>
                          </div>
                        </div>
                      </td>
                      {/* Doctor */}
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 truncate">{a.doctor?.fullName || '—'}</p>
                          <p className="text-xs text-blue-600 truncate">{a.doctor?.specialization || ''}</p>
                        </div>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-neutral-900">{fmtDate(a.date)}</p>
                        <p className="text-xs text-neutral-400">{fmtTime(a.timeSlot)}</p>
                      </td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg ${TYPE_STYLE[a.consultationType] || 'bg-neutral-100 text-neutral-600'}`}>
                          <TypeIcon type={a.consultationType} />
                          {TYPE_LABELS[a.consultationType] || a.consultationType}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[a.status] || 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                          {a.status?.charAt(0).toUpperCase() + a.status?.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-neutral-500">
                Page {page} of {pages} · {total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= pages}
                  className="px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-8 py-16 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <CalIcon className="text-blue-400" />
      </div>
      <h2 className="font-semibold text-neutral-800 mb-1.5">No appointments found</h2>
      <p className="text-sm text-neutral-500">Try adjusting your filters.</p>
    </div>
  )
}

function TypeIcon({ type }) {
  if (type === 'video')      return <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="2.5" width="6" height="6" rx="1"/><path d="M7 5l3-1.5v4L7 6"/></svg>
  if (type === 'phone')      return <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 2l2 1-1 2 2 2 2-1 1 2-2 1C3 9 2 6 2 2z"/></svg>
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="5.5" cy="4" r="2"/><path d="M2 10c0-2 1.5-3 3.5-3s3.5 1 3.5 3"/></svg>
}
function SearchIcon({ className }) {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
}
function CalIcon({ className }) {
  return <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}><rect x="2" y="3" width="22" height="20" rx="3"/><path d="M2 9h22M8 2v2M18 2v2"/></svg>
}
