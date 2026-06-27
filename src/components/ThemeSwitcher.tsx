import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, Palette, Check } from 'lucide-react';

export default function ThemeSwitcher() {
  const { mode, theme, setMode, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes = [
    { id: 'ocean', label: 'Ocean', color: '#3B82F6' },
    { id: 'sunset', label: 'Sunset', color: '#F97316' },
    { id: 'emerald', label: 'Emerald', color: '#10B981' },
    { id: 'amethyst', label: 'Amethyst', color: '#8B5CF6' },
  ] as const;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="theme-switcher-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="btn btn-ghost theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}
      >
        <Palette className="nav-icon" size={20} style={{ opacity: 0.7, marginRight: '12px' }} />
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Appearance</span>
      </button>

      {isOpen && (
        <div 
          className="theme-dropdown liquid-glass"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            width: '220px',
            marginBottom: '10px',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 1000
          }}
        >
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>Mode</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setMode('light')}
                className={`btn btn-sm ${mode === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px' }}
              >
                <Sun size={16} /> Light
              </button>
              <button 
                onClick={() => setMode('dark')}
                className={`btn btn-sm ${mode === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px' }}
              >
                <Moon size={16} /> Dark
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>Theme Color</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: theme === t.id ? 'var(--accent-muted)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: theme === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 500
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.color }} />
                    {t.label}
                  </div>
                  {theme === t.id && <Check size={16} color={t.color} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
