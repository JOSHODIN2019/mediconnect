import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { patientService } from '@/services/patientService'
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

export default function PatientAppointments() {
  const [searchParams]  = useSearchParams()
  const justBooked      = searchParams.get('booked') === '1'

  const [tab,          setTab]          = useState('all')
  const [appointments, setAppointments] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(justBooked ? 'Appointment booked successfully! The doctor will confirm shortly.' : '')

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling,   setCancelling]   = useState(false)

  // Reschedule modal
  const [reschedTarget,   setReschedTarget]  = useState(null)
  const [reschedDate,     setReschedDate]    = useState('')
  const [reschedSlots,    setReschedSlots]   = useState([])
  const [reschedSlot,     setReschedSlot]    = useState('')
  const [reschedLoading,  setReschedLoading] = useState(false)
  const [rescheduling,    setRescheduling]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await patientService.getAppointments(tab === 'all' ? null : tab)
      setAppointments(r.appointments || [])
    } catch {
      setError('Could not load appointments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab])

  // Load slots when reschedule date changes
  useEffect(() => {
    if (!reschedTarget || !reschedDate) { setReschedSlots([]); return }
    setReschedLoading(true)
    setReschedSlot('')
    patientService.getAvailableSlots(reschedTarget.doctor._id, reschedDate)
      .then(r => setReschedSlots(r.slots || []))
      .catch(() => setReschedSlots([]))
      .finally(() => setReschedLoading(false))
  }, [reschedTarget, reschedDate])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await patientService.cancelAppointment(cancelTarget._id, cancelReason)
      setSuccess('Appointment cancelled.')
      setCancelTarget(null)
      setCancelReason('')
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to cancel appointment.')
    } finally {
      setCancelling(false)
    }
  }

  const handleReschedule = async () => {
    setRescheduling(true)
    try {
      await patientService.rescheduleAppointment(reschedTarget._id, reschedDate, reschedSlot)
      setSuccess('Appointment rescheduled.')
      setReschedTarget(null)
      setReschedDate('')
      setReschedSlot('')
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reschedule appointment.')
    } finally {
      setRescheduling(false)
    }
  }

  const minDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
  })()
  const maxDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 60); return d.toISOString().split('T')[0]
  })()

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Appointments</h1>
          <p className="text-sm text-neutral-500 mt-0.5">View and manage your consultation bookings.</p>
        </div>
        <Link
          to="/patient/book"
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon /> Book Appointment
        </Link>
      </div>

      {/* Toasts */}
      {success && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircleIcon />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
              tab === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl px-8 py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <CalEmptyIcon />
          </div>
          <h2 className="font-semibold text-neutral-800 mb-1.5">No appointments {tab !== 'all' ? `(${tab})` : 'yet'}</h2>
          <p className="text-sm text-neutral-500 max-w-xs mb-5">
            {tab === 'all' ? 'You haven\'t booked any consultations yet.' : `No ${tab} appointments found.`}
          </p>
          <Link to="/patient/book" className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
            Book a Consultation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => (
            <AppointmentCard
              key={apt._id}
              apt={apt}
              onCancel={() => setCancelTarget(apt)}
              onReschedule={() => { setReschedTarget(apt); setReschedDate(''); setReschedSlot('') }}
            />
          ))}
        </div>
      )}

      {/* Cancel modal */}
      <Modal isOpen={!!cancelTarget} onClose={() => { setCancelTarget(null); setCancelReason('') }}>
        <ModalHeader
          title="Cancel Appointment"
          subtitle="This action cannot be undone."
          onClose={() => { setCancelTarget(null); setCancelReason('') }}
        />
        <ModalBody>
          {cancelTarget && (
            <div className="space-y-4">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <p className="text-sm font-medium text-neutral-900">{cancelTarget.doctor?.fullName}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{fmtDate(cancelTarget.date)} at {cancelTarget.timeSlot}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                  Reason <span className="font-normal text-neutral-400 normal-case">(optional)</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Why are you cancelling?"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => { setCancelTarget(null); setCancelReason('') }}>Keep Appointment</Button>
          <Button variant="danger" onClick={handleCancel} isLoading={cancelling}>
            Cancel Appointment
          </Button>
        </ModalFooter>
      </Modal>

      {/* Reschedule modal */}
      <Modal isOpen={!!reschedTarget} onClose={() => setReschedTarget(null)}>
        <ModalHeader
          title="Reschedule Appointment"
          subtitle="Pick a new date and time slot."
          onClose={() => setReschedTarget(null)}
        />
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">New Date</label>
              <input
                type="date"
                min={minDate}
                max={maxDate}
                value={reschedDate}
                onChange={e => setReschedDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wide">Available Slots</label>
              {!reschedDate ? (
                <p className="text-sm text-neutral-400 text-center py-4">Select a date first</p>
              ) : reschedLoading ? (
                <div className="flex justify-center py-4"><Spinner size="sm" /></div>
              ) : reschedSlots.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">No slots available — try another date.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {reschedSlots.map(s => (
                    <button
                      key={s}
                      onClick={() => setReschedSlot(s)}
                      className={[
                        'py-2 rounded-lg text-xs font-semibold border transition-all',
                        reschedSlot === s
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-blue-400',
                      ].join(' ')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setReschedTarget(null)}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!reschedDate || !reschedSlot}
            isLoading={rescheduling}
            onClick={handleReschedule}
          >
            Reschedule
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

function AppointmentCard({ apt, onCancel, onReschedule }) {
  const navigate   = useNavigate()
  const isPast     = new Date(apt.date) < new Date()
  const canCancel  = ['pending', 'confirmed'].includes(apt.status)
  const canResched = ['pending', 'confirmed'].includes(apt.status) && !isPast
  const canJoin    = apt.status === 'confirmed' && apt.consultationType === 'video'

  return (
    <div className={[
      'bg-white border rounded-2xl p-5 transition-all hover:shadow-sm',
      apt.status === 'cancelled' ? 'border-neutral-200 opacity-70'
      : apt.status === 'completed' ? 'border-neutral-200'
      : apt.status === 'confirmed' ? 'border-emerald-200'
      : 'border-blue-100',
    ].join(' ')}>
      <div className="flex items-start gap-4">
        <Avatar name={apt.doctor?.fullName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-neutral-900 text-sm">{apt.doctor?.fullName}</p>
              <p className="text-xs text-neutral-500">{apt.doctor?.specialization}</p>
            </div>
            <Badge variant={STATUS_BADGE[apt.status] || 'neutral'} size="sm" withDot>
              {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <InfoChip icon={<CalIcon />} label={fmtDate(apt.date)} />
            <InfoChip icon={<ClockIcon />} label={apt.timeSlot} />
            <InfoChip icon={<TypeIcon />} label={TYPE_LABEL[apt.consultationType] || apt.consultationType} />
          </div>

          {apt.reason && (
            <p className="mt-2.5 text-xs text-neutral-500 italic line-clamp-2">"{apt.reason}"</p>
          )}

          {apt.doctorNotes && (
            <div className="mt-2.5 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-0.5">Doctor's Notes</p>
              <p className="text-xs text-blue-800">{apt.doctorNotes}</p>
            </div>
          )}

          {(canJoin || canCancel || canResched) && (
            <div className="mt-3.5 flex items-center gap-2 flex-wrap">
              {canJoin && (
                <button
                  onClick={() => navigate(`/video/${apt._id}`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <VideoSmIcon /> Join Call
                </button>
              )}
              {canResched && (
                <button
                  onClick={onReschedule}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Reschedule
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

          {apt.status === 'cancelled' && apt.cancelReason && (
            <p className="mt-2 text-xs text-neutral-400">Reason: {apt.cancelReason}</p>
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

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
}
function VideoSmIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="3" width="8" height="7" rx="1.5"/><path d="M9 7l3-2v4l-3-2"/></svg>
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
function CalEmptyIcon() {
  return <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="22" height="20" rx="2.5"/><path d="M2 10h22M8 2v4M18 2v4M8 15h10M8 19h6"/></svg>
}
function CheckCircleIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0"><circle cx="8" cy="8" r="6.5"/><path d="M5 8l2 2 4-4"/></svg>
}
