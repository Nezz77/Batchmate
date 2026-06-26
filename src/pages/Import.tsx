import { useState, useRef } from 'react'
import { Upload, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import type { ImportResult } from '../types/electron.d'

// Mappings from common Excel column names to our schema fields
const AUTO_MAP: Record<string, string> = {
  'index number': 'indexNumber',
  'index no': 'indexNumber',
  'student id': 'indexNumber',
  'display name': 'fullName',
  'full name': 'fullName',
  'name': 'fullName',
  'email': 'email',
  'email address': 'email',
  'date of birth': 'dateOfBirth',
  'dob': 'dateOfBirth',
  'birthday': 'dateOfBirth',
  'photo': 'profileImage',
  'photo url': 'profileImage',
  'upload your photo': 'profileImage',
  'profile image': 'profileImage',
  'programme': 'degreeProgramme',
  'degree programme': 'degreeProgramme',
  'program': 'degreeProgramme',
  'gpa': 'gpa',
  'batch': 'batch',
}

const SCHEMA_FIELDS = [
  { key: 'indexNumber', label: 'Index Number', required: true },
  { key: 'fullName', label: 'Full Name', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'dateOfBirth', label: 'Date of Birth', required: true },
  { key: 'profileImage', label: 'Profile Image URL', required: false },
  { key: 'degreeProgramme', label: 'Degree Programme', required: false },
  { key: 'batch', label: 'Batch', required: false },
  { key: 'gpa', label: 'GPA', required: false },
]

export default function Import() {
  const [step, setStep] = useState<'drop' | 'mapping' | 'importing' | 'done'>('drop')
  const [filePath, setFilePath] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<Record<string, any>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragging, setDragging] = useState(false)
  const [defaultProgramme, setDefaultProgramme] = useState('IT')
  const [defaultBatch, setDefaultBatch] = useState('24')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (path: string) => {
    try {
      const parsed = await window.api.excel.parse(path)
      setFilePath(path)
      setHeaders(parsed.headers)
      setRawData(parsed.data)

      // Auto-map columns
      const autoMapping: Record<string, string> = {}
      for (const header of parsed.headers) {
        const normalized = header.toLowerCase().replace(/\s+/g, ' ').trim()
        for (const [key, field] of Object.entries(AUTO_MAP)) {
          if (normalized.includes(key)) {
            autoMapping[header] = field
            break
          }
        }
      }
      setMapping(autoMapping)
      setStep('mapping')
    } catch (err) {
      console.error('Failed to parse Excel file:', err)
    }
  }

  const handleDropZoneClick = async () => {
    const path = await window.api.dialog.openFile({
      filters: [{ name: 'Excel/CSV', extensions: ['xlsx', 'xls', 'csv'] }],
    })
    if (path) handleFile(path)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0].path || (files[0] as any).webkitRelativePath || files[0].name)
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setStep('importing')

    // Transform rows using the mapping
    const records = rawData.map(row => {
      const record: Record<string, any> = {
        degreeProgramme: defaultProgramme,
        batch: defaultBatch,
      }
      for (const [header, field] of Object.entries(mapping)) {
        if (field && row[header] !== undefined && row[header] !== '') {
          record[field] = row[header]
        }
      }
      return record
    }).filter(r => r.indexNumber && r.fullName)

    // Simulate progress animation
    let prog = 0
    const progressInterval = setInterval(() => {
      prog = Math.min(prog + 5, 90)
      setProgress(prog)
    }, 100)

    const result = await window.api.students.importBulk(records)

    clearInterval(progressInterval)
    setProgress(100)
    setResult(result)
    setImporting(false)
    setStep('done')
  }

  const reset = () => {
    setStep('drop')
    setFilePath('')
    setHeaders([])
    setRawData([])
    setMapping({})
    setResult(null)
    setProgress(0)
  }

  const fileName = filePath.split('/').pop() || filePath

  return (
    <div>
      <div className="page-header animate-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Import Data</h1>
            <p className="page-subtitle">Import students from an Excel or CSV file</p>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
            onClick={async () => {
              if (confirm('Are you sure you want to delete all students? This cannot be undone.')) {
                await window.api.students.deleteAll()
                alert('All data deleted successfully')
              }
            }}
          >
            Delete All Data
          </button>
        </div>
      </div>

      {/* Step: Drop */}
      {step === 'drop' && (
        <div className="animate-in">
          <div
            className={`drop-zone ${dragging ? 'active' : ''}`}
            onClick={handleDropZoneClick}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="drop-zone-icon" />
            <h2 className="drop-zone-title">Drop your Excel file here</h2>
            <p className="drop-zone-subtitle">
              Or click to browse · Supports .xlsx, .xls, .csv
            </p>
            <button
              id="browse-file-btn"
              className="btn btn-primary"
              style={{ marginTop: 20 }}
              onClick={e => { e.stopPropagation(); handleDropZoneClick() }}
            >
              Browse File
            </button>
          </div>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} />
        </div>
      )}

      {/* Step: Column Mapping */}
      {step === 'mapping' && (
        <div className="animate-in">
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <CheckCircle size={20} color="var(--success)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fileName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {rawData.length} rows · {headers.length} columns
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
              Column Mapping
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
              Map your spreadsheet columns to the student fields below. Required fields are marked with *.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '12px 16px', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Excel Column
              </div>
              <div />
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Maps To
              </div>

              {headers.map(header => (
                <>
                  <div key={`src-${header}`} className="mapping-source">{header}</div>
                  <ArrowRight size={16} color="var(--accent-primary)" style={{ justifySelf: 'center' }} />
                  <select
                    key={`map-${header}`}
                    className="filter-select w-full"
                    value={mapping[header] || ''}
                    onChange={e => setMapping(m => ({ ...m, [header]: e.target.value }))}
                  >
                    <option value="">— Skip —</option>
                    {SCHEMA_FIELDS.map(f => (
                      <option key={f.key} value={f.key}>
                        {f.label}{f.required ? ' *' : ''}
                      </option>
                    ))}
                  </select>
                </>
              ))}
            </div>

            {/* Defaults */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Defaults (for rows without these values)
              </h4>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Default Programme</label>
                  <select
                    id="default-programme"
                    className="filter-select"
                    value={defaultProgramme}
                    onChange={e => setDefaultProgramme(e.target.value)}
                  >
                    <option value="IT">IT</option>
                    <option value="ITM">ITM</option>
                    <option value="AI">AI</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Default Batch</label>
                  <input
                    id="default-batch"
                    className="form-input"
                    value={defaultBatch}
                    onChange={e => setDefaultBatch(e.target.value)}
                    style={{ width: 100 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              Preview (first 5 rows)
            </h4>
            <div className="data-table-wrapper" style={{ maxHeight: 200, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {headers.slice(0, 6).map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {headers.slice(0, 6).map(h => (
                        <td key={h}>{String(row[h] ?? '—').slice(0, 60)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button id="cancel-import-btn" className="btn btn-secondary" onClick={reset}>
              Cancel
            </button>
            <button
              id="start-import-btn"
              className="btn btn-primary"
              onClick={handleImport}
              disabled={!Object.values(mapping).includes('indexNumber') || !Object.values(mapping).includes('fullName')}
            >
              Import {rawData.length} Records
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="card animate-in" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
            Importing…
          </h2>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 24 }}>
            Processing {rawData.length} records
          </p>
          <div className="progress-bar" style={{ maxWidth: 320, margin: '0 auto' }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 10 }}>{progress}%</p>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && result && (
        <div className="card animate-in" style={{ textAlign: 'center', padding: '60px 40px' }}>
          {result.errors === 0 ? (
            <CheckCircle size={52} color="var(--success)" style={{ margin: '0 auto 20px' }} />
          ) : (
            <AlertCircle size={52} color="var(--warning)" style={{ margin: '0 auto 20px' }} />
          )}
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
            Import Complete
          </h2>

          <div className="import-stats" style={{ justifyContent: 'center', marginTop: 24 }}>
            <div className="import-stat">
              <strong style={{ color: 'var(--success)' }}>{result.success}</strong> Imported
            </div>
            <div className="import-stat">
              <strong style={{ color: result.errors > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                {result.errors}
              </strong> Failed
            </div>
            <div className="import-stat">
              <strong>{result.total}</strong> Total
            </div>
          </div>

          {result.errorDetails.length > 0 && (
            <div style={{
              marginTop: 20, padding: '12px 16px', background: 'var(--danger-muted)',
              borderRadius: 'var(--radius-md)', textAlign: 'left', fontSize: 12,
              color: 'var(--danger)', maxHeight: 120, overflowY: 'auto',
            }}>
              {result.errorDetails.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
            <button id="import-again-btn" className="btn btn-secondary" onClick={reset}>
              Import Another File
            </button>
            <button
              id="view-students-btn"
              className="btn btn-primary"
              onClick={() => window.location.hash = '/students'}
            >
              View Students
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
