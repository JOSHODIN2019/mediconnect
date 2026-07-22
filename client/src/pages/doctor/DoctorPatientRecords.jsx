import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doctorService, openFile } from '@/services/doctorService'
import { Spinner, Alert, Badge, Avatar } from '@/components/ui'
import FilePreviewModal from '@/components/FilePreviewModal'

const TYPE_CFG = {
  lab:          { label: 'Lab Result',   color: 'blue'    },
  imaging:      { label: 'Imaging',      color: 'purple'  },
  prescription: { label: 'Prescription', color: 'emerald' },
  consultation: { label: 'Consultation', color: 'yellow'  },
  surgery:      { label: 'Surgery',      color: 'red'     },
  vaccination:  { label: 'Vaccination',  color: 'teal'    },
  other:        { label: 'Other',        color: 'neutral'  },
}
const BADGE_V = { blue: 'info', purple: 'info', emerald: 'success', yellow: 'warning', red: 'danger', teal: 'success', neutral: 'default' }

function fmt(bytes) {
  if (!bytes) return '—'
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function calcAge(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
}
function typeColor(color) {
  const m = { blue:'bg-blue-50 text-blue-600',purple:'bg-purple-50 text-purple-600',emerald:'bg-emerald-50 text-emerald-600',yellow:'bg-yellow-50 text-yellow-700',red:'bg-red-50 text-red-600',teal:'bg-teal-50 text-teal-600',neutral:'bg-neutral-100 text-neutral-600' }
  return m[color] || m.neutral
}

export default function DoctorPatientRecords() {
  const { patientId } = useParams()
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [expanded,   setExpanded]   = useState(null)
  const [filter,     setFilter]     = useState('all')
  const [showUpload, setShowUpload] = useState(false)

  const load = () => {
    setLoading(true)
    doctorService.getPatientRecords(patientId)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [patientId])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" color="blue" /></div>

  if (error) return (
    <div className="p-6 max-w-3xl mx-auto">
      <Alert variant="danger">{error}</Alert>
      <Link to="/doctor/patients" className="mt-4 inline-block text-sm text-emerald-600 hover:underline">← Back to patients</Link>
    </div>
  )

  const { patient, records = [] } = data || {}
  const types  = ['all', ...new Set(records.map(r => r.recordType))]
  const shown  = filter === 'all' ? records : records.filter(r => r.recordType === filter)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Back link */}
      <Link to="/doctor/patients" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 3L5 7l4 4"/></svg>
        Back to patients
      </Link>

      {/* Patient card */}
      {patient && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-center gap-4">
          <Avatar name={patient.fullName} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-neutral-900">{patient.fullName}</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">Access granted</span>
            </div>
            <p className="text-xs font-mono text-neutral-400 mt-0.5">{patient.userId}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-neutral-500">
              {patient.dateOfBirth && <span>{calcAge(patient.dateOfBirth)} years old · DOB: {fmtDate(patient.dateOfBirth)}</span>}
              {patient.phone && <span>{patient.phone}</span>}
              <span>{patient.email}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-2xl font-bold text-neutral-900">{records.length}</p>
              <p className="text-xs text-neutral-400">records</p>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <PlusIcon />
              Add Record
            </button>
          </div>
        </div>
      )}

      {showUpload && (
        <UploadModal
          patientId={patientId}
          patientName={patient?.fullName}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); load() }}
        />
      )}

      {/* Filter tabs */}
      {records.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={['px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                filter === t ? 'bg-emerald-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              ].join(' ')}
            >
              {t === 'all' ? `All (${records.length})` : (TYPE_CFG[t]?.label || t)}
            </button>
          ))}
        </div>
      )}

      {/* Records */}
      {shown.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <p className="text-neutral-400 font-medium">No records found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(rec => (
            <RecordCard
              key={rec._id}
              rec={rec}
              patientId={patientId}
              isOpen={expanded === rec._id}
              onToggle={() => setExpanded(expanded === rec._id ? null : rec._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Record Card ── */
function RecordCard({ rec, patientId, isOpen, onToggle }) {
  const cfg = TYPE_CFG[rec.recordType] || TYPE_CFG.other
  const [fileActioning, setFileActioning] = useState(null)
  const [fileError,     setFileError]     = useState(null)
  const [preview,       setPreview]       = useState(false)

  const handleDownload = async (e) => {
    e && e.stopPropagation()
    setFileActioning('download')
    setFileError(null)
    try {
      await openFile(doctorService.getRecordFile(patientId, rec._id), rec.fileName, false)
    } catch (err) {
      setFileError(err.response?.data?.message || 'Could not download file')
    } finally {
      setFileActioning(null)
    }
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-colors ${isOpen ? 'border-emerald-200' : 'border-neutral-200 hover:border-emerald-200'}`}>
      <button className="w-full flex items-center gap-4 p-4 text-left" onClick={onToggle}>
        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${typeColor(cfg.color)}`}>
          <DocIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-neutral-900">{rec.title}</p>
            <Badge variant={BADGE_V[cfg.color] || 'default'} size="sm">{cfg.label}</Badge>
          </div>
          <p className="text-xs text-neutral-400 truncate mt-0.5">{rec.description}</p>
        </div>
        <div className="flex-shrink-0 text-right space-y-1">
          <div className="flex justify-end gap-1.5">
            {rec.isVerified && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium border border-emerald-200">✓ Verified</span>}
          </div>
          <p className="text-xs text-neutral-400">{fmtDate(rec.createdAt)}</p>
          <p className="text-[10px] text-neutral-300">{fmt(rec.fileSize)}</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={`transition-transform flex-shrink-0 ml-1 ${isOpen ? 'rotate-180' : ''}`}><path d="M3 5l4 4 4-4"/></svg>
      </button>

      {isOpen && (
        <div className="border-t border-neutral-100 px-4 pb-4 pt-3 space-y-3 bg-neutral-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoField label="File Name"   value={rec.fileName || '—'} mono />
            <InfoField label="File Size"   value={fmt(rec.fileSize)} />
            <InfoField label="Date"        value={fmtDate(rec.createdAt)} />
            <InfoField label="Uploaded By" value={rec.uploadedBy?.fullName || '—'} />
            <InfoField label="Type"        value={cfg.label} />
            <InfoField label="Status"      value={rec.isVerified ? 'Verified' : 'Pending'} />
          </div>

          {/* File error */}
          {fileError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-center gap-2">
              <span>⚠</span>{fileError}
            </div>
          )}

          {/* File actions */}
          {rec.fileName && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={(e) => { e.stopPropagation(); setPreview(true) }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <EyeIcon />
                View File
              </button>
              <button
                onClick={handleDownload}
                disabled={!!fileActioning}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 border border-neutral-200 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-60"
              >
                {fileActioning === 'download' ? <Spinner size="xs" /> : <DownloadIcon />}
                Download
              </button>
            </div>
          )}

          {preview && (
            <FilePreviewModal
              apiPath={doctorService.getRecordFile(patientId, rec._id)}
              fileName={rec.fileName}
              onClose={() => setPreview(false)}
              onDownload={handleDownload}
            />
          )}
        </div>
      )}
    </div>
  )
}

function InfoField({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xs text-neutral-800 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
function DocIcon()      { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V5L10 1.5z"/><path d="M10 1.5V5H13.5"/></svg> }
function EyeIcon()      { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 6.5C1 6.5 3.5 2 6.5 2S12 6.5 12 6.5 9.5 11 6.5 11 1 6.5 1 6.5z"/><circle cx="6.5" cy="6.5" r="1.5"/></svg> }
function DownloadIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 2v7M3.5 6.5l3 3 3-3"/><path d="M1.5 11h10"/></svg> }
function PlusIcon()     { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6.5 2v9M2 6.5h9"/></svg> }
function CloseIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg> }
function UploadBigIcon({ className }) { return <svg className={className} width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 24V10M11 17l7-7 7 7"/><path d="M6 30h24"/></svg> }
function FileSelectedIcon({ className }) { return <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 3H8a3 3 0 00-3 3v20a3 3 0 003 3h16a3 3 0 003-3V12L20 3z"/><path d="M20 3v9h9"/><path d="M11 20l3 3 7-7"/></svg> }

const TYPE_OPTIONS = [
  ['lab', 'Lab Result'], ['prescription', 'Prescription'], ['imaging', 'Imaging'],
  ['consultation', 'Consultation'], ['surgery', 'Surgery'], ['vaccination', 'Vaccination'], ['other', 'Other'],
]
function fmtBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

/* ── Upload Modal ── */
function UploadModal({ patientId, patientName, onClose, onSuccess }) {
  const fileRef = useRef(null)
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
    if (!file) return setError('Please select a file')
    if (!form.title.trim()) return setError('Title is required')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', form.title.trim())
    fd.append('description', form.description.trim())
    fd.append('recordType', form.recordType)

    setUploading(true); setError(''); setProgress(0)
    const interval = setInterval(() => setProgress(p => Math.min(p + 10, 85)), 200)
    try {
      const res = await doctorService.uploadRecord(patientId, fd)
      clearInterval(interval); setProgress(100)
      setSuccess(res)
    } catch (err) {
      clearInterval(interval); setProgress(0)
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Add Medical Record</h2>
            <p className="text-xs text-neutral-400 mt-0.5">For {patientName} — file will be stored securely</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center">
            <CloseIcon />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-6 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl text-emerald-600">✓</span>
              </div>
              <p className="text-base font-bold text-neutral-900">Record Added Successfully</p>
              <p className="text-sm text-neutral-500 mt-1">The file has been stored securely.</p>
            </div>
            <button onClick={onSuccess} className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
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
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.txt"
                onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <div>
                  <FileSelectedIcon className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-700">{file.name}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">{fmtBytes(file.size)}</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="mt-2 text-xs text-neutral-400 hover:text-neutral-600">Remove</button>
                </div>
              ) : (
                <div>
                  <UploadBigIcon className="mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm font-medium text-neutral-600">Drop file here or <span className="text-emerald-600">browse</span></p>
                  <p className="text-xs text-neutral-400 mt-1">PDF, Images, Word, Text — max 10 MB</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Record Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setField('title', e.target.value)}
                placeholder="e.g. Full Blood Count — July 2025"
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Record Type</label>
              <select value={form.recordType} onChange={e => setField('recordType', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                {TYPE_OPTIONS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Clinical Notes <span className="text-neutral-400">(optional)</span></label>
              <textarea value={form.description} onChange={e => setField('description', e.target.value)}
                rows={2} placeholder="Brief clinical summary or findings…"
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
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
