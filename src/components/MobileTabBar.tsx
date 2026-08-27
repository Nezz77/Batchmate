import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Upload,
  FileText,
  Cake,
  BookOpen
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/students', icon: Users, label: 'Students' },
  { path: '/import', icon: Upload, label: 'Import' },
  { path: '/results', icon: FileText, label: 'Results' },
  { path: '/curriculum', icon: BookOpen, label: 'Curriculum' },
  { path: '/birthdays', icon: Cake, label: 'Birthdays' },
]

export default function MobileTabBar() {
  return (
    <nav className="mobile-tab-bar" aria-label="Mobile Bottom Navigation">
      <div className="mobile-tab-bar-container">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mobile-tab-item ${isActive ? 'active' : ''}`
              }
            >
              <div className="mobile-tab-icon-wrapper">
                <Icon size={20} />
              </div>
              <span className="mobile-tab-label">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
