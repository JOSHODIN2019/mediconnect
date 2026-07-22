import { useState, useEffect, useCallback } from 'react'
import { doctorService } from '@/services/doctorService'
import { Spinner, Badge, Avatar, Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/ui'

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'dispensed', label: 'Dispensed' },
  { key: 'expired',   label: 'Expired' },
]

const STATUS_BADGE = { active: 'success', expired: 'neutral', dispensed: 'info' }

const EMPTY_MED = { name: '', dosage: '', frequency: '', duration: '', instructions: '' }

const FREQ_PRESETS  = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'Every 12 hours', 'At bedtime', 'As needed']
const DUR_PRESETS   = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '3 months']
const DOSAGE_PRESETS= ['100mg', '200mg', '250mg', '500mg', '1g', '5ml', '10ml', '1 tablet', '2 tablets']

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DoctorPrescriptions() {
  const [tab,           setTab]           = useState('all')
  const [prescriptions, setPrescriptions] = useState([])
  const [patients,      setPatients]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')
  const [expanded,      setExpanded]      = useState(null)

  // Issue modal state
  const [showModal,   setShowModal]   = useState(false)
  const [issuing,     setIssuing]     = useState(false)
  const [form,        setForm]        = useState({
    patientId: '', diagnosis: '', generalInstructions: '', validUntil: '',
    medications: [{ ...EMPTY_MED }],
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rxRes, patRes] = await Promise.all([
        doctorService.getPrescriptions(tab === 'all' ? {} : { status: tab }),
        doctorService.getPatients(),
      ])
      setPrescriptions(rxRes.prescriptions || [])
      setPatients(patRes.data || [])
    } catch {
      setError('Could not load prescriptions.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  /* ── Medication helpers ── */
  const setMed = (i, field, value) => {
    setForm(f => {
      const meds = [...f.medications]
      meds[i] = { ...meds[i], [field]: value }
      return { ...f, medications: meds }
    })
  }
  const addMed    = () => setForm(f => ({ ...f, medications: [...f.medications, { ...EMPTY_MED }] }))
  const removeMed = i  => setForm(f => ({ ...f, medications: f.medications.filter((_, idx) => idx !== i) }))

  const openModal = () => {
    setForm({ patientId: '', diagnosis: '', generalInstructions: '', validUntil: '', medications: [{ ...EMPTY_MED }] })
    setShowModal(true)
  }

  const handleIssue = async () => {
    if (!form.patientId) return setError('Select a patient.')
    const validMeds = form.medications.filter(m => m.name.trim())
    if (!validMeds.length) return setError('Add at least one medication with a name.')
    setIssuing(true); setError('')
    try {
      await doctorService.createPrescription({
        patientId:           form.patientId,
        medications:         validMeds,
        diagnosis:           form.diagnosis,
        generalInstructions: form.generalInstructions,
        validUntil:          form.validUntil || undefined,
      })
      setSuccess('Prescription issued. The patient has been notified.')
      setShowModal(false)
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to issue prescription.')
    } finally {
      setIssuing(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await doctorService.updatePrescriptionStatus(id, status)
      setSuccess(`Prescription marked as ${status}.`)
      load()
    } catch {
      setError('Failed to update status.')
    }
  }

  // Min valid-until = today
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Prescriptions</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Issue and manage patient prescriptions.</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <PlusIcon /> Issue Prescription
        </button>
      </div>

      {/* Toasts */}
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

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl px-8 py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <RxEmptyIcon />
          </div>
          <h2 className="font-semibold text-neutral-800 mb-1.5">No {tab !== 'all' ? tab : ''} prescriptions</h2>
          <p className="text-sm text-neutral-500 max-w-xs mb-5">
            Issue your first prescription to a patient.
          </p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Issue Prescription
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map(rx => (
            <DoctorRxCard
              key={rx._id}
              rx={rx}
              isExpanded={expanded === rx._id}
              onToggle={() => setExpanded(expanded === rx._id ? null : rx._id)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Issue Prescription Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <ModalHeader
          title="Issue Prescription"
          subtitle="Fill in the details to issue a prescription."
          onClose={() => setShowModal(false)}
        />
        <ModalBody>
          <div className="space-y-5">
            {/* Patient */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">Patient *</label>
              <select
                value={form.patientId}
                onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              >
                <option value="">Select a patient…</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.fullName} · {p.userId}</option>
                ))}
              </select>
              {patients.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No patients have granted you access yet.</p>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                Diagnosis <span className="font-normal text-neutral-400 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={form.diagnosis}
                onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                placeholder="e.g. Malaria, Hypertension, Upper respiratory infection…"
                className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Medications *</label>
                <button
                  type="button"
                  onClick={addMed}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <PlusIcon size={12} /> Add medication
                </button>
              </div>
              <div className="space-y-3">
                {form.medications.map((med, i) => (
                  <div key={i} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-neutral-500">Medication {i + 1}</span>
                      {form.medications.length > 1 && (
                        <button type="button" onClick={() => removeMed(i)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={med.name}
                          onChange={e => setMed(i, 'name', e.target.value)}
                          placeholder="Drug name *"
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      </div>
                      <SelectOrText
                        value={med.dosage}
                        onChange={v => setMed(i, 'dosage', v)}
                        placeholder="Dosage (e.g. 500mg)"
                        presets={DOSAGE_PRESETS}
                      />
                      <SelectOrText
                        value={med.frequency}
                        onChange={v => setMed(i, 'frequency', v)}
                        placeholder="Frequency"
                        presets={FREQ_PRESETS}
                      />
                      <SelectOrText
                        value={med.duration}
                        onChange={v => setMed(i, 'duration', v)}
                        placeholder="Duration"
                        presets={DUR_PRESETS}
                        className="col-span-2"
                      />
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={e => setMed(i, 'instructions', e.target.value)}
                        placeholder="Special instructions (e.g. Take after meals)"
                        className="col-span-2 w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General instructions */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                General Instructions <span className="font-normal text-neutral-400 normal-case">(optional)</span>
              </label>
              <textarea
                value={form.generalInstructions}
                onChange={e => setForm(f => ({ ...f, generalInstructions: e.target.value }))}
                placeholder="Rest, hydration, follow-up instructions…"
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Valid until */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                Valid Until <span className="font-normal text-neutral-400 normal-case">(optional)</span>
              </label>
              <input
                type="date"
                min={today}
                value={form.validUntil}
                onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleIssue} isLoading={issuing}>
            Issue Prescription
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

function SelectOrText({ value, onChange, placeholder, presets, className = '' }) {
  const [custom, setCustom] = useState(!presets.includes(value) && value !== '')

  return (
    <div className={`relative ${className}`}>
      {custom ? (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button type="button" onClick={() => { setCustom(false); onChange('') }}
            className="px-2 text-xs text-neutral-400 hover:text-red-500 border border-neutral-200 rounded-lg">
            ✕
          </button>
        </div>
      ) : (
        <select
          value={value}
          onChange={e => {
            if (e.target.value === '__custom__') { setCustom(true); onChange('') }
            else onChange(e.target.value)
          }}
          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        >
          <option value="">{placeholder}</option>
          {presets.map(p => <option key={p} value={p}>{p}</option>)}
          <option value="__custom__">Custom…</option>
        </select>
      )}
    </div>
  )
}

function DoctorRxCard({ rx, isExpanded, onToggle, onStatusChange }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-sm transition-all">
      <button onClick={onToggle} className="w-full flex items-start gap-4 p-5 text-left hover:bg-neutral-50 transition-colors">
        <Avatar name={rx.patient?.fullName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-sm text-neutral-900">{rx.patient?.fullName}</p>
              <p className="text-xs text-neutral-400 font-mono">{rx.patient?.userId}</p>
            </div>
            <Badge variant={STATUS_BADGE[rx.status] || 'neutral'} size="sm" withDot>
              {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <InfoChip icon={<CalIcon />} label={fmtDate(rx.createdAt)} />
            <InfoChip icon={<PillIcon />} label={`${rx.medications?.length ?? 0} med${rx.medications?.length !== 1 ? 's' : ''}`} />
            {rx.diagnosis && <InfoChip icon={<NoteIcon />} label={rx.diagnosis} />}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          className={`flex-shrink-0 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <path d="M4 6l4 4 4-4"/>
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-neutral-100 px-5 pb-5 pt-4 space-y-4">
          {rx.diagnosis && (
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Diagnosis</p>
              <p className="text-sm text-neutral-800">{rx.diagnosis}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2.5">Medications</p>
            <div className="space-y-2">
              {rx.medications?.map((med, i) => (
                <div key={i} className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-neutral-900">{med.name}</p>
                    {med.dosage && <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{med.dosage}</span>}
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    {med.frequency    && <p className="text-xs text-neutral-500">{med.frequency}</p>}
                    {med.duration     && <p className="text-xs text-neutral-500">for {med.duration}</p>}
                    {med.instructions && <p className="text-xs text-neutral-400 italic">{med.instructions}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {rx.generalInstructions && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-xs text-amber-800">{rx.generalInstructions}</p>
            </div>
          )}
          {rx.validUntil && (
            <p className="text-xs text-neutral-400">Valid until {fmtDate(rx.validUntil)}</p>
          )}
          {/* Status actions */}
          {rx.status === 'active' && (
            <div className="flex gap-2 pt-1">
              <button onClick={() => onStatusChange(rx._id, 'dispensed')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
                Mark Dispensed
              </button>
              <button onClick={() => onStatusChange(rx._id, 'expired')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors">
                Mark Expired
              </button>
            </div>
          )}
        </div>
      )}
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

function PlusIcon({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
}
function CalIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="2" width="10" height="9" rx="1.5"/><path d="M1 5h10M4 1v2M8 1v2"/></svg> }
function PillIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><ellipse cx="6" cy="6" rx="4.5" ry="2.5" transform="rotate(45 6 6)"/><path d="M3.2 8.8l5.6-5.6"/></svg> }
function NoteIcon() { return <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 1.5h7a.5.5 0 01.5.5v7a.5.5 0 01-.5.5H2a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5z"/><path d="M3.5 4h4M3.5 6h2.5"/></svg> }
function RxEmptyIcon() { return <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2h12a2 2 0 012 2v18a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M10 10h2.5v5M10 12.5h5"/></svg> }
function CheckCircleIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0"><circle cx="8" cy="8" r="6.5"/><path d="M5 8l2 2 4-4"/></svg> }
