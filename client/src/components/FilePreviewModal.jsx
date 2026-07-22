import { useEffect, useState, useCallback } from 'react'
import api from '@/services/authService'
import { Spinner } from '@/components/ui'

/**
 * Full-page modal that previews any file fetched through the authenticated
 * API. Renders PDFs, images, and text inline; falls back to a download prompt
 * for unsupported types.
 *
 * Props:
 *   apiPath  — API path e.g. '/patient/records/:id/file'
 *   fileName — display name shown in the header
 *   onClose  — called when the user dismisses the modal
 *   onDownload (optional) — called when the user clicks Download
 */
export default function FilePreviewModal({ apiPath, fileName, onClose, onDownload }) {
  const [blobUrl,     setBlobUrl]     = useState(null)
  const [contentType, setContentType] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Fetch the file
  useEffect(() => {
    let url = null
    setLoading(true)
    setError(null)

    api.get(apiPath, { responseType: 'blob' })
      .then(res => {
        const ct = res.headers['content-type'] || 'application/octet-stream'
        setContentType(ct)
        const blob = new Blob([res.data], { type: ct })
        url = URL.createObjectURL(blob)
        setBlobUrl(url)
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Could not load file')
      })
      .finally(() => setLoading(false))

    return () => { if (url) URL.revokeObjectURL(url) }
  }, [apiPath])

  const isImage = contentType?.startsWith('image/')
  const isText  = contentType?.startsWith('text/')
  const isPdf   = contentType === 'application/pdf'
  const canPreview = isImage || isText || isPdf

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal panel — stop clicks propagating to backdrop */}
      <div
        className="relative flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ margin: '24px auto', width: 'min(960px, calc(100vw - 48px))', height: 'calc(100vh - 48px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-200 bg-neutral-50 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileIcon />
          </div>
          <span className="flex-1 text-sm font-semibold text-neutral-800 truncate">{fileName}</span>
          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <DownloadIcon />
              Download
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-neutral-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 relative bg-neutral-100">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white">
              <Spinner size="lg" color="blue" />
              <p className="text-sm text-neutral-400">Loading file…</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                <span className="text-red-500 text-xl">!</span>
              </div>
              <p className="text-sm font-medium text-neutral-700">Could not load file</p>
              <p className="text-xs text-neutral-400">{error}</p>
            </div>
          )}

          {blobUrl && canPreview && (
            isImage ? (
              <div className="absolute inset-0 flex items-center justify-center p-4 bg-neutral-100">
                <img
                  src={blobUrl}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              </div>
            ) : (
              <iframe
                src={blobUrl}
                title={fileName}
                className="absolute inset-0 w-full h-full border-none bg-white"
              />
            )
          )}

          {blobUrl && !canPreview && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <FileIcon size={28} />
              </div>
              <p className="text-sm font-medium text-neutral-700">Preview not available for this file type</p>
              <p className="text-xs text-neutral-400">{contentType}</p>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <DownloadIcon />
                  Download to view
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FileIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V5L10 1.5z"/><path d="M10 1.5V5H13.5"/></svg>
}
function CloseIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
}
function DownloadIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 2v7M3.5 6.5l3 3 3-3"/><path d="M1.5 11h10"/></svg>
}
