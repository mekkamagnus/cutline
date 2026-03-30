/**
 * Header Component
 *
 * Main application header with logo, navigation tabs, and actions.
 * Matches mockup.html design with three-panel layout.
 */
import { NavLink, useParams } from 'react-router-dom';

interface HeaderProps {
  viewMode?: 'script' | 'shots' | 'storyboards' | 'breakdown';
  onViewModeChange?: (mode: 'script' | 'shots' | 'storyboards' | 'breakdown') => void;
}

export function Header({ viewMode = 'script', onViewModeChange }: HeaderProps) {
  const { projectId } = useParams<{ projectId: string }>();

  const navTabs = [
    { id: 'script', label: 'Script', path: `/project/${projectId}/script` },
    { id: 'shots', label: 'Shots', path: `/project/${projectId}/shots` },
    { id: 'storyboards', label: 'Storyboards', path: `/project/${projectId}/storyboards` },
    { id: 'breakdown', label: 'Breakdown', path: `/project/${projectId}/breakdown` },
  ] as const;

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
          <NavLink
            key={tab.id}
            to={tab.path}
            style={({ isActive }) => ({
              ...navTabStyles,
              ...(isActive ? activeTabStyles : {}),
            })}
            onClick={() => onViewModeChange?.(tab.id)}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Right Side */}
      <div style={rightStyles}>
        <span style={versionBadgeStyles}>v1.0 Phase 1</span>
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
