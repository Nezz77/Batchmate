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

  const designerState = (config as any)?._designerState
  const hasDesignerState = !!(designerState && designerState.layers && designerState.layers.length > 0)

  if (hasDesignerState) {
    const bgLayer = designerState.layers.find((l: any) => l.type === 'background')
    const bgStyle = bgLayer && bgLayer.visible
      ? bgLayer.image
        ? { background: `url(${bgLayer.image}) center/cover no-repeat` }
        : { backgroundColor: bgLayer.color }
      : { background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 40%, #312E81 70%, #1E1B4B 100%)' }

    return (
      <div
        ref={ref}
        style={{
          width: `${designerState.canvasWidth || 500}px`,
          height: `${designerState.canvasHeight || 500}px`,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
          color: 'white',
          border: isEditing ? '2px dashed rgba(255,255,255,0.5)' : 'none',
          borderRadius: '20px',
          ...bgStyle
        }}
      >
        {designerState.layers.map((layer: any, idx: number) => {
          if (!layer.visible) return null

          if (layer.type === 'photo') {
            const p = layer
            const clipPath = (() => {
              switch (p.shape) {
                case 'circle': return 'circle(50% at 50% 50%)'
                case 'square': return 'none'
                case 'rounded-rect': return 'inset(0 round 16px)'
                case 'oval': return 'ellipse(50% 40% at 50% 50%)'
                default: return 'none'
              }
            })()
            const filterStr = `brightness(${p.brightness ?? 100}%) contrast(${p.contrast ?? 100}%) saturate(${p.saturate ?? 100}%) blur(${p.blur ?? 0}px)`

            return (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: p.x - p.width / 2,
                  top: p.y - p.height / 2,
                  width: p.width,
                  height: p.height,
                  transform: `rotate(${p.rotation || 0}deg)`,
                  opacity: p.opacity !== undefined ? p.opacity : 1,
                  zIndex: idx,
                }}
              >
                <div style={{
                  width: '100%', height: '100%',
                  clipPath, overflow: 'hidden',
                  border: `${p.borderWidth || 0}px solid ${p.borderColor || 'transparent'}`,
                  borderRadius: p.shape === 'square' ? 0 : p.shape === 'rounded-rect' ? 16 : '50%',
                  boxShadow: p.shadow ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  {/* Initials (always rendered behind image) */}
                  <span style={{ position: 'absolute', fontSize: `${p.width * 0.3}px`, fontWeight: 800, color: 'rgba(255,255,255,0.8)', userSelect: 'none' }}>
                    {getInitials(student.fullName)}
                  </span>

                  {/* Student Image */}
                  {student.profileImage && (
                    <img
                      src={student.profileImage}
                      alt={student.fullName}
                      draggable={false}
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%', objectFit: 'cover',
                        transform: `translate(${p.imgOffsetX || 0}px, ${p.imgOffsetY || 0}px) scale(${p.imgScale || 1}) scaleX(${p.flipX ? -1 : 1}) scaleY(${p.flipY ? -1 : 1})`,
                        filter: filterStr,
                        pointerEvents: 'none',
                      }}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>
            )
          }

          if (layer.type === 'text') {
            const t = layer
            let textValue = t.text
            textValue = textValue.replace(/{name}/g, student.fullName)
            textValue = textValue.replace(/{firstName}/g, student.fullName.split(' ')[0])
            textValue = textValue.replace(/{date}/g, (() => {
              const mn = ['January','February','March','April','May','June','July','August','September','October','November','December']
              const d = new Date(student.dateOfBirth)
              return `${mn[d.getMonth()]} ${d.getDate()}`
            })())
            textValue = textValue.replace(/{programme}/g, student.degreeProgramme)
            textValue = textValue.replace(/{batch}/g, student.batch)

            // Compile text outline and drop shadow styles
            const shadowParts = []
            if (t.outlineWidth && t.outlineWidth > 0) {
              const w = t.outlineWidth
              const c = t.outlineColor || '#000000'
              shadowParts.push(
                `${w}px 0px 0 ${c}`,
                `-${w}px 0px 0 ${c}`,
                `0px ${w}px 0 ${c}`,
                `0px -${w}px 0 ${c}`,
                `${w}px ${w}px 0 ${c}`,
                `-${w}px -${w}px 0 ${c}`,
                `${w}px -${w}px 0 ${c}`,
                `-${w}px ${w}px 0 ${c}`
              )
            }
            if (t.shadowBlur && t.shadowBlur > 0) {
              const ox = t.shadowOffsetX || 0
              const oy = t.shadowOffsetY || 2
              const b = t.shadowBlur
              const c = t.shadowColor || 'rgba(0,0,0,0.5)'
              shadowParts.push(`${ox}px ${oy}px ${b}px ${c}`)
            }
            const textShadowValue = shadowParts.length > 0 ? shadowParts.join(', ') : 'none'

            return (
              <div
                key={t.id}
                style={{
                  position: 'absolute',
                  left: t.x, top: t.y,
                  transform: `translate(-50%, 0) rotate(${t.rotation || 0}deg)`,
                  fontSize: `${t.fontSize}px`,
                  fontFamily: `'${t.fontFamily || 'Inter'}', sans-serif`,
                  fontWeight: t.fontWeight || 600,
                  fontStyle: t.italic ? 'italic' : 'normal',
                  textDecoration: t.underline ? 'underline' : 'none',
                  color: t.color || '#ffffff',
                  opacity: t.opacity !== undefined ? t.opacity : 1,
                  letterSpacing: `${t.letterSpacing || 0}px`,
                  lineHeight: t.lineHeight || 1.4,
                  textAlign: t.textAlign || 'center',
                  whiteSpace: 'pre-wrap',
                  zIndex: idx,
                  userSelect: 'none',
                  textShadow: textShadowValue,
                }}
              >
                {textValue}
              </div>
            )
          }

          if (layer.type === 'image') {
            const imgLayer = layer
            return (
              <div
                key={imgLayer.id}
                style={{
                  position: 'absolute',
                  left: imgLayer.x - imgLayer.width / 2,
                  top: imgLayer.y - imgLayer.height / 2,
                  width: imgLayer.width,
                  height: imgLayer.height,
                  transform: `rotate(${imgLayer.rotation || 0}deg)`,
                  opacity: imgLayer.opacity !== undefined ? imgLayer.opacity : 1,
                  zIndex: idx,
                  pointerEvents: 'none',
                }}
              >
                <img
                  src={imgLayer.image}
                  alt={imgLayer.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill',
                  }}
                  draggable={false}
                />
              </div>
            )
          }

          return null
        })}
      </div>
    )
  }

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
      {isCustom && (
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

          {/* Actual photo inside the default layout flow */}
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
            marginBottom: '24px',
            zIndex: 2,
          }}>
            {student.profileImage ? (
              <img src={student.profileImage} alt={student.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
            ) : (
              <span style={{ fontSize: '48px', fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>{getInitials(student.fullName)}</span>
            )}
          </div>

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
