import { useState, useEffect } from 'react'
import { X, BookOpen, User } from 'lucide-react'
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
    profileImage: null as string | null
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'results'>('overview')
  const [results, setResults] = useState<CourseResult[]>([])
  const [photoEnlarged, setPhotoEnlarged] = useState(false)

  useEffect(() => {
    if (student) {
      setForm({
        fullName: student.fullName,
        email: student.email || '',
        degreeProgramme: student.degreeProgramme,
        gpa: student.gpa,
        batch: student.batch,
        profileImage: student.profileImage,
      })
      setEditing(false)
      setActiveTab('overview')
      setPhotoEnlarged(false)
      
      // Fetch results
      window.api.students.getResults(student.id).then(setResults).catch(console.error)
    }
  }, [student])

  if (!student) return null

  const dob = new Date(student.dateOfBirth)
  const formattedDob = dob.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleSave = () => {
    onSave(student.id, {
      fullName: form.fullName,
      email: form.email || null,
      degreeProgramme: form.degreeProgramme,
      gpa: Number(form.gpa),
      batch: form.batch,
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
      onClose()
    }
  }

  function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  }

  // Group results by semester
  const resultsBySemester = results.reduce((acc, result) => {
    const sem = result.semester || 'Unknown Semester'
    if (!acc[sem]) acc[sem] = []
    acc[sem].push(result)
    return acc
  }, {} as Record<string, CourseResult[]>)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Student Profile</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Avatar + Name Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div 
              className="student-avatar" 
              style={{ 
                width: photoEnlarged ? 180 : 72, 
                height: photoEnlarged ? 180 : 72, 
                fontSize: photoEnlarged ? 64 : 28,
                cursor: 'pointer',
                boxShadow: photoEnlarged ? '0 10px 25px rgba(0,0,0,0.5)' : 'none',
                flexShrink: 0,
                marginTop: photoEnlarged ? '20px' : '0',
                marginBottom: photoEnlarged ? '20px' : '0'
              }}
              onClick={() => setPhotoEnlarged(!photoEnlarged)}
            >
              {(editing ? form.profileImage : student.profileImage) ? (
                <img
                  src={(editing ? form.profileImage : student.profileImage)!}
                  alt={student.fullName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                    ;(e.target as HTMLImageElement).parentElement!.textContent = getInitials(student.fullName)
                  }}
                />
              ) : (
                getInitials(student.fullName)
              )}
            </div>
            <div>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    className="form-input"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    style={{ fontSize: '18px', fontWeight: 600 }}
                  />
                  <div>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                      Change Photo
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                    </label>
                    {form.profileImage && (
                      <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => setForm(prev => ({ ...prev, profileImage: null }))}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {student.fullName}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {student.indexNumber}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          {!editing && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <button 
                className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('overview')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <User size={14} /> Overview
              </button>
              <button 
                className={`btn btn-sm ${activeTab === 'results' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('results')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <BookOpen size={14} /> Academic Results
              </button>
            </div>
          )}

          {/* Details */}
          {editing ? (
            <>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-row">
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
              <div className="form-group">
                <label className="form-label">Batch</label>
                <input
                  className="form-input"
                  value={form.batch}
                  onChange={e => setForm({ ...form, batch: e.target.value })}
                />
              </div>
            </>
          ) : activeTab === 'overview' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <span className="form-label">Email</span>
                <span style={{ color: 'var(--text-primary)' }}>{student.email || '—'}</span>
              </div>
              <div className="form-group">
                <span className="form-label">Date of Birth</span>
                <span style={{ color: 'var(--text-primary)' }}>{formattedDob}</span>
              </div>
              <div className="form-group">
                <span className="form-label">Programme</span>
                <span style={{ color: 'var(--text-primary)' }}>{student.degreeProgramme}</span>
              </div>
              <div className="form-group">
                <span className="form-label">Batch</span>
                <span style={{ color: 'var(--text-primary)' }}>{student.batch}</span>
              </div>
              <div className="form-group">
                <span className="form-label">GPA</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{student.gpa.toFixed(2)}</span>
              </div>
              <div className="form-group">
                <span className="form-label">Added</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {new Date(student.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="results-tab" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
              {Object.keys(resultsBySemester).length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No academic results found for this student.
                </div>
              ) : (
                Object.entries(resultsBySemester).sort((a, b) => a[0].localeCompare(b[0])).map(([semester, sResults]) => (
                  <div key={semester} style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                      {semester}
                    </h4>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '8px 0' }}>Subject</th>
                          <th style={{ padding: '8px 0', textAlign: 'center' }}>Credits</th>
                          <th style={{ padding: '8px 0', textAlign: 'right' }}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sResults.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>
                              <span style={{ fontWeight: 600 }}>{r.subjectCode}</span>
                              {r.subjectName && <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)' }}>{r.subjectName}</span>}
                            </td>
                            <td style={{ padding: '8px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.credits}</td>
                            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: r.grade.includes('A') ? '#10b981' : r.grade.includes('F') || r.grade === 'I' ? '#ef4444' : 'var(--text-primary)' }}>
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

        <div className="modal-footer">
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                Delete
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
