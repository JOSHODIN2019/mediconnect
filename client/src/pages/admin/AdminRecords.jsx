import { useEffect, useState, useCallback } from 'react'
import { adminService, openFile } from '@/services/adminService'
import { Badge, Spinner, Alert } from '@/components/ui'
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
function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminRecords() {
  const [records,        setRecords]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [filter,         setFilter]         = useState('all')
  const [pendingCount,   setPendingCount]   = useState(0)
  const [verifiedCount,  setVerifiedCount]  = useState(0)
  const [total,          setTotal]          = useState(0)
  const [confirmDelete,  setConfirmDelete]  = useState(null)  // record to delete
  const [toast,          setToast]          = useState(null)  // { type, msg }
  const [expanded,       setExpanded]       = useState(null)

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const data = await adminService.getRecords(params)
      setRecords(data.records || [])
      setTotal(data.total || 0)
      setPendingCount(data.pendingCount || 0)
      setVerifiedCount(data.verifiedCount || 0)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleVerify = async (rec) => {
    try {
      await adminService.verifyRecord(rec._id)
      showToast('success', `"${rec.title}" verified.`)
      load()
    } catch (e) {
      showToast('error', e.response?.data?.message || 'Verification failed')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await adminService.deleteRecord(confirmDelete._id)
      showToast('success', `"${confirmDelete.title}" deleted.`)
      setConfirmDelete(null)
      load()
    } catch (e) {
      showToast('error', e.response?.data?.message || 'Delete failed')
      setConfirmDelete(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Medical Records</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Review and verify all patient records across the system</p>
      </div>

      {/* Stat pills */}
      <div className="flex gap-3 flex-wrap">
        <StatPill label="Total Records" value={pendingCount + verifiedCount} color="blue" icon={<RecordIcon />} />
        <StatPill label="Pending Approval" value={pendingCount} color="amber" icon={<PendingIcon />} />
        <StatPill label="Verified" value={verifiedCount} color="emerald" icon={<VerifyIcon />} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {[
          { key: 'all',      label: `All (${pendingCount + verifiedCount})` },
          { key: 'pending',  label: `Pending (${pendingCount})`             },
          { key: 'verified', label: `Verified (${verifiedCount})`           },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={[
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              filter === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <Alert variant="danger" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Records list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" color="blue" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 py-16 text-center">
          <EmptyIcon className="mx-auto mb-3 text-neutral-200 w-12 h-12" />
          <p className="text-neutral-500 font-medium">No records found</p>
          <p className="text-neutral-400 text-sm mt-1">
            {filter === 'pending' ? 'All records have been verified.' : filter === 'verified' ? 'No verified records yet.' : 'No patient records exist yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(rec => (
            <RecordRow
              key={rec._id}
              rec={rec}
              isOpen={expanded === rec._id}
              onToggle={() => setExpanded(expanded === rec._id ? null : rec._id)}
              onVerify={handleVerify}
              onDelete={setConfirmDelete}
            />
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-11 h-11 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="text-red-600" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 text-center">Delete Record?</h3>
            <p className="text-sm text-neutral-500 text-center mt-2">
              This will permanently remove <span className="font-semibold text-neutral-700">"{confirmDelete.title}"</span> and its file from the server. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

/* ── Record Row ── */
function RecordRow({ rec, isOpen, onToggle, onVerify, onDelete }) {
  const cfg = TYPE_CFG[rec.recordType] || TYPE_CFG.other
  const [actioning, setActioning] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [preview,   setPreview]   = useState(false)

  const doVerify = async (e) => {
    e.stopPropagation()
    setActioning('verify')
    await onVerify(rec)
    setActioning(null)
  }

  const doDownload = async (e) => {
    e && e.stopPropagation()
    setActioning('download')
    setFileError(null)
    try {
      await openFile(adminService.getRecordFile(rec._id), rec.fileName, false)
    } catch (err) {
      setFileError(err.response?.data?.message || 'Could not download file')
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className={`bg-white rounded-xl border transition-all overflow-hidden ${isOpen ? 'border-blue-200 shadow-sm' : 'border-neutral-200 hover:border-blue-100'}`}>
      {/* Row header */}
      <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left" onClick={onToggle}>
        {/* Type icon */}
        <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${typeColor(cfg.color)}`}>
          <DocIcon />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-neutral-900 truncate">{rec.title}</span>
            <TypeBadge color={cfg.color} label={cfg.label} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-neutral-400 truncate">
              {rec.patient?.fullName || 'Unknown patient'}
              {rec.patient?.userId && <span className="text-neutral-300"> · {rec.patient.userId}</span>}
            </span>
            {rec.fileName && <span className="text-neutral-300 text-[10px]">· {rec.fileName}</span>}
          </div>
        </div>

        {/* Right side */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <StatusBadge isVerified={rec.isVerified} />
            <p className="text-[10px] text-neutral-400 mt-1">{fmtDate(rec.createdAt)}</p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
            {!rec.isVerified && (
              <button
                onClick={doVerify}
                disabled={actioning === 'verify'}
                title="Verify record"
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                {actioning === 'verify' ? <Spinner size="xs" /> : <CheckIcon />}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(rec) }}
              title="Delete record"
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
            >
              <TrashIcon />
            </button>
          </div>

          <ChevronIcon open={isOpen} />
        </div>
      </button>

      {/* Expanded detail */}
      {isOpen && (
        <div className="border-t border-neutral-100 px-4 pb-4 pt-3 bg-neutral-50/40 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoField label="Patient"      value={rec.patient?.fullName || '—'} />
            <InfoField label="Patient Email" value={rec.patient?.email || '—'} />
            <InfoField label="Uploaded"     value={fmtDateTime(rec.createdAt)} />
            <InfoField label="File Size"    value={fmt(rec.fileSize)} />
            <InfoField label="Record Type"  value={cfg.label} />
            <InfoField label="Status"       value={rec.isVerified ? 'Verified' : 'Pending Verification'} />
            {rec.uploadedBy  && <InfoField label="Uploaded By" value={`${rec.uploadedBy.fullName} (${rec.uploadedBy.role})`} />}
          </div>

          {fileError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-center gap-2">
              <span>⚠</span>{fileError}
            </div>
          )}

          {/* File action buttons */}
          <div className="flex gap-2 pt-1 flex-wrap">
            {!rec.isVerified && (
              <button
                onClick={doVerify}
                disabled={!!actioning}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60"
              >
                {actioning === 'verify' ? <Spinner size="xs" /> : <CheckIcon />}
                {actioning === 'verify' ? 'Verifying…' : 'Verify Record'}
              </button>
            )}

            {rec.fileName && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setPreview(true) }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <EyeIcon />
                  View File
                </button>
                <button
                  onClick={doDownload}
                  disabled={!!actioning}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 border border-neutral-200 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-60"
                >
                  {actioning === 'download' ? <Spinner size="xs" /> : <DownloadIcon />}
                  Download
                </button>
              </>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onDelete(rec) }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors ml-auto"
            >
              <TrashIcon />
              Delete
            </button>
          </div>

          {preview && (
            <FilePreviewModal
              apiPath={adminService.getRecordFile(rec._id)}
              fileName={rec.fileName}
              onClose={() => setPreview(false)}
              onDownload={doDownload}
            />
          )}
        </div>
      )}
    </div>
  )
}

/* ── Small helpers ── */
function StatPill({ label, value, color, icon }) {
  const colors = {
    blue:    'bg-blue-50 border-blue-100 text-blue-700',
    amber:   'bg-amber-50 border-amber-100 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  }
  return (
    <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold ${colors[color]}`}>
      <span className="opacity-80">{icon}</span>
      <span className="font-bold text-base">{value}</span>
      <span className="font-medium text-xs opacity-70">{label}</span>
    </div>
  )
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
      <p className="text-xs text-neutral-800 mt-0.5 truncate">{value}</p>
    </div>
  )
}

function TypeBadge({ color, label }) {
  const cls = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100', purple: 'bg-purple-50 text-purple-700 border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100', yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    red: 'bg-red-50 text-red-700 border-red-100', teal: 'bg-teal-50 text-teal-700 border-teal-100',
    neutral: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  }
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls[color] || cls.neutral}`}>{label}</span>
}

function StatusBadge({ isVerified }) {
  return isVerified
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold border border-emerald-200">✓ Verified</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-semibold border border-amber-200">⏳ Pending</span>
}

function typeColor(color) {
  const map = {
    blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600', yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-600', teal: 'bg-teal-50 text-teal-600', neutral: 'bg-neutral-100 text-neutral-600',
  }
  return map[color] || map.neutral
}

/* ── Icons ── */
function DocIcon()   { return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9.5 1.5H4A1.5 1.5 0 002.5 3v9A1.5 1.5 0 004 13.5h7a1.5 1.5 0 001.5-1.5V4.5L9.5 1.5z"/><path d="M9.5 1.5V4.5H12.5"/></svg> }
function CheckIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 7l3.5 3.5L11 3.5"/></svg> }
function TrashIcon({ className }) { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}><path d="M2 3.5h9M5 3.5V2.5h3V3.5M4 3.5l.5 7h4l.5-7"/></svg> }
function ChevronIcon({ open }) { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}><path d="M3 5l4 4 4-4"/></svg> }
function EyeIcon()   { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 6.5C1 6.5 3.5 2 6.5 2S12 6.5 12 6.5 9.5 11 6.5 11 1 6.5 1 6.5z"/><circle cx="6.5" cy="6.5" r="1.5"/></svg> }
function DownloadIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 2v7M3.5 6.5l3 3 3-3"/><path d="M1.5 11h10"/></svg> }
function EmptyIcon({ className }) { return <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M30 4H12a4 4 0 00-4 4v32a4 4 0 004 4h24a4 4 0 004-4V18L30 4z"/><path d="M30 4v14h14"/><path d="M18 28h12M18 34h8"/></svg> }
function RecordIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 1.5H4A1.5 1.5 0 002.5 3v8A1.5 1.5 0 004 12.5h6a1.5 1.5 0 001.5-1.5V4.5L9 1.5z"/></svg> }
function PendingIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/></svg> }
function VerifyIcon()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 1L2 3v4c0 3 2 4.5 5 6 3-1.5 5-3 5-6V3L7 1z"/><path d="M4.5 7l2 2L10 5.5"/></svg> }
