import { useState, useEffect, useCallback } from 'react'
import { Search, LayoutGrid, List, SlidersHorizontal, UserPlus } from 'lucide-react'
import StudentCard from '../components/StudentCard'
import StudentModal from '../components/StudentModal'
import CreateStudentModal from '../components/CreateStudentModal'
import type { Student } from '../types/electron.d'

type ViewMode = 'grid' | 'list'
type SortBy = 'fullName' | 'gpa' | 'dateOfBirth' | 'indexNumber'

export default function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selected, setSelected] = useState<Student | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [programme, setProgramme] = useState('')
  const [batch, setBatch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('fullName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    const result = await window.api.students.getAll({
      search: search || undefined,
      programme: programme || undefined,
      batch: batch || undefined,
      sortBy,
      sortOrder,
    })
    setStudents(result)
    setLoading(false)
  }, [search, programme, batch, sortBy, sortOrder])

  useEffect(() => {
    const t = setTimeout(fetchStudents, 200)
    return () => clearTimeout(t)
  }, [fetchStudents])

  const handleSave = async (id: string, data: Partial<Student>) => {
    try {
      await window.api.students.update(id, data)
      showToast('Student updated successfully')
      setSelected(null)
      fetchStudents()
    } catch {
      showToast('Failed to update student', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await window.api.students.delete(id)
      showToast('Student deleted')
      setSelected(null)
      fetchStudents()
    } catch {
      showToast('Failed to delete student', 'error')
    }
  }

  const handleCreate = async (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await window.api.students.create(data)
      showToast('Student created successfully')
      setIsCreating(false)
      fetchStudents()
    } catch {
      showToast('Failed to create student', 'error')
    }
  }

  return (
    <div>
      <div className="page-header animate-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Students</h1>
            <p className="page-subtitle">
              {loading ? 'Loading…' : `${students.length} student${students.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          {/* Actions & View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setIsCreating(true)}
            >
              <UserPlus size={16} /> Add Student
            </button>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <button
              className={`btn btn-ghost btn-icon ${viewMode === 'grid' ? 'btn-secondary' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`btn btn-ghost btn-icon ${viewMode === 'list' ? 'btn-secondary' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Filters */}
      <div className="filters-bar animate-in animate-in-delay-1">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            id="student-search"
            className="search-input"
            placeholder="Search by name, index or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          id="filter-programme"
          className="filter-select"
          value={programme}
          onChange={e => setProgramme(e.target.value)}
        >
          <option value="">All Programmes</option>
          <option value="IT">IT</option>
          <option value="ITM">ITM</option>
          <option value="AI">AI</option>
        </select>

        <input
          id="filter-batch"
          className="search-input"
          style={{ maxWidth: 100, minWidth: 80, padding: '10px 14px' }}
          placeholder="Batch"
          value={batch}
          onChange={e => setBatch(e.target.value)}
        />

        <select
          id="sort-by"
          className="filter-select"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortBy)}
        >
          <option value="fullName">Name</option>
          <option value="gpa">GPA</option>
          <option value="dateOfBirth">Birthday</option>
          <option value="indexNumber">Index No.</option>
        </select>

        <button
          id="sort-order-btn"
          className="btn btn-secondary btn-sm"
          onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <SlidersHorizontal size={14} />
          {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="students-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <Search className="empty-state-icon" />
          <h2 className="empty-state-title">No students found</h2>
          <p className="empty-state-text">
            {search || programme || batch
              ? 'Try adjusting your search filters.'
              : 'Import student data to get started.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="students-grid animate-in">
          {students.map(s => (
            <StudentCard key={s.id} student={s} onClick={setSelected} />
          ))}
        </div>
      ) : (
        <div className="data-table-wrapper animate-in">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Index No.</th>
                <th>Programme</th>
                <th>Batch</th>
                <th>GPA</th>
                <th>Date of Birth</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} onClick={() => setSelected(s)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.fullName}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.indexNumber}</td>
                  <td>
                    <span className={`badge badge-${s.degreeProgramme.toLowerCase()}`}>
                      {s.degreeProgramme}
                    </span>
                  </td>
                  <td>{s.batch}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.gpa >= 3.5 ? 'var(--success)' : s.gpa >= 2.5 ? 'var(--warning)' : 'var(--danger)' }}>
                      {s.gpa.toFixed(2)}
                    </span>
                  </td>
                  <td>{new Date(s.dateOfBirth).toLocaleDateString()}</td>
                  <td style={{ color: 'var(--text-tertiary)' }}>{s.email || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <StudentModal
          student={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* Create Modal */}
      {isCreating && (
        <CreateStudentModal
          onClose={() => setIsCreating(false)}
          onCreate={handleCreate}
        />
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
