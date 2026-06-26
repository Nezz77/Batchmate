import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import type { Student } from '../types/electron.d'

interface CreateStudentModalProps {
  onClose: () => void
  onCreate: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export default function CreateStudentModal({ onClose, onCreate }: CreateStudentModalProps) {
  const [form, setForm] = useState({
    fullName: '',
    indexNumber: '',
    email: '',
    dateOfBirth: '',
    degreeProgramme: 'IT',
    gpa: 0,
    batch: '',
    profileImage: null as string | null
  })

  const handleSave = () => {
    if (!form.fullName || !form.indexNumber || !form.dateOfBirth || !form.batch) {
      alert("Please fill out all required fields (Name, Index, Date of Birth, Batch).")
      return
    }
    
    // Add time component to dateOfBirth if not present, so Prisma can parse it properly as DateTime
    let dob = form.dateOfBirth
    if (dob.length === 10) {
      dob += 'T00:00:00.000Z'
    }

    onCreate({
      fullName: form.fullName,
      indexNumber: form.indexNumber,
      email: form.email || null,
      degreeProgramme: form.degreeProgramme,
      gpa: Number(form.gpa),
      batch: form.batch,
      dateOfBirth: dob,
      profileImage: form.profileImage
    })
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="modal-title">Add New Student</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Photo Upload Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div className="student-avatar" style={{ width: 72, height: 72, fontSize: 24, flexShrink: 0 }}>
              {form.profileImage ? (
                <img src={form.profileImage} alt="Preview" />
              ) : (
                <UserPlus size={28} style={{ opacity: 0.5 }} />
              )}
            </div>
            <div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                Upload Photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </label>
              {form.profileImage && (
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => setForm(prev => ({ ...prev, profileImage: null }))}>
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Index Number *</label>
              <input
                className="form-input"
                value={form.indexNumber}
                onChange={e => setForm({ ...form, indexNumber: e.target.value })}
                placeholder="e.g. 244001A"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input
                className="form-input"
                type="date"
                value={form.dateOfBirth}
                onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Programme *</label>
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
              <label className="form-label">Batch *</label>
              <input
                className="form-input"
                value={form.batch}
                onChange={e => setForm({ ...form, batch: e.target.value })}
                placeholder="e.g. 24"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">GPA (Optional)</label>
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

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Student
          </button>
        </div>
      </div>
    </div>
  )
}
