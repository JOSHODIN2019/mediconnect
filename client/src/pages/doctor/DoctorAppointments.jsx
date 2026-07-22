import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doctorService } from '@/services/doctorService'
import { Spinner, Badge, Avatar, Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/ui'

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const STATUS_BADGE = {
  pending:   'warning',
  confirmed: 'success',
  completed: 'info',
  cancelled: 'danger',
}

const TYPE_LABEL = { video: 'Video', phone: 'Phone', 'in-person': 'In-Person' }

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function isToday(d) {
  const t = new Date(); const apt = new Date(d)
  return apt.getFullYear() === t.getFullYear() && apt.getMonth() === t.getMonth() && apt.getDate() === t.getDate()
}
function isFuture(d) { return new Date(d) > new Date() }

export default function DoctorAppointments() {
  const [tab,          setTab]          = useState('all')
  const [appointments, setAppointments] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')

  // Complete modal
  const [completeTarget, setCompleteTarget] = useState(null)
  const [notes,          setNotes]          = useState('')
  const [completing,     setCompleting]     = useState(false)

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling,   setCancelling]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await doctorService.getAppointments(tab === 'all' ? null : tab)
      setAppointments(r.appointments || [])
    } catch {
      setError('Could not load appointments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab])

  const doAction = async (id, action, extra = {}) => {
    try {
      await doctorService.updateAppointment(id, { action, ...extra })
      return true
    } catch (e) {
      setError(e.response?.data?.message || `Failed to ${action} appointment.`)
      return false
    }
  }

  const handleConfirm = async (apt) => {
    const ok = await doAction(apt._id, 'confirm')
    if (ok) { setSuccess('Appointment confirmed. Patient has been notified.'); load() }
  }

  const handleComplete = async () => {
    setCompleting(true)
    const ok = await doAction(completeTarget._id, 'complete', { notes })
    if (ok) { setSuccess('Appointment marked as completed.'); setCompleteTarget(null); setNotes(''); load() }
    setCompleting(false)
  }

  const handleCancel = async () => {
    setCancelling(true)
    const ok = await doAction(cancelTarget._id, 'cancel', { cancelReason })
    if (ok) { setSuccess('Appointment cancelled. Patient has been notified.'); setCancelTarget(null); setCancelReason(''); load() }
    setCancelling(false)
  }

  const todayCount = appointments.filter(a => isToday(a.date) && ['pending', 'confirmed'].includes(a.status)).length

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Appointments</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage patient consultation requests.</p>
        </div>
        {todayCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">{todayCount} today</span>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircleIcon />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
              tab === key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl px-8 py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <CalEmptyIcon />
          </div>
          <h2 className="font-semibold text-neutral-800 mb-1.5">No appointments {tab !== 'all' ? `(${tab})` : ''}</h2>
          <p className="text-sm text-neutral-500 max-w-xs">
            {tab === 'all'
              ? 'Patients will appear here once they book a consultation with you.'
              : `No ${tab} appointments found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => (
            <DoctorAppointmentCard
              key={apt._id}
              apt={apt}
              onConfirm={() => handleConfirm(apt)}
              onComplete={() => { setCompleteTarget(apt); setNotes('') }}
              onCancel={() => { setCancelTarget(apt); setCancelReason('') }}
            />
          ))}
        </div>
      )}

      {/* Complete modal */}
      <Modal isOpen={!!completeTarget} onClose={() => setCompleteTarget(null)}>
        <ModalHeader
          title="Mark as Completed"
          subtitle="Add optional consultation notes."
          onClose={() => setCompleteTarget(null)}
        />
        <ModalBody>
          {completeTarget && (
            <div className="space-y-4">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <p className="text-sm font-medium text-neutral-900">{completeTarget.patient?.fullName}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{fmtDate(completeTarget.date)} at {completeTarget.timeSlot}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                  Consultation Notes <span className="font-normal text-neutral-400 normal-case">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Diagnosis, prescription recommendations, follow-up instructions…"
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  maxLength={1000}
                />
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setCompleteTarget(null)}>Cancel</Button>
          <Button variant="success" onClick={handleComplete} isLoading={completing}>
            Mark Completed
          </Button>
        </ModalFooter>
      </Modal>

      {/* Cancel modal */}
      <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)}>
        <ModalHeader
          title="Cancel Appointment"
          subtitle="The patient will be notified."
          onClose={() => setCancelTarget(null)}
        />
        <ModalBody>
          {cancelTarget && (
            <div className="space-y-4">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <p className="text-sm font-medium text-neutral-900">{cancelTarget.patient?.fullName}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{fmtDate(cancelTarget.date)} at {cancelTarget.timeSlot}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                  Reason <span className="font-normal text-neutral-400 normal-case">(optional)</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation…"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep Appointment</Button>
          <Button variant="danger" onClick={handleCancel} isLoading={cancelling}>
            Cancel Appointment
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

function DoctorAppointmentCard({ apt, onConfirm, onComplete, onCancel }) {
  const navigate    = useNavigate()
  const today       = isToday(apt.date)
  const future      = isFuture(apt.date)
  const canConfirm  = apt.status === 'pending'
  const canComplete = ['pending', 'confirmed'].includes(apt.status)
  const canCancel   = !['completed', 'cancelled'].includes(apt.status)
  const canJoin     = apt.status === 'confirmed' && apt.consultationType === 'video'

  return (
    <div className={[
      'bg-white border rounded-2xl p-5 transition-all hover:shadow-sm',
      today && apt.status !== 'cancelled' ? 'border-emerald-300 shadow-[0_0_0_1px_rgb(52,211,153,0.15)]'
      : apt.status === 'cancelled' ? 'border-neutral-200 opacity-70'
      : apt.status === 'completed' ? 'border-neutral-200'
      : 'border-neutral-200',
    ].join(' ')}>
      {today && apt.status !== 'cancelled' && (
        <div className="mb-3 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-700">Today</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <Avatar name={apt.patient?.fullName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-neutral-900 text-sm">{apt.patient?.fullName}</p>
              <p className="text-xs text-neutral-400 font-mono">{apt.patient?.userId}</p>
            </div>
            <Badge variant={STATUS_BADGE[apt.status] || 'neutral'} size="sm" withDot>
              {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <InfoChip icon={<CalIcon />} label={fmtDate(apt.date)} />
            <InfoChip icon={<ClockIcon />} label={apt.timeSlot} />
            <InfoChip icon={<TypeIcon />} label={TYPE_LABEL[apt.consultationType] || apt.consultationType} />
            {apt.patient?.lga && <InfoChip icon={<PinIcon />} label={apt.patient.lga} />}
          </div>

          {apt.reason && (
            <p className="mt-2.5 text-xs text-neutral-500 italic line-clamp-2">"{apt.reason}"</p>
          )}

          {apt.doctorNotes && (
            <div className="mt-2.5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <p className="text-xs font-semibold text-emerald-700 mb-0.5">Your Notes</p>
              <p className="text-xs text-emerald-800">{apt.doctorNotes}</p>
            </div>
          )}

          {/* Actions */}
          {(canJoin || canConfirm || canComplete || canCancel) && apt.status !== 'cancelled' && apt.status !== 'completed' && (
            <div className="mt-3.5 flex items-center gap-2 flex-wrap">
              {canJoin && (
                <button
                  onClick={() => navigate(`/video/${apt._id}`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <VideoSmIcon /> Join Call
                </button>
              )}
              {canConfirm && (
                <button
                  onClick={onConfirm}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  Confirm
                </button>
              )}
              {canComplete && (
                <button
                  onClick={onComplete}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Mark Completed
                </button>
              )}
              {canCancel && (
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {apt.status === 'cancelled' && apt.cancelledBy && (
            <p className="mt-2 text-xs text-neutral-400">
              Cancelled by {apt.cancelledBy}{apt.cancelReason ? `: ${apt.cancelReason}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoChip({ icon, label }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
      <span className="text-neutral-400">{icon}</span>
      {label}
    </div>
  )
}

function CalIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="2" width="11" height="10" rx="1.5"/><path d="M1 5.5h11M4 1v2M9 1v2"/></svg>
}
function ClockIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="5.5"/><path d="M6.5 3.5v3l2 1.5"/></svg>
}
function TypeIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="2" width="8" height="6" rx="1.5"/><path d="M9 6l3-2v5l-3-2"/></svg>
}
function PinIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M6.5 1A3.5 3.5 0 003 4.5C3 7.5 6.5 12 6.5 12S10 7.5 10 4.5A3.5 3.5 0 006.5 1z"/><circle cx="6.5" cy="4.5" r="1.3"/></svg>
}
function VideoSmIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="3" width="8" height="7" rx="1.5"/><path d="M9 7l3-2v4l-3-2"/></svg>
}
function CalEmptyIcon() {
  return <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="22" height="20" rx="2.5"/><path d="M2 10h22M8 2v4M18 2v4M8 15h10M8 19h6"/></svg>
}
function CheckCircleIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0"><circle cx="8" cy="8" r="6.5"/><path d="M5 8l2 2 4-4"/></svg>
}
