import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, Edit2 } from 'lucide-react'
import type { Subject } from '../types/electron.d'

export default function Curriculum() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Filter state
  const [semesterFilter, setSemesterFilter] = useState('All')
  const [programmeFilter, setProgrammeFilter] = useState('All')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState<Partial<Subject>>({
    code: '',
    name: '',
    credits: 3.0,
    semester: 'Semester 1',
    programme: 'IT',
    isNonGpa: false
  })

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    setLoading(true)
    try {
      const data = await window.api.subjects.getAll()
      setSubjects(data)
    } catch (e) {
      console.error(e)
      showToast('Failed to load subjects', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await window.api.subjects.update(editingId, {
          ...form,
          credits: Number(form.credits)
        })
        showToast('Subject updated successfully')
      } else {
        await window.api.subjects.create({
          ...form,
          credits: Number(form.credits)
        })
        showToast('Subject created successfully')
      }
      setShowModal(false)
      loadSubjects()
    } catch (err) {
      showToast('Failed to save subject', 'error')
    }
  }

  const handleEdit = (subject: Subject) => {
    setForm(subject)
    setEditingId(subject.id)
    setShowModal(true)
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete ${code}?`)) return
    try {
      await window.api.subjects.delete(id)
      showToast('Subject deleted')
      loadSubjects()
    } catch (err) {
      showToast('Failed to delete subject', 'error')
    }
  }

  const openNewModal = () => {
    setEditingId(null)
    setForm({
      code: '',
      name: '',
      credits: 3.0,
      semester: 'Semester 1',
      programme: 'IT',
      isNonGpa: false
    })
    setShowModal(true)
  }

  // Extract unique semesters and programmes for filters
  const semesters = ['All', ...Array.from(new Set(subjects.map(s => s.semester)))].sort()
  const programmes = ['All', 'IT', 'ITM', 'AI']

  const filteredSubjects = subjects.filter(s => {
    if (semesterFilter !== 'All' && s.semester !== semesterFilter) return false
    if (programmeFilter !== 'All' && s.programme !== programmeFilter && s.programme !== 'All') return false
    return true
  })

  return (
    <div>
      <div className="page-header animate-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Semester Details</h1>
            <p className="page-subtitle">Manage curriculum modules across programmes</p>
          </div>
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={16} />
            Add Module
          </button>
        </div>
      </div>

      <div className="filters-bar animate-in">
        <div className="filter-group">
          <label className="filter-label">Semester</label>
          <select 
            className="filter-select"
            value={semesterFilter}
            onChange={e => setSemesterFilter(e.target.value)}
          >
            {semesters.map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Programme</label>
          <select 
            className="filter-select"
            value={programmeFilter}
            onChange={e => setProgrammeFilter(e.target.value)}
          >
            {programmes.map(prog => (
              <option key={prog} value={prog}>{prog}</option>
            ))}
          </select>
        </div>
        <div className="filter-group" style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Showing {filteredSubjects.length} modules
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading modules...</div>
      ) : filteredSubjects.length === 0 ? (
        <div className="empty-state animate-in">
          <BookOpen className="empty-state-icon" />
          <h2 className="empty-state-title">No modules found</h2>
          <p className="empty-state-text">Add modules to build your curriculum.</p>
        </div>
      ) : (
        <div className="card table-container animate-in">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Credits</th>
                <th>Semester</th>
                <th>Programme</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map(subject => (
                <tr key={subject.id}>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {subject.code}
                    </span>
                  </td>
                  <td>{subject.name}</td>
                  <td>{subject.credits.toFixed(1)}</td>
                  <td>{subject.semester}</td>
                  <td>
                    <span className={`badge ${subject.programme === 'All' ? 'badge-success' : 'badge-primary'}`}>
                      {subject.programme}
                    </span>
                  </td>
                  <td>
                    {subject.isNonGpa ? (
                      <span className="badge badge-warning">Non-GPA</span>
                    ) : (
                      <span className="badge badge-success">GPA</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(subject)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(subject.id, subject.code)} style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Edit Module' : 'Add New Module'}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Module Code</label>
                <input 
                  required
                  className="form-input" 
                  value={form.code}
                  onChange={e => setForm({...form, code: e.target.value})}
                  placeholder="e.g. IN1100"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Module Name</label>
                <input 
                  required
                  className="form-input" 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Programming Fundamentals"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Credits</label>
                  <input 
                    required
                    type="number"
                    step="0.5"
                    className="form-input" 
                    value={form.credits}
                    onChange={e => setForm({...form, credits: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <input 
                    required
                    className="form-input" 
                    value={form.semester}
                    onChange={e => setForm({...form, semester: e.target.value})}
                    placeholder="e.g. Semester 1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Programme</label>
                  <select 
                    className="form-input" 
                    value={form.programme}
                    onChange={e => setForm({...form, programme: e.target.value})}
                  >
                    <option value="IT">IT</option>
                    <option value="ITM">ITM</option>
                    <option value="AI">AI</option>
                    <option value="All">All</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '28px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox" 
                      checked={form.isNonGpa}
                      onChange={e => setForm({...form, isNonGpa: e.target.checked})}
                    />
                    Non-GPA Module
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
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
