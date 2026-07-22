import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientService } from '@/services/patientService'
import { Spinner, Avatar } from '@/components/ui'

const CONSULT_TYPES = [
  { value: 'video',      label: 'Video Call',  icon: VideoIcon,  desc: 'Face-to-face via video' },
  { value: 'phone',      label: 'Phone Call',  icon: PhoneIcon,  desc: 'Audio consultation' },
  { value: 'in-person',  label: 'In-Person',   icon: WalkIcon,   desc: 'Visit the clinic' },
]

const STEPS = ['Doctor', 'Date & Time', 'Details', 'Confirm']

export default function PatientBook() {
  const navigate = useNavigate()
  const [step,   setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // Step 0 — doctor selection
  const [doctors,       setDoctors]       = useState([])
  const [doctorsLoading,setDoctorsLoading]= useState(true)
  const [search,        setSearch]        = useState('')
  const [selectedDoctor,setSelectedDoctor]= useState(null)

  // Step 1 — date & time
  const [selectedDate,  setSelectedDate]  = useState('')
  const [slots,         setSlots]         = useState([])
  const [slotsLoading,  setSlotsLoading]  = useState(false)
  const [selectedSlot,  setSelectedSlot]  = useState('')

  // Step 2 — details
  const [consultType, setConsultType] = useState('video')
  const [reason,      setReason]      = useState('')

  useEffect(() => {
    patientService.getDoctors()
      .then(({ data }) => setDoctors(data || []))
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) { setSlots([]); return }
    setSlotsLoading(true)
    setSelectedSlot('')
    patientService.getAvailableSlots(selectedDoctor._id, selectedDate)
      .then(r => setSlots(r.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [selectedDoctor, selectedDate])

  const filteredDoctors = doctors.filter(d =>
    !search ||
    d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
    d.hospital?.toLowerCase().includes(search.toLowerCase())
  )

  // Minimum bookable date = tomorrow
  const minDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
  })()
  // Max = 60 days out
  const maxDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 60); return d.toISOString().split('T')[0]
  })()

  const canNext = [
    !!selectedDoctor,
    !!selectedDate && !!selectedSlot,
    !!consultType,
    true,
  ]

  const handleNext = () => { setError(''); setStep(s => s + 1) }
  const handleBack = () => { setError(''); setStep(s => s - 1) }

  const handleSubmit = async () => {
    setSaving(true); setError('')
    try {
      await patientService.bookAppointment({
        doctorId:        selectedDoctor._id,
        date:            selectedDate,
        timeSlot:        selectedSlot,
        consultationType: consultType,
        reason:          reason.trim(),
      })
      navigate('/patient/appointments?booked=1')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to book appointment. Try again.')
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-neutral-900">Book a Consultation</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Choose a doctor and schedule your telemedicine appointment.</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                i < step  ? 'bg-blue-600 text-white'
                : i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                : 'bg-neutral-200 text-neutral-400',
              ].join(' ')}>
                {i < step ? <CheckSmIcon /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${i <= step ? 'text-blue-600' : 'text-neutral-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 ${i < step ? 'bg-blue-600' : 'bg-neutral-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step panels */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">

        {/* ── STEP 0: Doctor ── */}
        {step === 0 && (
          <div>
            <h2 className="font-semibold text-neutral-900 mb-4">Select a Doctor</h2>
            <input
              type="text"
              placeholder="Search by name, specialty, hospital…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            {doctorsLoading ? (
              <div className="flex justify-center py-8"><Spinner size="md" /></div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-10 text-neutral-400">
                <p className="font-medium text-sm">No doctors found</p>
                <p className="text-xs mt-1">Try a different search term.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredDoctors.map(doctor => (
                  <button
                    key={doctor._id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={[
                      'w-full flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all',
                      selectedDoctor?._id === doctor._id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
                    ].join(' ')}
                  >
                    <Avatar name={doctor.fullName} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-neutral-900 truncate">{doctor.fullName}</p>
                      <p className="text-xs text-neutral-500 truncate">{doctor.specialization || 'General Practice'}</p>
                      {doctor.hospital && <p className="text-xs text-neutral-400 truncate">{doctor.hospital}</p>}
                    </div>
                    {selectedDoctor?._id === doctor._id && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <CheckSmIcon white />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Date & Time ── */}
        {step === 1 && (
          <div>
            <h2 className="font-semibold text-neutral-900 mb-1">Choose Date & Time</h2>
            {selectedDoctor && (
              <p className="text-xs text-neutral-500 mb-4">Booking with <span className="font-medium text-neutral-700">{selectedDoctor.fullName}</span></p>
            )}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">Date</label>
              <input
                type="date"
                min={minDate}
                max={maxDate}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Weekdays only. Appointments open 1–60 days in advance.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wide">Available Time Slots</label>
              {!selectedDate ? (
                <p className="text-sm text-neutral-400 py-4 text-center">Select a date first</p>
              ) : slotsLoading ? (
                <div className="flex justify-center py-6"><Spinner size="sm" /></div>
              ) : slots.length === 0 ? (
                <div className="text-center py-6 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="text-sm font-medium text-neutral-600">No slots available</p>
                  <p className="text-xs text-neutral-400 mt-1">All slots are booked or this is a weekend. Try another date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={[
                        'py-2 px-2 rounded-lg text-xs font-semibold transition-all border',
                        selectedSlot === slot
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-blue-400 hover:text-blue-600',
                      ].join(' ')}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Consultation details ── */}
        {step === 2 && (
          <div>
            <h2 className="font-semibold text-neutral-900 mb-4">Consultation Details</h2>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wide">Consultation Type</label>
              <div className="grid grid-cols-3 gap-3">
                {CONSULT_TYPES.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    onClick={() => setConsultType(value)}
                    className={[
                      'flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all',
                      consultType === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-neutral-200 hover:border-neutral-300',
                    ].join(' ')}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${consultType === value ? 'bg-blue-600' : 'bg-neutral-100'}`}>
                      <Icon active={consultType === value} />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${consultType === value ? 'text-blue-700' : 'text-neutral-700'}`}>{label}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                Reason for Consultation <span className="font-normal text-neutral-400 lowercase normal-case">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for the appointment…"
                rows={4}
                className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
              />
              <p className="text-[11px] text-neutral-400 text-right mt-1">{reason.length}/500</p>
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirm ── */}
        {step === 3 && (
          <div>
            <h2 className="font-semibold text-neutral-900 mb-4">Confirm Booking</h2>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 divide-y divide-neutral-100">
              <ConfirmRow label="Doctor">
                <div className="flex items-center gap-2.5">
                  <Avatar name={selectedDoctor?.fullName} size="xs" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{selectedDoctor?.fullName}</p>
                    <p className="text-xs text-neutral-500">{selectedDoctor?.specialization}</p>
                  </div>
                </div>
              </ConfirmRow>
              <ConfirmRow label="Date">
                <p className="text-sm font-medium text-neutral-800">
                  {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </p>
              </ConfirmRow>
              <ConfirmRow label="Time">
                <p className="text-sm font-medium text-neutral-800">{selectedSlot}</p>
              </ConfirmRow>
              <ConfirmRow label="Type">
                <p className="text-sm font-medium text-neutral-800 capitalize">{consultType.replace('-', ' ')}</p>
              </ConfirmRow>
              {reason.trim() && (
                <ConfirmRow label="Reason">
                  <p className="text-sm text-neutral-700 leading-relaxed">{reason.trim()}</p>
                </ConfirmRow>
              )}
            </div>
            <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <InfoIcon />
              <p className="text-xs text-blue-700 leading-relaxed">
                Your appointment request will be sent to the doctor for confirmation. You'll receive a notification once it's confirmed.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-neutral-100">
          <button
            onClick={step === 0 ? () => navigate(-1) : handleBack}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canNext[step]}
              className={[
                'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all',
                canNext[step]
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed',
              ].join(' ')}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-sm"
            >
              {saving && <Spinner size="xs" color="white" />}
              {saving ? 'Booking…' : 'Confirm Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfirmRow({ label, children }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3.5">
      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide w-16 pt-0.5 flex-shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function CheckSmIcon({ white }) {
  return <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={white ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round"><path d="M2 5l2 2 4-4"/></svg>
}
function InfoIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 7v4M8 5.5v.5"/></svg>
}
function VideoIcon({ active }) {
  const c = active ? 'white' : '#64748b'
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="4" width="11" height="10" rx="2"/><path d="M12 8l5-3v8l-5-3v-2z"/></svg>
}
function PhoneIcon({ active }) {
  const c = active ? 'white' : '#64748b'
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"><path d="M3.5 2A1.5 1.5 0 002 3.5C2 11.5 6.5 16 14.5 16A1.5 1.5 0 0016 14.5v-2a1.5 1.5 0 00-1.5-1.5c-.8 0-1.6-.1-2.3-.4a1.5 1.5 0 00-1.5.4l-1 1a9.6 9.6 0 01-3.7-3.7l1-1a1.5 1.5 0 00.4-1.5c-.3-.7-.4-1.5-.4-2.3A1.5 1.5 0 005.5 2h-2z"/></svg>
}
function WalkIcon({ active }) {
  const c = active ? 'white' : '#64748b'
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"><circle cx="9" cy="3.5" r="1.5"/><path d="M9 5.5v4l-2.5 3M9 9.5l2.5 3M6.5 8H12"/></svg>
}
