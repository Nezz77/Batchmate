import type { Student } from '../types/electron.d'

interface StudentCardProps {
  student: Student
  onClick?: (student: Student) => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getProgrammeBadgeClass(programme: string): string {
  switch (programme.toUpperCase()) {
    case 'IT': return 'badge badge-it'
    case 'ITM': return 'badge badge-itm'
    case 'AI': return 'badge badge-ai'
    default: return 'badge badge-batch'
  }
}

function getGpaClass(gpa: number): string {
  if (gpa >= 3.5) return 'high'
  if (gpa >= 2.5) return 'mid'
  return 'low'
}

export default function StudentCard({ student, onClick }: StudentCardProps) {
  return (
    <div
      className="student-card"
      onClick={() => onClick?.(student)}
      role="button"
      tabIndex={0}
    >
      <div className="student-card-top">
        <div className="student-avatar">
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
        <div className="student-info">
          <div className="student-name">{student.fullName}</div>
          <div className="student-index">{student.indexNumber}</div>
        </div>
      </div>

      <div className="student-card-body">
        <div className="student-meta">
          <span className={getProgrammeBadgeClass(student.degreeProgramme)}>
            {student.degreeProgramme}
          </span>
          <span className="badge badge-batch">Batch {student.batch}</span>
        </div>

        <div className="gpa-indicator">
          <div className="gpa-bar">
            <div
              className={`gpa-bar-fill ${getGpaClass(student.gpa)}`}
              style={{ width: `${(student.gpa / 4.0) * 100}%` }}
            />
          </div>
          <span className="gpa-value">{student.gpa.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
