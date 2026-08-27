import { useLocation } from 'react-router-dom'
import { Smartphone, Monitor } from 'lucide-react'
import ThemeSwitcher from './ThemeSwitcher'
import { getImageUrl } from '../utils/image'

interface MobileHeaderProps {
  isIPhonePreview: boolean
  onToggleIPhonePreview: () => void
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/import': 'Import Data',
  '/results': 'Results',
  '/curriculum': 'Curriculum',
  '/birthdays': 'Birthdays',
}

export default function MobileHeader({
  isIPhonePreview,
  onToggleIPhonePreview,
}: MobileHeaderProps) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'Batchmate'

  return (
    <header className="mobile-header">
      <div className="mobile-header-content">
        <div className="mobile-header-brand">
          <img
            src={getImageUrl('/app_icons/batchmate.png')}
            alt="Batchmate"
            className="mobile-header-logo"
          />
          <div>
            <h1 className="mobile-header-title">{title}</h1>
            <span className="mobile-header-subtitle">Batch Management</span>
          </div>
        </div>

        <div className="mobile-header-actions">
          <button
            className={`btn btn-ghost btn-icon mobile-preview-toggle ${isIPhonePreview ? 'active' : ''}`}
            onClick={onToggleIPhonePreview}
            title={isIPhonePreview ? 'Switch to Desktop Layout' : 'Preview iPhone 17 Mobile Layout'}
            aria-label="Toggle iPhone 17 Preview"
          >
            {isIPhonePreview ? <Monitor size={18} /> : <Smartphone size={18} />}
          </button>
          <ThemeSwitcher placement="bottom" align="right" />
        </div>
      </div>
    </header>
  )
}
