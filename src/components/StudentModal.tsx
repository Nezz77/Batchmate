import { useState, useEffect, useRef } from 'react'
import { X, BookOpen, User, Pencil, Check, Trash2, Camera } from 'lucide-react'
import type { Student, CourseResult } from '../types/electron.d'

interface StudentModalProps {
  student: Student | null
  onClose: () => void
  onSave: (id: string, data: Partial<Student>) => void
  onDelete: (id: string) => void
}

export default function StudentModal({ student, onClose, onSave, onDelete }: StudentModalProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    degreeProgramme: '',
    gpa: 0,
    batch: '',
    dateOfBirth: '',
    profileImage: null as string | null
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'results'>('overview')
  const [results, setResults] = useState<CourseResult[]>([])
  const [rankInfo, setRankInfo] = useState<{ rank: number, total: number, degree: string } | null>(null)
  const [photoEnlarged, setPhotoEnlarged] = useState(false)
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (student) {
      const dob = student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().slice(0, 10)
        : ''
      setForm({
        fullName: student.fullName,
        email: student.email || '',
        degreeProgramme: student.degreeProgramme,
        gpa: student.gpa,
        batch: student.batch,
        dateOfBirth: dob,
        profileImage: student.profileImage,
      })
      setEditing(false)
      setActiveTab('overview')
      setPhotoEnlarged(false)
      setClosing(false)

      window.api.students.getResults(student.id).then(setResults).catch(console.error)
      window.api.students.getRank(student.id).then(setRankInfo).catch(console.error)

      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }
  }, [student])

  if (!student) return null

  const dob = new Date(student.dateOfBirth)
  const formattedDob = dob.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleClose = () => {
    setClosing(true)
    setVisible(false)
    setTimeout(() => {
      setClosing(false)
      onClose()
    }, 300)
  }

  const handleSave = () => {
    onSave(student.id, {
      fullName: form.fullName,
      email: form.email || null,
      degreeProgramme: form.degreeProgramme,
      gpa: Number(form.gpa),
      batch: form.batch,
      dateOfBirth: form.dateOfBirth
        ? new Date(form.dateOfBirth + 'T00:00:00').toISOString()
        : student.dateOfBirth,
      profileImage: form.profileImage,
    } as any)
    setEditing(false)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm(prev => ({ ...prev, profileImage: ev.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${student.fullName}?`)) {
      onDelete(student.id)
      handleClose()
    }
  }

  function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  }

  const resultsBySemester = results.reduce((acc, result) => {
    const sem = result.semester || 'Unknown Semester'
    if (!acc[sem]) acc[sem] = []
    acc[sem].push(result)
    return acc
  }, {} as Record<string, CourseResult[]>)

  return (
    <div
      className={`modal-overlay ${visible ? 'modal-overlay-visible' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`modal modal-student ${visible ? 'modal-visible' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="modal-close-btn" onClick={handleClose} title="Close">
          <X size={14} />
        </button>

        {/* Profile Header */}
        <div className={`student-profile-header ${editing ? 'editing' : ''}`}>
          <div
            className={`modal-avatar ${photoEnlarged && !editing ? 'enlarged' : ''}`}
            onClick={() => !editing && setPhotoEnlarged(!photoEnlarged)}
          >
            {(editing ? form.profileImage : student.profileImage) ? (
              <img
                src={(editing ? form.profileImage : student.profileImage)!}
                alt={student.fullName}
                onError={(e) => {
                  const el = e.target as HTMLImageElement
                  el.style.display = 'none'
                }}
              />
            ) : (
              <span>{getInitials(student.fullName)}</span>
            )}
            {editing && (
              <div className="avatar-edit-overlay" onClick={() => fileInputRef.current?.click()}>
                <Camera size={20} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
              </div>
            )}
          </div>

          <div className="student-profile-info">
            {editing ? (
              <div className="edit-name-group">
                <input
                  className="form-input name-input"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Full Name"
                />
                {form.profileImage && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setForm(prev => ({ ...prev, profileImage: null }))}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            ) : (
              <>
                <h2 className="modal-student-name">{student.fullName}</h2>
                <p className="modal-student-index">{student.indexNumber}</p>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={`modal-tabs ${editing ? 'modal-tabs-hidden' : ''}`}>
          <button
            className={`modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <User size={14} />
            Overview
          </button>
          <button
            className={`modal-tab ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <BookOpen size={14} />
            Academic Results
          </button>
        </div>

        {/* Content Area */}
        <div className="modal-content-area">
          {editing ? (
            <div className="edit-form" key="edit">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="student@university.edu"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Programme</label>
                  <select
                    className="filter-select w-full"
                    value={form.degreeProgramme}
                    onChange={e => setForm({ ...form, degreeProgramme: e.target.value })}
                  >
                    <option value="IT">IT</option>
                    <option value="ITM">ITM</option>
                    <option value="AI">AI</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Batch</label>
                  <input
                    className="form-input"
                    value={form.batch}
                    onChange={e => setForm({ ...form, batch: e.target.value })}
                    placeholder="e.g. 24"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GPA</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={form.gpa}
                    onChange={e => setForm({ ...form, gpa: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          ) : activeTab === 'overview' ? (
            <div className="overview-grid" key="overview">
              <div className="info-tile">
                <span className="info-tile-label">Email</span>
                <span className="info-tile-value">{student.email || '—'}</span>
              </div>
              <div className="info-tile">
                <span className="info-tile-label">Date of Birth</span>
                <span className="info-tile-value">{formattedDob}</span>
              </div>
              <div className="info-tile">
                <span className="info-tile-label">Programme</span>
                <span className={`badge badge-${student.degreeProgramme.toLowerCase()}`}>
                  {student.degreeProgramme}
                </span>
              </div>
              <div className="info-tile">
                <span className="info-tile-label">Batch</span>
                <span className="info-tile-value">{student.batch}</span>
              </div>
              <div className="info-tile">
                <span className="info-tile-label">Total Credits</span>
                <span className="info-tile-value">{student.totalCredits || 0} CR</span>
              </div>
              <div className="info-tile">
                <span className="info-tile-label">{student.totalCredits < 15 ? 'SGPA' : 'CGPA'}</span>
                <span
                  className="info-tile-value"
                  style={{
                    fontWeight: 800,
                    fontSize: 18,
                    color: student.gpa >= 3.5
                      ? 'var(--success)'
                      : student.gpa >= 2.5
                      ? 'var(--warning)'
                      : 'var(--danger)'
                  }}
                >
                  {student.gpa.toFixed(2)}
                </span>
              </div>
              {rankInfo && (
                <div className="info-tile info-tile-wide">
                  <span className="info-tile-label">Class Rank</span>
                  <span className="info-tile-value">
                    <span style={{ fontWeight: 800, fontSize: 18 }}>#{rankInfo.rank}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
                      of {rankInfo.total} in {rankInfo.degree}
                    </span>
                  </span>
                </div>
              )}
              <div className="info-tile">
                <span className="info-tile-label">Added</span>
                <span className="info-tile-value">{new Date(student.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="results-tab" key="results" style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '8px' }}>
              {Object.keys(resultsBySemester).length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No academic results found for this student.
                </div>
              ) : (
                Object.entries(resultsBySemester).sort((a, b) => a[0].localeCompare(b[0])).map(([semester, sResults]) => (
                  <div key={semester} style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {semester}
                    </h4>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '8px 0', fontWeight: 600 }}>Subject</th>
                          <th style={{ padding: '8px 0', textAlign: 'center', fontWeight: 600 }}>Credits</th>
                          <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sResults.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>
                              <span style={{ fontWeight: 600 }}>{r.subjectCode}</span>
                              {r.subjectName && (
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                  {r.subjectName}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.credits}</td>
                            <td style={{
                              padding: '8px 0',
                              textAlign: 'right',
                              fontWeight: 700,
                              color: r.grade.startsWith('A')
                                ? '#10b981'
                                : r.grade.includes('F') || r.grade === 'I'
                                ? '#ef4444'
                                : 'var(--text-primary)'
                            }}>
                              {r.grade}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                <Check size={15} /> Save Changes
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <Trash2 size={14} /> Delete
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-secondary" onClick={handleClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                <Pencil size={14} /> Edit Profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
