import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Student } from '../types/electron.d'

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
  })

  useEffect(() => {
    if (student) {
      setForm({
        fullName: student.fullName,
        email: student.email || '',
        degreeProgramme: student.degreeProgramme,
        gpa: student.gpa,
        batch: student.batch,
      })
      setEditing(false)
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
    } as any)
    setEditing(false)
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
            <div className="student-avatar" style={{ width: 72, height: 72, fontSize: 28 }}>
              {student.profileImage ? (
                <img
                  src={student.profileImage}
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
                <input
                  className="form-input"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  style={{ fontSize: '18px', fontWeight: 600 }}
                />
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
          ) : (
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
