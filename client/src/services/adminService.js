import api from './authService'

/**
 * Fetch a file via the authenticated axios instance and either open it
 * inline in a new tab or trigger a browser download.
 *
 * For "view": the window is opened synchronously (before the fetch) so popup
 * blockers don't kill it, then we redirect it to the blob URL once ready.
 * For "download": the <a> is appended to the DOM before .click() for
 * cross-browser compatibility.
 *
 * @param {string}  url      API path (e.g. '/admin/records/abc/file')
 * @param {string}  filename Suggested filename for download
 * @param {boolean} inline   true = open in new tab, false = force download
 */
export async function openFile(url, filename = 'file', inline = false) {
  // Open the window synchronously (inside the click-handler stack) so popup
  // blockers treat it as a user gesture. No 'noopener' — we need to write
  // into the document to embed the PDF for inline display.
  const win = inline ? window.open('', '_blank') : null

  try {
    const res = await api.get(url, { responseType: 'blob' })
    const contentType = res.headers['content-type'] || 'application/octet-stream'
    const blob    = new Blob([res.data], { type: contentType })
    const blobUrl = URL.createObjectURL(blob)

    if (inline && win) {
      // Write an <embed> into the new tab so the browser uses its native
      // PDF / image viewer instead of triggering a download.
      const safeTitle = filename.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      win.document.open()
      win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #404040; }
    embed, img { display: block; width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <embed src="${blobUrl}" type="${contentType}">
</body>
</html>`)
      win.document.close()
      // Revoke after 2 minutes — enough time to load the file
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120000)
    } else {
      // Force download
      if (win) win.close()
      const a = document.createElement('a')
      a.href     = blobUrl
      a.download = filename || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
    }
  } catch (err) {
    if (win) win.close()
    throw err
  }
}

export const adminService = {
  getStats:       ()         => api.get('/admin/stats').then(r => r.data),
  getDoctors:     ()         => api.get('/admin/doctors').then(r => r.data),
  registerDoctor: (data)     => api.post('/admin/doctors', data).then(r => r.data),
  updateDoctor:   (id, data) => api.patch(`/admin/doctors/${id}`, data).then(r => r.data),
  deleteDoctor:   (id)       => api.delete(`/admin/doctors/${id}`).then(r => r.data),
  getPatients:    ()         => api.get('/admin/patients').then(r => r.data),
  getAuditLogs:  (params) => api.get('/admin/audit', { params }).then(r => r.data),
  getRecords:    (params) => api.get('/admin/records', { params }).then(r => r.data),
  verifyRecord:  (id)     => api.patch(`/admin/records/${id}/verify`).then(r => r.data),
  deleteRecord:  (id)     => api.delete(`/admin/records/${id}`).then(r => r.data),
  getRecordFile:    (id)     => `/admin/records/${id}/file`,
}
