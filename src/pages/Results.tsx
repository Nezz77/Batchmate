import { useState, useEffect, useRef } from 'react'
import { FileText, Upload, Trash2, ExternalLink } from 'lucide-react'
import type { ResultSheet } from '../types/electron.d'

export default function Results() {
  const [sheets, setSheets] = useState<ResultSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    batch: '24',
    semester: '1',
    subjectCode: '',
    subjectName: '',
  })

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    loadSheets()
  }, [])

  const loadSheets = async () => {
    setLoading(true)
    const data = await window.api.resultSheets.getAll()
    setSheets(data)
    setLoading(false)
  }

  const handleUploadFile = async (file: File) => {
    setUploading(true)
    try {
      const buffer = await file.arrayBuffer()
      await window.api.resultSheets.save({
        filename: file.name,
        buffer,
        batch: uploadForm.batch,
        semester: uploadForm.semester,
        subjectCode: uploadForm.subjectCode || undefined,
        subjectName: uploadForm.subjectName || undefined,
      })
      showToast('Result sheet uploaded successfully')
      setShowUpload(false)
      loadSheets()
    } catch {
      showToast('Failed to upload result sheet', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleBrowseAndUpload = async () => {
    const path = await window.api.dialog.openFile({
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
    })
    if (!path) return

    setUploading(true)
    try {
      const buffer = await window.api.fs.readFile(path)
      await window.api.resultSheets.save({
        filename: path.split('/').pop() || 'result.pdf',
        buffer: new Uint8Array(buffer).buffer,
        batch: uploadForm.batch,
        semester: uploadForm.semester,
        subjectCode: uploadForm.subjectCode || undefined,
        subjectName: uploadForm.subjectName || undefined,
      })
      showToast('Result sheet uploaded successfully')
      setShowUpload(false)
      loadSheets()
    } catch {
      showToast('Failed to upload result sheet', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    await window.api.resultSheets.delete(id)
    showToast('Result sheet deleted')
    loadSheets()
  }

  const handleOpen = async (id: string) => {
    await window.api.resultSheets.open(id)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div>
      <div className="page-header animate-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Result Sheets</h1>
            <p className="page-subtitle">Manage and view PDF result sheets for each semester</p>
          </div>
          <button
            id="upload-result-btn"
            className="btn btn-primary"
            onClick={() => setShowUpload(true)}
          >
            <Upload size={16} />
            Upload PDF
          </button>
        </div>
      </div>

      {/* Upload Panel */}
      {showUpload && (
        <div className="card animate-in" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
            Upload Result Sheet
          </h3>

          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Batch</label>
              <input
                id="result-batch"
                className="form-input"
                value={uploadForm.batch}
                onChange={e => setUploadForm({ ...uploadForm, batch: e.target.value })}
                placeholder="e.g. 24"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <select
                id="result-semester"
                className="filter-select w-full"
                value={uploadForm.semester}
                onChange={e => setUploadForm({ ...uploadForm, semester: e.target.value })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={String(n)}>Semester {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Subject Code (optional)</label>
              <input
                id="result-subject-code"
                className="form-input"
                value={uploadForm.subjectCode}
                onChange={e => setUploadForm({ ...uploadForm, subjectCode: e.target.value })}
                placeholder="e.g. IN1611"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Name (optional)</label>
              <input
                id="result-subject-name"
                className="form-input"
                value={uploadForm.subjectName}
                onChange={e => setUploadForm({ ...uploadForm, subjectName: e.target.value })}
                placeholder="e.g. Multimedia Technologies"
              />
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className={`drop-zone ${dragging ? 'active' : ''}`}
            style={{ padding: '32px 40px' }}
            onClick={handleBrowseAndUpload}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault()
              setDragging(false)
              if (e.dataTransfer.files[0]) handleUploadFile(e.dataTransfer.files[0])
            }}
          >
            <FileText className="drop-zone-icon" style={{ width: 40, height: 40 }} />
            <h3 className="drop-zone-title">Drop PDF here or click to browse</h3>
            <p className="drop-zone-subtitle">PDF files only</p>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setShowUpload(false)}>
              Cancel
            </button>
            <button
              id="browse-pdf-btn"
              className="btn btn-primary"
              onClick={handleBrowseAndUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Browse & Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Result Sheets Grid */}
      {loading ? (
        <div className="results-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : sheets.length === 0 ? (
        <div className="empty-state animate-in">
          <FileText className="empty-state-icon" />
          <h2 className="empty-state-title">No result sheets yet</h2>
          <p className="empty-state-text">
            Upload PDF result sheets to keep them organized by batch and semester.
          </p>
          <button
            id="upload-first-btn"
            className="btn btn-primary"
            style={{ marginTop: 20 }}
            onClick={() => setShowUpload(true)}
          >
            <Upload size={16} />
            Upload First Sheet
          </button>
        </div>
      ) : (
        <div className="results-grid animate-in">
          {sheets.map(sheet => (
            <div key={sheet.id} className="result-card">
              <div className="result-card-icon">
                <FileText size={22} />
              </div>
              <div className="result-card-name">{sheet.filename}</div>
              <div className="result-card-meta">
                <span>Batch {sheet.batch} · Semester {sheet.semester}</span>
                {sheet.subjectCode && <span>{sheet.subjectCode} — {sheet.subjectName}</span>}
                <span style={{ color: 'var(--text-tertiary)' }}>{formatDate(sheet.uploadedAt)}</span>
              </div>
              <div className="result-card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => handleOpen(sheet.id)}
                >
                  <ExternalLink size={14} />
                  Open
                </button>
                <button
                  className="btn btn-ghost btn-icon"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => handleDelete(sheet.id, sheet.filename)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  )
}
