import { useState, useEffect } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Users, GraduationCap, TrendingUp, Cake } from 'lucide-react'
import type { DashboardStats, Student } from '../types/electron.d'

const PROGRAMME_COLORS: Record<string, string> = {
  IT: '#3B82F6',
  ITM: '#8B5CF6',
  AI: '#06B6D4',
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#1A2332',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#F1F5F9',
  fontSize: 13,
}

function StatCard({
  label, value, icon: Icon, color, subtitle,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<any>
  color: string
  subtitle?: string
}) {
  return (
    <div className={`stat-card ${color} animate-in`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      {subtitle && (
        <div className="stat-card-change neutral">{subtitle}</div>
      )}
    </div>
  )
}

function UpcomingBirthdayItem({ student }: { student: Student }) {
  const dob = new Date(student.dateOfBirth)
  const now = new Date()
  const thisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate())
  if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1)
  const diffDays = Math.round((thisYear.getTime() - now.getTime()) / 86400000)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="student-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
        {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
          {student.fullName}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(dob)}
          {' · '}{student.degreeProgramme}
        </div>
      </div>
      <span style={{
        padding: '2px 10px', borderRadius: 'var(--radius-full)',
        fontSize: 11, fontWeight: 700,
        background: diffDays === 0
          ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.05)',
        color: diffDays === 0 ? '#EC4899' : 'var(--text-tertiary)',
      }}>
        {diffDays === 0 ? '🎂 Today!' : `${diffDays}d`}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.students.getStats().then(s => {
      setStats(s)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton skeleton-heading" />
          <div className="skeleton skeleton-text" style={{ width: 260 }} />
        </div>
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats || stats.totalStudents === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your batch</p>
        </div>
        <div className="empty-state" style={{ marginTop: 80 }}>
          <Users className="empty-state-icon" />
          <h2 className="empty-state-title">No students yet</h2>
          <p className="empty-state-text">
            Import your Excel file on the <strong>Import Data</strong> page to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Batch overview — {stats.totalStudents} students across {stats.batchDistribution.length} batch(es)
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="blue"
          subtitle="Across all programmes"
        />
        <StatCard
          label="Average GPA"
          value={stats.avgGpa.toFixed(2)}
          icon={TrendingUp}
          color="green"
          subtitle="Across all students"
        />
        <StatCard
          label="Programmes"
          value={stats.programmeDistribution.length}
          icon={GraduationCap}
          color="orange"
          subtitle={stats.programmeDistribution.map(p => p.name).join(' · ')}
        />
        <StatCard
          label="Birthdays (30 days)"
          value={stats.upcomingBirthdays.length}
          icon={Cake}
          color="pink"
          subtitle="Upcoming celebrations"
        />
      </div>

      {/* Charts */}
      <div className="charts-grid animate-in animate-in-delay-2">
        {/* GPA Distribution */}
        <div className="chart-card">
          <div className="chart-title">GPA Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.gpaDistribution} barSize={28}>
              <XAxis
                dataKey="range"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Programme Distribution */}
        <div className="chart-card">
          <div className="chart-title">Programme Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.programmeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="count"
                nameKey="name"
              >
                {stats.programmeDistribution.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={PROGRAMME_COLORS[entry.name] || '#64748B'}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ fontSize: 13, color: 'var(--text-secondary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="animate-in animate-in-delay-3">
        {/* Batch Breakdown */}
        <div className="chart-card">
          <div className="chart-title">Batch Breakdown</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.batchDistribution} barSize={32}>
              <XAxis
                dataKey="batch"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Birthdays */}
        <div className="chart-card">
          <div className="chart-title">🎂 Upcoming Birthdays</div>
          {stats.upcomingBirthdays.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <p className="empty-state-text">No birthdays in the next 30 days</p>
            </div>
          ) : (
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {stats.upcomingBirthdays.map(s => (
                <UpcomingBirthdayItem key={s.id} student={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
