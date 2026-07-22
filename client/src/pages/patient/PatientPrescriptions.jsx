import { useState, useEffect } from 'react'
import { patientService } from '@/services/patientService'
import { Spinner, Badge, Avatar } from '@/components/ui'

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'dispensed', label: 'Dispensed' },
  { key: 'expired',   label: 'Expired' },
]

const STATUS_BADGE = {
  active:    'success',
  expired:   'neutral',
  dispensed: 'info',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PatientPrescriptions() {
  const [tab,           setTab]           = useState('all')
  const [prescriptions, setPrescriptions] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [expanded,      setExpanded]      = useState(null)

  useEffect(() => {
    setLoading(true)
    patientService.getPrescriptions(tab === 'all' ? null : tab)
      .then(r => setPrescriptions(r.prescriptions || []))
      .catch(() => setError('Could not load prescriptions.'))
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Prescriptions</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Medications prescribed by your doctors.</p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
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

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl px-8 py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
            <RxEmptyIcon />
          </div>
          <h2 className="font-semibold text-neutral-800 mb-1.5">
            No {tab !== 'all' ? tab : ''} prescriptions yet
          </h2>
          <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
            Prescriptions issued by your doctors after consultations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map(rx => (
            <PrescriptionCard
              key={rx._id}
              rx={rx}
              isExpanded={expanded === rx._id}
              onToggle={() => setExpanded(expanded === rx._id ? null : rx._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PrescriptionCard({ rx, isExpanded, onToggle }) {
  const isActive = rx.status === 'active'

  return (
    <div className={[
      'bg-white border rounded-2xl overflow-hidden transition-all',
      isActive ? 'border-emerald-200' : 'border-neutral-200',
    ].join(' ')}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-neutral-50 transition-colors"
      >
        <Avatar name={rx.doctor?.fullName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-sm text-neutral-900">{rx.doctor?.fullName}</p>
              <p className="text-xs text-neutral-500">{rx.doctor?.specialization}</p>
            </div>
            <Badge variant={STATUS_BADGE[rx.status] || 'neutral'} size="sm" withDot>
              {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <InfoChip icon={<CalIcon />} label={fmtDate(rx.createdAt)} />
            <InfoChip icon={<PillIcon />} label={`${rx.medications?.length ?? 0} medication${rx.medications?.length !== 1 ? 's' : ''}`} />
            {rx.validUntil && <InfoChip icon={<ClockIcon />} label={`Valid until ${fmtDate(rx.validUntil)}`} />}
          </div>
          {rx.diagnosis && (
            <p className="mt-1.5 text-xs text-neutral-500 truncate">
              <span className="font-medium text-neutral-600">Diagnosis:</span> {rx.diagnosis}
            </p>
          )}
        </div>
        <ChevronIcon open={isExpanded} />
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-neutral-100 px-5 pb-5 pt-4 space-y-4">
          {rx.diagnosis && (
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Diagnosis</p>
              <p className="text-sm text-neutral-800">{rx.diagnosis}</p>
            </div>
          )}

          {/* Medications */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2.5">Medications</p>
            <div className="space-y-2.5">
              {rx.medications?.map((med, i) => (
                <div key={i} className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-neutral-900">{med.name}</p>
                    {med.dosage && (
                      <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 flex-shrink-0">
                        {med.dosage}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {med.frequency && <MedDetail icon={<FreqIcon />} label="Frequency" value={med.frequency} />}
                    {med.duration  && <MedDetail icon={<TimerIcon />} label="Duration"  value={med.duration}  />}
                    {med.instructions && <MedDetail icon={<NoteIcon />} label="Instructions" value={med.instructions} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {rx.generalInstructions && (
            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                <InfoIcon /> General Instructions
              </p>
              <p className="text-sm text-amber-800 leading-relaxed">{rx.generalInstructions}</p>
            </div>
          )}

          {rx.appointment && (
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <CalIcon />
              Issued after consultation on {fmtDate(rx.appointment.date)} at {rx.appointment.timeSlot}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MedDetail({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-600">
      <span className="text-neutral-400 flex-shrink-0">{icon}</span>
      <span className="text-neutral-400">{label}:</span>
      <span className="text-neutral-700">{value}</span>
    </div>
  )
}

function InfoChip({ icon, label }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
      <span className="text-neutral-400">{icon}</span>
      {label}
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      className={`flex-shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M4 6l4 4 4-4"/>
    </svg>
  )
}
function RxEmptyIcon() {
  return <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2h12a2 2 0 012 2v18a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M10 10h2.5v5M10 12.5h5"/></svg>
}
function CalIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="2" width="10" height="9" rx="1.5"/><path d="M1 5h10M4 1v2M8 1v2"/></svg>
}
function PillIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><ellipse cx="6" cy="6" rx="4.5" ry="2.5" transform="rotate(45 6 6)"/><path d="M3.2 8.8l5.6-5.6"/></svg>
}
function ClockIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6" cy="6" r="5"/><path d="M6 3.5v2.5l1.5 1"/></svg>
}
function FreqIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 5.5h2l1.5-3 2 6 1.5-3H10"/></svg>
}
function TimerIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="5.5" cy="6" r="4"/><path d="M5.5 4v2.5M4 1h3M5.5 1v1"/></svg>
}
function NoteIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 1.5h7a.5.5 0 01.5.5v7a.5.5 0 01-.5.5H2a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5z"/><path d="M3.5 4h4M3.5 6h2.5"/></svg>
}
function InfoIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="5.5" cy="5.5" r="4.5"/><path d="M5.5 5v3M5.5 4v.5"/></svg>
}
