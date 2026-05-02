/**
 * Header Component
 *
 * Main application header with logo, navigation tabs, and actions.
 * Matches mockup.html design with three-panel layout.
 */
import { useSettingsStore } from '@/stores';

interface HeaderProps {
  viewMode?: 'script' | 'shots' | 'storyboards' | 'breakdown';
  onNavigate?: (mode: string) => void;
}

export function Header({ viewMode = 'script', onNavigate }: HeaderProps) {
  const toggleSettings = useSettingsStore((s) => s.toggleSettings);
  const navTabs = [
    { id: 'script' as const, label: 'Script' },
    { id: 'shots' as const, label: 'Shots' },
    { id: 'storyboards' as const, label: 'Storyboards' },
    { id: 'breakdown' as const, label: 'Breakdown' },
  ];

  return (
    <header style={headerStyles}>
      {/* Logo */}
      <div style={logoStyles}>
        <span style={logoTitleStyles}>Cutline</span>
        <span style={logoTaglineStyles}>Writer-First Screenwriting</span>
      </div>

      {/* Navigation Tabs */}
      <nav style={navStyles}>
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            style={{
              ...navTabStyles,
              ...(viewMode === tab.id ? activeTabStyles : {}),
            }}
            onClick={() => onNavigate?.(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right Side */}
      <div style={rightStyles}>
        <span style={versionBadgeStyles}>v1.0 Phase 1</span>
        <button
          type="button"
          style={settingsButtonStyles}
          onClick={toggleSettings}
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
          </svg>
        </button>
        <button
          type="button"
          style={exportButtonStyles}
          title="Export Script"
        >
          📤 Export
        </button>
      </div>
    </header>
  );
}

// Styles
const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'var(--space-4) var(--space-6)',
  background: 'rgba(15, 15, 15, 0.95)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid var(--border-color)',
  position: 'sticky',
  top: 0,
  zIndex: 'var(--z-sticky)',
  height: 'var(--header-height)',
};

const logoStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
};

const logoTitleStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-xl)',
  fontWeight: 'var(--font-weight-bold)',
  color: 'var(--accent)',
};

const logoTaglineStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-muted)',
  fontWeight: 'var(--font-weight-normal)',
};

const navStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-1)',
  background: 'var(--bg-tertiary)',
  padding: 'var(--space-1)',
  borderRadius: 'var(--radius-md)',
};

const navTabStyles: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 'var(--font-weight-medium)',
  textDecoration: 'none',
  border: 'none',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

const activeTabStyles: React.CSSProperties = {
  background: 'var(--accent)',
  color: 'white',
};

const rightStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
};

const versionBadgeStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-muted)',
  padding: 'var(--space-1) var(--space-2)',
  background: 'var(--bg-tertiary)',
  borderRadius: 'var(--radius-sm)',
};

const settingsButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-2)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

const exportButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-2) var(--space-4)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 'var(--font-weight-medium)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

export default Header;
