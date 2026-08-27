import { useState, useEffect } from 'react'
import { Palette } from 'lucide-react'
import FlyerDesigner from '../components/FlyerDesigner'
import type { Student } from '../types/electron.d'
import { getImageUrl } from '../utils/image'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function Birthdays() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showDesigner, setShowDesigner] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    setLoading(true)
    window.api.students.getBirthdays(selectedMonth).then((data: any) => {
      setStudents(data)
      setLoading(false)
      setSelectedStudent(null)
    })
  }, [selectedMonth])

  const getOrdinal = (d: number) => {
    if (d > 3 && d < 21) return `${d}th`
    switch (d % 10) {
      case 1: return `${d}st`
      case 2: return `${d}nd`
      case 3: return `${d}rd`
      default: return `${d}th`
    }
  }

  const isToday = (student: Student) => {
    const dob = new Date(student.dateOfBirth)
    const now = new Date()
    return dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate()
  }

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-title">Birthdays 🎂</h1>
        <p className="page-subtitle">Browse birthdays by month and generate personalized flyers</p>
      </div>

      {/* Month Selector */}
      <div className="month-selector animate-in">
        {MONTH_NAMES.map((name, i) => (
          <button
            key={name}
            id={`month-${name.toLowerCase()}`}
            className={`month-btn ${selectedMonth === i ? 'active' : ''}`}
            onClick={() => setSelectedMonth(i)}
          >
            {name.slice(0, 3)}
            {i === new Date().getMonth() && (
              <span style={{ marginLeft: 4, fontSize: 10 }}>●</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ width: '100%' }}>
        {/* Birthday Cards */}
        <div>
          {loading ? (
            <div className="birthday-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state animate-in" style={{ padding: '48px 20px' }}>
              <span style={{ fontSize: 52, display: 'block', marginBottom: 16 }}>🎂</span>
              <h2 className="empty-state-title">No birthdays in {MONTH_NAMES[selectedMonth]}</h2>
              <p className="empty-state-text">Try another month or import more student data.</p>
            </div>
          ) : (
            <div className="animate-in">
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
                {students.length} birthday{students.length !== 1 ? 's' : ''} in {MONTH_NAMES[selectedMonth]}
              </div>
              <div className="birthday-grid">
                {students.map(student => {
                  const dob = new Date(student.dateOfBirth)
                  const today = isToday(student)
                  return (
                    <div
                      key={student.id}
                      className={`birthday-card ${selectedStudent?.id === student.id && showDesigner ? 'active' : ''}`}
                      style={selectedStudent?.id === student.id && showDesigner ? {
                        borderColor: 'var(--accent-primary)',
                        boxShadow: 'var(--shadow-glow-sm)',
                      } : {}}
                    >
                      <div className="birthday-date">
                        <span>🎂</span>
                        {MONTH_NAMES[dob.getMonth()]} {getOrdinal(dob.getDate())}
                        {today && (
                          <span style={{
                            background: 'rgba(236,72,153,0.15)',
                            color: '#EC4899',
                            padding: '1px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 10,
                            fontWeight: 700,
                          }}>
                            TODAY
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                        <div className="student-avatar" style={{ width: 42, height: 42, fontSize: 14 }}>
                          {student.profileImage ? (
                            <img
                              src={getImageUrl(student.profileImage)}
                              alt={student.fullName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.textContent = student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                              }}
                            />
                          ) : (
                            student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          )}
                        </div>
                        <div>
                          <div className="birthday-name" style={{ marginBottom: '2px' }}>{student.fullName}</div>
                          <div className="birthday-programme" style={{ marginBottom: 0 }}>
                            {student.degreeProgramme} · Batch {student.batch}
                          </div>
                        </div>
                      </div>
                      <div className="birthday-actions">
                        <button
                          id={`generate-flyer-${student.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          onClick={() => {
                            setSelectedStudent(student)
                            setShowDesigner(true)
                          }}
                        >
                          <Palette size={14} />
                          ✨ Design & Export Flyer
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flyer Designer Full-Screen Overlay */}
      {showDesigner && selectedStudent && (
        <FlyerDesigner
          student={selectedStudent}
          students={students}
          onSwitchStudent={setSelectedStudent}
          onClose={() => {
            setShowDesigner(false)
            setSelectedStudent(null)
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="toast toast-success">{toast}</div>
      )}
    </div>
  )
}
