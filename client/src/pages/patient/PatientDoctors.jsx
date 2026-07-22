import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { patientService } from '@/services/patientService'
import { Spinner, Avatar } from '@/components/ui'

const SPECS = [
  'All Specializations', 'General Practice', 'Internal Medicine', 'Cardiology',
  'Paediatrics', 'Obstetrics & Gynaecology', 'Surgery', 'Dermatology',
  'Psychiatry', 'Radiology', 'Gynaecology',
]

export default function PatientDoctors() {
  const [doctors,  setDoctors]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [tab,      setTab]      = useState('all')   // 'all' | 'granted'
  const [spec,     setSpec]     = useState('All Specializations')
  const [toast,    setToast]    = useState(null)    // { msg, ok }
  const [pending,  setPending]  = useState({})      // { [doctorId]: true }

  const load = useCallback(() => {
    patientService.getDoctors()
      .then(({ data }) => setDoctors(data || []))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const handleGrant = async (doctor) => {
    setPending(p => ({ ...p, [doctor._id]: true }))
    try {
      await patientService.grantAccess(doctor._id)
      setDoctors(ds => ds.map(d => d._id === doctor._id ? { ...d, hasAccess: true } : d))
      showToast(`Access granted to ${doctor.fullName}`)
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to grant access', false)
    } finally {
      setPending(p => { const n = { ...p }; delete n[doctor._id]; return n })
    }
  }

  const handleRevoke = async (doctor) => {
    if (!window.confirm(`Remove ${doctor.fullName}'s access to your medical records?`)) return
    setPending(p => ({ ...p, [doctor._id]: true }))
    try {
      await patientService.revokeAccess(doctor._id)
      setDoctors(ds => ds.map(d => d._id === doctor._id ? { ...d, hasAccess: false } : d))
      showToast(`Access revoked from ${doctor.fullName}`)
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to revoke access', false)
    } finally {
      setPending(p => { const n = { ...p }; delete n[doctor._id]; return n })
    }
  }

  const visible = doctors.filter(d => {
    if (tab === 'granted' && !d.hasAccess) return false
    if (spec !== 'All Specializations' && d.specialization !== spec) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        d.fullName?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.hospital?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const grantedCount = doctors.filter(d => d.hasAccess).length

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={[
          'fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all',
          toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white',
        ].join(' ')}>
          {toast.ok ? <CheckIcon /> : <XIcon />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Doctors</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Manage which doctors can access your medical records.
        </p>
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        {/* Tabs */}
        <div className="flex bg-neutral-100 rounded-xl p-1 self-start flex-shrink-0">
          <TabBtn active={tab === 'all'} onClick={() => setTab('all')}>
            All Doctors <span className="ml-1.5 text-[10px] font-semibold bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded-full">{doctors.length}</span>
          </TabBtn>
          <TabBtn active={tab === 'granted'} onClick={() => setTab('granted')}>
            My Doctors <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${grantedCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-neutral-200 text-neutral-600'}`}>{grantedCount}</span>
          </TabBtn>
        </div>

        <div className="flex gap-2 flex-1">
          {/* Specialty filter */}
          <select
            value={spec}
            onChange={e => setSpec(e.target.value)}
            className="text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-neutral-700 flex-shrink-0"
          >
            {SPECS.map(s => <option key={s}>{s}</option>)}
          </select>

          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, specialty, hospital…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="md" /></div>
      ) : visible.length === 0 ? (
        <EmptyState tab={tab} search={search} spec={spec} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(doctor => (
            <DoctorCard
              key={doctor._id}
              doctor={doctor}
              busy={!!pending[doctor._id]}
              onGrant={() => handleGrant(doctor)}
              onRevoke={() => handleRevoke(doctor)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── DoctorCard ── */
function DoctorCard({ doctor, busy, onGrant, onRevoke }) {
  return (
    <div className={[
      'bg-white border rounded-2xl p-5 transition-all duration-200 flex flex-col',
      doctor.hasAccess
        ? 'border-blue-200 shadow-sm shadow-blue-50'
        : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
    ].join(' ')}>

      {/* Top: avatar + info */}
      <div className="flex items-start gap-3 flex-1">
        <Avatar name={doctor.fullName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-neutral-900 text-sm truncate">{doctor.fullName}</p>
          <p className="text-xs text-blue-600 font-medium truncate mt-0.5">
            {doctor.specialization || 'General Practice'}
          </p>
          {doctor.hospital && (
            <p className="text-xs text-neutral-400 truncate mt-0.5 flex items-center gap-1">
              <HospitalIcon />
              {doctor.hospital}
            </p>
          )}
        </div>
        {/* Access badge */}
        {doctor.hasAccess && (
          <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        )}
      </div>

      {/* Doctor ID */}
      <p className="text-[10px] font-mono text-neutral-400 mt-3 mb-3">{doctor.userId}</p>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {/* Book appointment */}
        <Link
          to="/patient/book"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
        >
          <CalIcon />
          Book
        </Link>

        {/* Grant / Revoke */}
        {doctor.hasAccess ? (
          <button
            onClick={onRevoke}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {busy ? <MiniSpinner /> : <LockIcon />}
            Revoke
          </button>
        ) : (
          <button
            onClick={onGrant}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {busy ? <MiniSpinner /> : <KeyIcon />}
            Grant Access
          </button>
        )}
      </div>
    </div>
  )
}

/* ── TabBtn ── */
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
        active ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

/* ── EmptyState ── */
function EmptyState({ tab, search, spec }) {
  const hasFilter = search || spec !== 'All Specializations'
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-8 py-16 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <DoctorEmptyIcon />
      </div>
      <h2 className="font-semibold text-neutral-800 mb-1.5">
        {hasFilter ? 'No doctors match your filters' : tab === 'granted' ? 'No access granted yet' : 'No doctors found'}
      </h2>
      <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
        {tab === 'granted' && !hasFilter
          ? 'Grant a doctor access to your records so they can view your health history.'
          : 'Try adjusting your search or filters.'}
      </p>
    </div>
  )
}

/* ── Mini components ── */
function MiniSpinner() {
  return (
    <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M6 1.5A4.5 4.5 0 0110.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

/* ── Icons ── */
function SearchIcon({ className }) {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
}
function CheckIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3 3 7-7"/></svg> }
function XIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg> }
function CalIcon()   { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="2" width="11" height="10" rx="1.5"/><path d="M1 5.5h11M4.5 1v2M8.5 1v2"/></svg> }
function KeyIcon()   { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="5" cy="5" r="3"/><path d="M7.5 7.5l4 4M9.5 7.5l1.5 1.5"/></svg> }
function LockIcon()  { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="5.5" width="9" height="6.5" rx="1.5"/><path d="M4.5 5.5V4a2 2 0 014 0v1.5"/></svg> }
function HospitalIcon() { return <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="1" width="8" height="8" rx="1"/><path d="M5 3v4M3 5h4"/></svg> }
function DoctorEmptyIcon() { return <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round"><circle cx="13" cy="8" r="4"/><path d="M5 22c0-4 3.5-7 8-7s8 3 8 7"/><path d="M10 15h6M13 13v6"/></svg> }
