import { useEffect, useState } from 'react'
import { patientService, openFile } from '@/services/patientService'
import { Card, CardBody, Badge, Spinner, Alert } from '@/components/ui'
import FilePreviewModal from '@/components/FilePreviewModal'

const TYPE_CFG = {
  lab:          { label: 'Lab Result',    color: 'blue'    },
  imaging:      { label: 'Imaging',       color: 'purple'  },
  prescription: { label: 'Prescription',  color: 'emerald' },
  consultation: { label: 'Consultation',  color: 'yellow'  },
  surgery:      { label: 'Surgery',       color: 'red'     },
  vaccination:  { label: 'Vaccination',   color: 'teal'    },
  other:        { label: 'Other',         color: 'neutral' },
}

function fmt(bytes) {
  if (!bytes) return '—'
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const BADGE_VARIANT = {
  blue: 'info', purple: 'info', emerald: 'success',
  yellow: 'warning', red: 'danger', teal: 'success', neutral: 'default',
}

export default function PatientRecords() {
  const [records,  setRecords]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [filter,   setFilter]   = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    patientService.getRecords()
      .then(r => setRecords(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const types = ['all', ...Object.keys(TYPE_CFG)]
  const shown = filter === 'all' ? records : records.filter(r => r.recordType === filter)

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" color="blue" /></div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">My Medical Records</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {records.length} record{records.length !== 1 ? 's' : ''} — added by your treating physicians
        </p>
      </div>

      {error && <Alert variant="danger" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
              filter === t
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50',
            ].join(' ')}
          >
            {t === 'all' ? `All (${records.length})` : TYPE_CFG[t].label}
          </button>
        ))}
      </div>

      {/* Record list */}
      {shown.length === 0 ? (
        <Card><CardBody>
          <div className="py-12 text-center">
            <FileIcon className="mx-auto mb-3 text-neutral-300 w-10 h-10" />
            <p className="text-neutral-500 font-medium">No records yet</p>
            <p className="text-neutral-400 text-sm mt-1">
              Records uploaded by your doctor will appear here.
            </p>
          </div>
        </CardBody></Card>
      ) : (
        <div className="space-y-3">
          {shown.map(rec => (
            <RecordCard
              key={rec._id}
              rec={rec}
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
function RecordCard({ rec, isOpen, onToggle }) {
  const cfg = TYPE_CFG[rec.recordType] || TYPE_CFG.other
  const [fileActioning, setFileActioning] = useState(null)
  const [fileError,     setFileError]     = useState(null)
  const [preview,       setPreview]       = useState(false)

  const handleDownload = async (e) => {
    e && e.stopPropagation()
    setFileActioning('download')
    setFileError(null)
    try {
      await openFile(patientService.getRecordFile(rec._id), rec.fileName, false)
    } catch (err) {
      setFileError(err.response?.data?.message || 'Could not download file')
    } finally {
      setFileActioning(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border transition-colors overflow-hidden border-neutral-200 hover:border-blue-200">
      <button className="w-full flex items-center gap-4 p-4 text-left" onClick={onToggle}>
        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${typeColor(cfg.color)}`}>
          <DocIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-neutral-900">{rec.title}</p>
            <Badge variant={BADGE_VARIANT[cfg.color] || 'default'} size="sm">{cfg.label}</Badge>
          </div>
          <p className="text-xs text-neutral-400 truncate mt-0.5">
            {rec.uploadedBy?.fullName ? `Added by ${rec.uploadedBy.fullName}` : rec.description || '—'}
          </p>
        </div>
        <div className="flex-shrink-0 text-right space-y-1">
          <div className="flex justify-end gap-1.5">
            {rec.isVerified && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium border border-emerald-200">✓ Verified</span>}
          </div>
          <p className="text-xs text-neutral-400">{fmtDate(rec.createdAt)}</p>
        </div>
        <ChevronIcon open={isOpen} />
      </button>

      {preview && (
        <FilePreviewModal
          apiPath={patientService.getRecordFile(rec._id)}
          fileName={rec.fileName}
          onClose={() => setPreview(false)}
          onDownload={handleDownload}
        />
      )}

      {isOpen && (
        <div className="border-t border-neutral-100 px-4 pb-4 pt-3 space-y-3 bg-neutral-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoField label="File Name"   value={rec.fileName   || '—'} mono />
            <InfoField label="File Size"   value={fmt(rec.fileSize)} />
            <InfoField label="Date Added"  value={fmtDate(rec.createdAt)} />
            <InfoField label="Added By"    value={rec.uploadedBy?.fullName || '—'} />
            <InfoField label="Type"        value={cfg.label} />
            <InfoField label="Status"      value={rec.isVerified ? 'Verified' : 'Pending Verification'} />
          </div>

          {fileError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-center gap-2">
              <span>⚠</span>{fileError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {rec.fileName && (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Helpers ── */
function typeColor(color) {
  const map = {
    blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600', yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-600', teal: 'bg-teal-50 text-teal-600', neutral: 'bg-neutral-100 text-neutral-600',
  }
  return map[color] || map.neutral
}
function InfoField({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xs text-neutral-800 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

/* ── Icons ── */
function ChevronIcon({ open }) { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}><path d="M3 5l4 4 4-4"/></svg> }
function DocIcon()        { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V5L10 1.5z"/><path d="M10 1.5V5H13.5"/></svg> }
function FileIcon({ className }) { return <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M26 4H10a3 3 0 00-3 3v26a3 3 0 003 3h20a3 3 0 003-3V14L26 4z"/><path d="M26 4v10h10"/></svg> }
function EyeIcon()        { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 6.5C1 6.5 3.5 2 6.5 2S12 6.5 12 6.5 9.5 11 6.5 11 1 6.5 1 6.5z"/><circle cx="6.5" cy="6.5" r="1.5"/></svg> }
function DownloadIcon()   { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 2v7M3.5 6.5l3 3 3-3"/><path d="M1.5 11h10"/></svg> }
