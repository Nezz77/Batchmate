import { useState, useEffect, useRef } from 'react'
import { Download, Printer, Settings, Upload, Plus, Trash2, Save, Palette } from 'lucide-react'
import FlyerTemplate from '../components/FlyerTemplate'
import FlyerDesigner from '../components/FlyerDesigner'
import type { Student, FlyerConfig, CustomText } from '../types/electron.d'

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

  const [config, setConfig] = useState<FlyerConfig>({
    useCustomLayout: false,
    backgroundImage: null,
    photoShape: 'round',
    photoX: 130,
    photoY: 160,
    photoSize: 140,
    customTexts: [],
    showDefaultDecorations: true,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [showDesigner, setShowDesigner] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    window.api.app.getFlyerConfig().then(saved => {
      if (saved) {
        if (saved.useCustomLayout === undefined) {
          saved.useCustomLayout = !!saved.backgroundImage
        }
        setConfig(saved)
      }
    }).catch(console.error)
  }, [])

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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                        <div className="student-avatar" style={{ width: 42, height: 42, fontSize: 14 }}>
                          {student.profileImage ? (
                            <img
                              src={student.profileImage}
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
                  {selectedStudent.profileImage ? (
                    <img
                      src={selectedStudent.profileImage}
                      alt={selectedStudent.fullName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.textContent = selectedStudent.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      }}
                    />
                  ) : (
                    selectedStudent.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  )}
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
                <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', position: 'relative' }}>
                  <FlyerTemplate 
                    student={selectedStudent} 
                    flyerRef={flyerRef} 
                    config={config} 
                    isEditing={showSettings && config.useCustomLayout}
                    onUpdateConfig={setConfig}
                  />
                  {showSettings && config.useCustomLayout && (
                    <div style={{ position: 'absolute', top: -30, left: 0, width: '100%', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                      Drag elements to move them
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => setShowDesigner(true)}
                >
                  <Palette size={16} />
                  Open Designer
                </button>
                <button
                  id="export-flyer-btn"
                  className="btn btn-secondary"
                  onClick={handleExportFlyer}
                  disabled={exporting}
                >
                  <Download size={16} />
                  {exporting ? '…' : 'Quick Export'}
                </button>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setShowSettings(!showSettings)}
                  title="Legacy Settings"
                >
                  <Settings size={16} />
                </button>
              </div>

              {/* Template Settings */}
              {showSettings && (
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  marginTop: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600 }}>Template Settings</h4>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        window.api.app.saveFlyerConfig(config)
                        showToast('Template saved!')
                      }}
                    >
                      <Save size={14} style={{ marginRight: 4 }} /> Save
                    </button>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={config.useCustomLayout}
                      onChange={e => setConfig({ ...config, useCustomLayout: e.target.checked })}
                    />
                    Enable Custom Layout Editor
                  </label>

                  <div className="form-group">
                    <label className="form-label">Background Image</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={async () => {
                          const p = await window.api.dialog.openFile({ filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }] })
                          if (p) setConfig({ ...config, backgroundImage: `file://${p}` })
                        }}
                      >
                        <Upload size={14} style={{ marginRight: 4 }} /> Upload
                      </button>
                      {config.backgroundImage && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setConfig({ ...config, backgroundImage: null })}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Photo Shape</label>
                      <select 
                        className="form-input" 
                        value={config.photoShape}
                        onChange={(e: any) => setConfig({ ...config, photoShape: e.target.value })}
                      >
                        <option value="round">Round</option>
                        <option value="square">Square</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Photo Size (px)</label>
                      <input 
                        className="form-input" 
                        type="number" 
                        value={config.photoSize} 
                        onChange={(e) => setConfig({ ...config, photoSize: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Photo X (px)</label>
                      <input 
                        className="form-input" 
                        type="number" 
                        value={config.photoX} 
                        onChange={(e) => setConfig({ ...config, photoX: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Photo Y (px)</label>
                      <input 
                        className="form-input" 
                        type="number" 
                        value={config.photoY} 
                        onChange={(e) => setConfig({ ...config, photoY: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Custom Texts</label>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          const newText: CustomText = {
                            id: Date.now().toString(),
                            text: '{name}',
                            x: 200,
                            y: 350,
                            fontSize: 24,
                            color: '#ffffff',
                            fontWeight: 700
                          }
                          setConfig({ ...config, customTexts: [...config.customTexts, newText] })
                        }}
                      >
                        <Plus size={14} style={{ marginRight: 4 }} /> Add
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {config.customTexts.map((txt, idx) => (
                        <div key={txt.id} style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>Text Layer {idx + 1}</span>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => {
                              setConfig({ ...config, customTexts: config.customTexts.filter(t => t.id !== txt.id) })
                            }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <input 
                            className="form-input" 
                            style={{ marginBottom: 8 }}
                            value={txt.text}
                            placeholder="Supports {name}, {firstName}, {date}, {programme}, {batch}"
                            onChange={e => {
                              const newTexts = [...config.customTexts]
                              newTexts[idx].text = e.target.value
                              setConfig({ ...config, customTexts: newTexts })
                            }}
                          />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>X (px)</label>
                              <input type="number" className="form-input" style={{ width: '100%', minWidth: 0, padding: '4px 8px', fontSize: 12 }} value={txt.x} onChange={e => {
                                const newTexts = [...config.customTexts]; newTexts[idx].x = Number(e.target.value); setConfig({ ...config, customTexts: newTexts })
                              }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>Y (px)</label>
                              <input type="number" className="form-input" style={{ width: '100%', minWidth: 0, padding: '4px 8px', fontSize: 12 }} value={txt.y} onChange={e => {
                                const newTexts = [...config.customTexts]; newTexts[idx].y = Number(e.target.value); setConfig({ ...config, customTexts: newTexts })
                              }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>Size (px)</label>
                              <input type="number" className="form-input" style={{ width: '100%', minWidth: 0, padding: '4px 8px', fontSize: 12 }} value={txt.fontSize} onChange={e => {
                                const newTexts = [...config.customTexts]; newTexts[idx].fontSize = Number(e.target.value); setConfig({ ...config, customTexts: newTexts })
                              }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>Color</label>
                              <div style={{ 
                                width: '100%', 
                                height: 28, 
                                borderRadius: 'var(--radius-md)', 
                                border: '1px solid var(--border)', 
                                background: txt.color,
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'pointer'
                              }}>
                                <input type="color" style={{ 
                                  position: 'absolute', 
                                  top: -10, left: -10, width: '200%', height: '200%', 
                                  cursor: 'pointer', opacity: 0 
                                }} value={txt.color} onChange={e => {
                                  const newTexts = [...config.customTexts]; newTexts[idx].color = e.target.value; setConfig({ ...config, customTexts: newTexts })
                                }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {config.customTexts.length === 0 && (
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px 0' }}>
                          No custom text layers
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 16 }}>
                    <input 
                      type="checkbox" 
                      checked={config.showDefaultDecorations}
                      onChange={e => setConfig({ ...config, showDefaultDecorations: e.target.checked })}
                    />
                    Show default decorations (confetti, circles)
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Flyer Designer Full-Screen Overlay */}
      {showDesigner && selectedStudent && (
        <FlyerDesigner
          student={selectedStudent}
          onClose={() => setShowDesigner(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="toast toast-success">{toast}</div>
      )}
    </div>
  )
}
