import { useRef, useState, useEffect } from 'react'
import type { Student, FlyerConfig } from '../types/electron.d'

interface FlyerTemplateProps {
  student: Student
  flyerRef?: React.RefObject<HTMLDivElement | null>
  config?: FlyerConfig | null
  isEditing?: boolean
  onUpdateConfig?: (newConfig: FlyerConfig) => void
}

function Draggable({
  x, y, onDrag, children, disabled, style
}: { x: number, y: number, onDrag: (dx: number, dy: number) => void, children: React.ReactNode, disabled?: boolean, style?: React.CSSProperties }) {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    e.stopPropagation()
    let lastX = e.clientX
    let lastY = e.clientY

    const handleMouseMove = (moveEvent: MouseEvent) => {
      onDrag(moveEvent.clientX - lastX, moveEvent.clientY - lastY)
      lastX = moveEvent.clientX
      lastY = moveEvent.clientY
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      style={{ position: 'absolute', left: x, top: y, cursor: disabled ? 'auto' : 'move', ...style }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  )
}

export default function FlyerTemplate({ student, flyerRef, config, isEditing, onUpdateConfig }: FlyerTemplateProps) {
  const internalRef = useRef<HTMLDivElement>(null)
  const ref = flyerRef || internalRef

  const dob = new Date(student.dateOfBirth)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  }

  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isDraggingImg = useRef(false)
  const lastMouseImg = useRef({ x: 0, y: 0 })

  const handleWheelImg = (e: React.WheelEvent) => {
    if (!isEditing) return
    e.stopPropagation()
    const delta = e.deltaY * -0.01
    setScale(s => Math.min(Math.max(0.2, s + delta), 5))
  }

  const handleMouseDownImg = (e: React.MouseEvent) => {
    if (!isEditing) return
    e.stopPropagation()
    isDraggingImg.current = true
    lastMouseImg.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMoveImg = (e: React.MouseEvent) => {
    if (!isDraggingImg.current) return
    const dx = e.clientX - lastMouseImg.current.x
    const dy = e.clientY - lastMouseImg.current.y
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
    lastMouseImg.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUpOrLeaveImg = () => {
    isDraggingImg.current = false
  }

  const isCustom = config ? config.useCustomLayout : false
  const showDefaultDecorations = config ? config.showDefaultDecorations : true

  return (
    <div
      ref={ref}
      style={{
        width: '400px',
        height: '500px',
        background: (isCustom && config?.backgroundImage)
          ? `url(${config.backgroundImage}) center/cover no-repeat` 
          : 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 40%, #312E81 70%, #1E1B4B 100%)',
        borderRadius: '20px',
        padding: '0',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        color: 'white',
        border: isEditing ? '2px dashed rgba(255,255,255,0.5)' : 'none',
      }}
    >
      {/* Decorative circles */}
      {showDefaultDecorations && (
        <>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', filter: 'blur(50px)' }} />

          {/* Confetti dots */}
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: `${4 + Math.random() * 6}px`, height: `${4 + Math.random() * 6}px`, borderRadius: '50%', background: ['#F59E0B', '#EC4899', '#8B5CF6', '#22D3EE', '#22C55E'][i % 5], top: `${10 + Math.random() * 30}%`, left: `${5 + Math.random() * 90}%`, opacity: 0.6 }} />
          ))}
        </>
      )}

      {/* Photo (Draggable if custom) */}
      {isCustom ? (
        <Draggable
          x={config!.photoX}
          y={config!.photoY}
          disabled={!isEditing}
          onDrag={(dx, dy) => {
            if (onUpdateConfig) onUpdateConfig({ ...config!, photoX: config!.photoX + dx, photoY: config!.photoY + dy })
          }}
          style={{ zIndex: 2 }}
        >
          <div style={{
            width: `${config!.photoSize}px`,
            height: `${config!.photoSize}px`,
            borderRadius: config!.photoShape === 'round' ? '50%' : '16px',
            overflow: 'hidden',
            border: isEditing ? '3px dashed #3B82F6' : '3px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {student.profileImage ? (
              <img
                src={student.profileImage}
                alt={student.fullName}
                onWheel={handleWheelImg}
                onMouseDown={handleMouseDownImg}
                onMouseMove={handleMouseMoveImg}
                onMouseUp={handleMouseUpOrLeaveImg}
                onMouseLeave={handleMouseUpOrLeaveImg}
                style={{ 
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  cursor: isEditing ? (isDraggingImg.current ? 'grabbing' : 'grab') : 'auto',
                }}
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `<span style="font-size: 48px; font-weight: 800; color: rgba(255,255,255,0.8)">${getInitials(student.fullName)}</span>`;
                }}
              />
            ) : (
              <span style={{ fontSize: '48px', fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>
                {getInitials(student.fullName)}
              </span>
            )}
          </div>
        </Draggable>
      ) : (
        <div style={{
          position: 'relative',
          width: '140px',
          height: '175px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '3px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}>
          {student.profileImage ? (
            <img src={student.profileImage} alt={student.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
          ) : (
            <span style={{ fontSize: '48px', fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>{getInitials(student.fullName)}</span>
          )}
        </div>
      )}

      {/* Custom Texts */}
      {isCustom && config!.customTexts.map((textItem, idx) => {
        let content = textItem.text
        content = content.replace('{name}', student.fullName)
        content = content.replace('{firstName}', student.fullName.split(' ')[0])
        content = content.replace('{date}', `${monthNames[dob.getMonth()]} ${dob.getDate()}`)
        content = content.replace('{programme}', student.degreeProgramme)
        content = content.replace('{batch}', student.batch)

        return (
          <Draggable
            key={textItem.id}
            x={textItem.x}
            y={textItem.y}
            disabled={!isEditing}
            onDrag={(dx, dy) => {
              if (!onUpdateConfig) return
              const newTexts = [...config!.customTexts]
              newTexts[idx] = { ...newTexts[idx], x: newTexts[idx].x + dx, y: newTexts[idx].y + dy }
              onUpdateConfig({ ...config!, customTexts: newTexts })
            }}
            style={{ zIndex: 3 }}
          >
            <div style={{
              fontSize: `${textItem.fontSize}px`,
              color: textItem.color,
              fontWeight: textItem.fontWeight,
              whiteSpace: 'pre-wrap',
              border: isEditing ? '1px dashed rgba(255,255,255,0.3)' : 'none',
              padding: isEditing ? '4px' : '0',
            }}>
              {content}
            </div>
          </Draggable>
        )
      })}

      {/* Default Content (Only show if not custom) */}
      {!isCustom && (
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: '100%',
          padding: '36px 28px',
        }}>
          {/* Top label */}
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '8px',
          }}>
            🎂 Happy Birthday 🎂
          </div>

          {/* Name */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '24px',
            lineHeight: 1.2,
            background: 'linear-gradient(135deg, #F1F5F9 0%, #93C5FD 50%, #C4B5FD 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            {student.fullName}
          </h1>

          {/* Placeholder for Photo (to keep spacing) */}
          <div style={{ width: '140px', height: '175px', marginBottom: '24px' }} />

          {/* Date */}
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#F59E0B',
            marginBottom: '6px',
          }}>
            {monthNames[dob.getMonth()]} {dob.getDate()}
          </div>

          {/* Programme & Batch */}
          <div style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: 500,
          }}>
            {student.degreeProgramme} — Batch {student.batch}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.3)',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Batchmate — Batch {student.batch}
          </div>
        </div>
      )}
    </div>
  )
}
