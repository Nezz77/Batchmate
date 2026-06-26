import { useState, useEffect, useRef } from 'react'
import { Download, Printer } from 'lucide-react'
import FlyerTemplate from '../components/FlyerTemplate'
import type { Student } from '../types/electron.d'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function Birthdays() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const flyerRef = useRef<HTMLDivElement>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    setLoading(true)
    window.api.students.getBirthdays(selectedMonth).then(data => {
      setStudents(data)
      setLoading(false)
      setSelectedStudent(null)
    })
  }, [selectedMonth])

  const handleExportFlyer = async () => {
    if (!flyerRef.current || !selectedStudent) return
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(flyerRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0F172A',
        width: 400,
        height: 500,
      })

      // Convert data URL to buffer
      const base64 = dataUrl.replace('data:image/png;base64,', '')
      const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

      const savePath = await window.api.dialog.saveFile({
        defaultPath: `${selectedStudent.fullName.replace(/\s+/g, '_')}_birthday_flyer.png`,
        filters: [{ name: 'PNG Image', extensions: ['png'] }],
      })

      if (savePath) {
        await window.api.fs.writeFile(savePath, buffer)
        showToast('Flyer exported successfully!')
      }
    } catch (err) {
      console.error('Export failed:', err)
      showToast('Failed to export flyer')
    } finally {
      setExporting(false)
    }
  }

  const handleBatchExport = async () => {
    if (students.length === 0) return
    showToast(`Batch export for ${students.length} students — select each student individually to export`)
  }

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

      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedStudent ? '1fr 440px' : '1fr',
        gap: 24,
        alignItems: 'flex-start',
      }}>
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
                      className={`birthday-card ${selectedStudent?.id === student.id ? 'active' : ''}`}
                      style={selectedStudent?.id === student.id ? {
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
                      <div className="birthday-name">{student.fullName}</div>
                      <div className="birthday-programme">
                        {student.degreeProgramme} · Batch {student.batch}
                      </div>
                      <div className="birthday-actions">
                        <button
                          id={`generate-flyer-${student.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => setSelectedStudent(
                            selectedStudent?.id === student.id ? null : student
                          )}
                        >
                          {selectedStudent?.id === student.id ? 'Hide Flyer' : '✨ Generate Flyer'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Flyer Preview Panel */}
        {selectedStudent && (
          <div className="animate-in" style={{ position: 'sticky', top: 0 }}>
            <div className="card">
              <h3 style={{
                fontSize: 15, fontWeight: 700,
                color: 'var(--text-primary)', marginBottom: 16,
              }}>
                Birthday Flyer
              </h3>

              {/* Student info */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 20, padding: '12px 14px',
                background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
              }}>
                <div className="student-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                  {selectedStudent.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedStudent.fullName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {selectedStudent.indexNumber}
                  </div>
                </div>
              </div>

              {/* Flyer */}
              <div style={{
                display: 'flex', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                  <FlyerTemplate student={selectedStudent} flyerRef={flyerRef} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  id="export-flyer-btn"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleExportFlyer}
                  disabled={exporting}
                >
                  <Download size={16} />
                  {exporting ? 'Exporting…' : 'Export PNG'}
                </button>
                <button
                  className="btn btn-secondary btn-icon"
                  onClick={handleBatchExport}
                  title="Print"
                >
                  <Printer size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast toast-success">{toast}</div>
      )}
    </div>
  )
}
