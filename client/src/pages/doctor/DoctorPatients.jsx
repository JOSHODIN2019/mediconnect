import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { doctorService } from '@/services/doctorService'
import { Spinner, Alert, Avatar } from '@/components/ui'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function calcAge(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
}

export default function DoctorPatients() {
  const navigate = useNavigate()
  const [patients,     setPatients]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [showAddPat,   setShowAddPat]   = useState(false)
  const [showAddRec,   setShowAddRec]   = useState(false)

  const load = () => {
    setLoading(true)
    doctorService.getPatients()
      .then(r => setPatients(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = patients.filter(p =>
    !search || p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.userId?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" color="blue" /></div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Patients</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {patients.length} patient{patients.length !== 1 ? 's' : ''} have granted you access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddRec(true)}
            disabled={patients.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PlusIcon />
            Add Record
          </button>
          <button
            onClick={() => setShowAddPat(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <UserPlusIcon />
            Add Patient
          </button>
        </div>
      </div>

      {error && <Alert variant="danger" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Search */}
      {patients.length > 0 && (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or ID…"
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <PeopleIcon className="mx-auto mb-3 text-neutral-300 w-10 h-10" />
          <p className="text-neutral-500 font-medium">{search ? 'No patients match your search' : 'No patients yet'}</p>
          <p className="text-sm text-neutral-400 mt-1">
            {search ? 'Try a different name or ID.' : 'Register a patient or wait for them to grant you access.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(patient => (
            <Link
              key={patient._id}
              to={`/doctor/patients/${patient._id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-neutral-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all group"
            >
              <Avatar name={patient.fullName} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900">{patient.fullName}</p>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">{patient.userId}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {patient.dateOfBirth && (
                    <span className="text-xs text-neutral-500">{calcAge(patient.dateOfBirth)} yrs old</span>
                  )}
                  {patient.phone && (
                    <span className="text-xs text-neutral-400">{patient.phone}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                  {patient.recordCount} record{patient.recordCount !== 1 ? 's' : ''}
                </span>
                <p className="text-[10px] text-neutral-400 mt-1.5">Access since</p>
                <p className="text-[10px] text-neutral-500 font-medium">{fmtDate(patient.grantedAt)}</p>
              </div>
              <ChevronIcon className="text-neutral-300 group-hover:text-emerald-500 transition-colors" />
            </Link>
          ))}
        </div>
      )}

      {showAddPat && (
        <AddPatientModal
          onClose={() => setShowAddPat(false)}
          onSuccess={(newPatient) => {
            setShowAddPat(false)
            load()
            navigate(`/doctor/patients/${newPatient._id}`)
          }}
        />
      )}

      {showAddRec && (
        <QuickUploadModal
          patients={patients}
          onClose={() => setShowAddRec(false)}
          onSuccess={(patientId) => {
            setShowAddRec(false)
            load()
            navigate(`/doctor/patients/${patientId}`)
          }}
        />
      )}
    </div>
  )
}

/* ── Add Patient Modal ── */
function AddPatientModal({ onClose, onSuccess }) {
  const [form,      setForm]      = useState({ fullName: '', email: '', password: '', phone: '', dateOfBirth: '', bloodGroup: '', genotype: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) return setError('Full name is required')
    if (!form.email.trim())    return setError('Email is required')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')

    setSubmitting(true); setError('')
    try {
      const res = await doctorService.registerPatient({
        fullName:    form.fullName.trim(),
        email:       form.email.trim(),
        password:    form.password,
        phone:       form.phone.trim() || undefined,
        dateOfBirth: form.dateOfBirth  || undefined,
        bloodGroup:  form.bloodGroup   || undefined,
        genotype:    form.genotype     || undefined,
      })
      setSuccess(res.patient)
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response ? `Server error ${err.response.status}` : 'Could not reach server — is the backend running?')
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Register New Patient</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Patient will be added to your list with access granted</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center">
            <CloseIcon />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
              <span className="text-3xl text-emerald-600">✓</span>
            </div>
            <div>
              <p className="text-base font-bold text-neutral-900">{success.fullName} registered</p>
              <p className="text-sm text-neutral-500 mt-1">Patient ID: <span className="font-mono">{success.userId}</span></p>
              <p className="text-xs text-neutral-400 mt-1">Access has been granted to your account.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
              <p className="text-xs font-semibold text-amber-700 mb-1">Share these credentials with the patient</p>
              <p className="text-xs text-amber-800">Email: <span className="font-mono">{success.email}</span></p>
              <p className="text-xs text-amber-800 mt-0.5">Password: as provided during registration</p>
            </div>
            <button
              onClick={() => onSuccess(success)}
              className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              View Patient Records
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)}
                  placeholder="e.g. Chisom Obi"
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="patient@email.com"
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Temporary Password <span className="text-red-500">*</span></label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Phone</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Blood Group</label>
                <select value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">Select…</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Genotype</label>
                <select value={form.genotype} onChange={e => set('genotype', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">Select…</option>
                  {['AA','AS','SS','AC','SC'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? <><Spinner size="xs" /> Registering…</> : 'Register Patient'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ── Quick Upload Modal (select patient + upload) ── */
function QuickUploadModal({ patients, onClose, onSuccess }) {
  const fileRef = useRef(null)
  const [selectedPatient, setSelectedPatient] = useState(patients[0]?._id || '')
  const [file,      setFile]      = useState(null)
  const [dragOver,  setDragOver]  = useState(false)
  const [form,      setForm]      = useState({ title: '', description: '', recordType: 'consultation' })
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(null)

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPatient) return setError('Please select a patient')
    if (!file)            return setError('Please select a file')
    if (!form.title.trim()) return setError('Title is required')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', form.title.trim())
    fd.append('description', form.description.trim())
    fd.append('recordType', form.recordType)

    setUploading(true); setError(''); setProgress(0)
    const interval = setInterval(() => setProgress(p => Math.min(p + 10, 85)), 200)
    try {
      await doctorService.uploadRecord(selectedPatient, fd)
      clearInterval(interval); setProgress(100)
      setSuccess(true)
    } catch (err) {
      clearInterval(interval); setProgress(0)
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const patientName = patients.find(p => p._id === selectedPatient)?.fullName || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Add Medical Record</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Select a patient and upload a file</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center">
            <CloseIcon />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
              <span className="text-3xl text-emerald-600">✓</span>
            </div>
            <div>
              <p className="text-base font-bold text-neutral-900">Record added successfully</p>
              <p className="text-sm text-neutral-500 mt-1">File stored securely.</p>
            </div>
            <button
              onClick={() => onSuccess(selectedPatient)}
              className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              View Patient Records
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {/* Patient selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Patient <span className="text-red-500">*</span></label>
              <select
                value={selectedPatient}
                onChange={e => setSelectedPatient(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Select patient…</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.fullName} — {p.userId}</option>
                ))}
              </select>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-emerald-400 bg-emerald-50' : file ? 'border-emerald-300 bg-emerald-50' : 'border-neutral-200 hover:border-emerald-300 hover:bg-emerald-50/50'
              }`}
            >
              <input ref={fileRef} type="file" className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <div>
                  <FileCheckIcon className="mx-auto mb-2 text-emerald-500 w-8 h-8" />
                  <p className="text-sm font-semibold text-emerald-700">{file.name}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">{fmtBytes(file.size)}</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="mt-2 text-xs text-neutral-400 hover:text-neutral-600">Remove</button>
                </div>
              ) : (
                <div>
                  <UploadIcon className="mx-auto mb-2 text-neutral-300 w-9 h-9" />
                  <p className="text-sm font-medium text-neutral-600">Drop file here or <span className="text-emerald-600">browse</span></p>
                  <p className="text-xs text-neutral-400 mt-1">PDF, Images, Word, Text — max 10 MB</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Record Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setField('title', e.target.value)}
                placeholder="e.g. Full Blood Count — July 2025"
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Record Type</label>
                <select value={form.recordType} onChange={e => setField('recordType', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  {[['lab','Lab Result'],['prescription','Prescription'],['imaging','Imaging'],['consultation','Consultation'],['surgery','Surgery'],['vaccination','Vaccination'],['other','Other']]
                    .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Clinical Notes</label>
                <input type="text" value={form.description} onChange={e => setField('description', e.target.value)}
                  placeholder="Optional summary…"
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            {uploading && (
              <div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-neutral-400 mt-1 text-center">Storing file…</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={uploading}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {uploading ? <><Spinner size="xs" /> Uploading…</> : 'Upload & Secure'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function fmtBytes(b) {
  if (!b) return '—'
  return b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`
}

function SearchIcon({ className })  { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg> }
function PeopleIcon({ className })  { return <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="15" cy="13" r="5"/><path d="M4 34c0-6 4.5-10 11-10s11 4 11 10"/><circle cx="30" cy="13" r="3.5"/><path d="M36 34c0-4-2.5-7-6-8.5"/></svg> }
function ChevronIcon({ className }) { return <svg className={`w-4 h-4 flex-shrink-0 ${className}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg> }
function PlusIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg> }
function UserPlusIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6.5" cy="5" r="3"/><path d="M1 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M12 3v5M9.5 5.5h5"/></svg> }
function CloseIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg> }
function UploadIcon({ className })    { return <svg className={className} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 24V10M11 17l7-7 7 7"/><path d="M6 30h24"/></svg> }
function FileCheckIcon({ className }) { return <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 3H8a3 3 0 00-3 3v20a3 3 0 003 3h16a3 3 0 003-3V12L20 3z"/><path d="M20 3v9h9"/><path d="M11 20l3 3 7-7"/></svg> }
