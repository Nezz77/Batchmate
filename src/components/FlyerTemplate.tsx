import { useRef } from 'react'
import type { Student } from '../types/electron.d'

interface FlyerTemplateProps {
  student: Student
  flyerRef?: React.RefObject<HTMLDivElement | null>
}

export default function FlyerTemplate({ student, flyerRef }: FlyerTemplateProps) {
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

  return (
    <div
      ref={ref}
      style={{
        width: '400px',
        height: '500px',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 40%, #312E81 70%, #1E1B4B 100%)',
        borderRadius: '20px',
        padding: '0',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        color: 'white',
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        background: 'rgba(139, 92, 246, 0.2)',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-60px',
        left: '-30px',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'rgba(59, 130, 246, 0.15)',
        filter: 'blur(50px)',
      }} />

      {/* Confetti dots */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: `${4 + Math.random() * 6}px`,
            height: `${4 + Math.random() * 6}px`,
            borderRadius: '50%',
            background: ['#F59E0B', '#EC4899', '#8B5CF6', '#22D3EE', '#22C55E'][i % 5],
            top: `${10 + Math.random() * 30}%`,
            left: `${5 + Math.random() * 90}%`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Content */}
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

        {/* Photo */}
        <div style={{
          width: '140px',
          height: '175px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '3px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {student.profileImage ? (
            <img
              src={student.profileImage}
              alt={student.fullName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
    </div>
  )
}
