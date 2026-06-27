import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Upload,
  FileText,
  Cake,
} from 'lucide-react'
import ThemeSwitcher from './ThemeSwitcher'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/students', icon: Users, label: 'Students' },
  { path: '/import', icon: Upload, label: 'Import Data' },
  { path: '/results', icon: FileText, label: 'Result Sheets' },
  { path: '/birthdays', icon: Cake, label: 'Birthdays' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img
          src="/app_icons/batchmate.png"
          alt="Batchmate"
          className="sidebar-logo"
        />
        <div>
          <div className="sidebar-title">Batchmate</div>
          <div className="sidebar-subtitle">Batch Management</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <ThemeSwitcher />
        <p className="sidebar-footer-text">Batchmate v1.0.0</p>
      </div>
    </aside>
  )
}
