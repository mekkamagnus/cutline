/**
 * FormatBar Component
 *
 * Bottom format bar with styled buttons for fountain elements.
 * Color-coded to match fountain element colors.
 * Has utility buttons with icons
 */
import { useState, useEffect } from 'react';

export type FountainElementType = 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';

interface FormatBarProps {
  onFormat?: (type: FountainElementType | string) => void;
  activeType?: FountainElementType;
  disabled?: boolean;
}

const formatButtons: { type: FountainElementType; label: string; shortcut: string; color: string }[] = [
  { type: 'scene', label: 'Scene', shortcut: '⌘↵', color: 'var(--fountain-scene)' },
  { type: 'action', label: 'Action', shortcut: 'A', color: 'var(--fountain-action)' },
  { type: 'character', label: 'Character', shortcut: 'C', color: 'var(--fountain-character)' },
  { type: 'dialogue', label: 'Dialogue', shortcut: 'D', color: 'var(--fountain-dialogue)' },
  { type: 'parenthetical', label: 'Paren.', shortcut: 'P', color: 'var(--fountain-parenthetical)' },
  { type: 'transition', label: 'Transition', shortcut: 'T', color: 'var(--fountain-transition)' },
];

const utilityButtons = [
  { type: 'find', label: 'Find', icon: '🔍', shortcut: 'Ctrl+F' },
  { type: 'spellcheck', label: 'Spell Check', icon: '✓', shortcut: '' },
  { type: 'focus', label: 'Focus Mode', icon: '⊞', shortcut: 'Esc' },
];

export function FormatBar({ onFormat, activeType, disabled = false }: FormatBarProps) {
  const [isMac, setIsMac] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const getButtonStyles = (type: FountainElementType, color: string): React.CSSProperties => {
    const isActive = activeType === type;
    const isHovered = hoveredBtn === type;

    return {
      ...formatBtnStyles,
      ...(isHovered ? formatBtnHoverStyles : {}),
      ...(isActive ? { ...activeBtnStyles, background: color, borderColor: color } : {}),
      ...(disabled ? disabledBtnStyles : {}),
    };
  };

  return (
    <div style={formatBarStyles}>
      {/* Left: Format Buttons */}
      <div style={buttonGroupStyles}>
        {formatButtons.map((btn) => (
          <button
            key={btn.type}
            type="button"
            onClick={() => onFormat?.(btn.type)}
            disabled={disabled}
            onMouseEnter={() => setHoveredBtn(btn.type)}
            onMouseLeave={() => setHoveredBtn(null)}
            style={getButtonStyles(btn.type, btn.color)}
            title={`${btn.label} (${isMac ? btn.shortcut : btn.shortcut.replace('⌘', 'Ctrl+')})`}
          >
            <span style={{ color: btn.color }}>●</span>
            <span>{btn.label}</span>
            <span style={shortcutStyles}>{btn.shortcut}</span>
          </button>
        ))}
      </div>

      <div style={dividerStyles} />

      {/* Right: Utility Buttons */}
      <div style={buttonGroupStyles}>
        {utilityButtons.map((btn) => (
          <button
            key={btn.type}
            type="button"
            onClick={() => onFormat?.(btn.type)}
            disabled={disabled}
            onMouseEnter={() => setHoveredBtn(btn.type)}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              ...utilityBtnStyles,
              ...(hoveredBtn === btn.type ? formatBtnHoverStyles : {}),
              ...(disabled ? disabledBtnStyles : {}),
            }}
            title={`${btn.label}${btn.shortcut ? ` (${isMac ? btn.shortcut : btn.shortcut.replace('Ctrl', 'Cmd')})` : ''}`}
          >
            <span style={iconWrapperStyles}>{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Styles
const formatBarStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--bg-secondary)',
  borderTop: '1px solid var(--border-color)',
  height: 'var(--format-bar-height)',
  position: 'sticky',
  bottom: 0,
  zIndex: 'var(--z-sticky)',
};

const buttonGroupStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-1)',
  alignItems: 'center',
};

const formatBtnStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid transparent',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 'var(--font-weight-medium)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  minWidth: '90px',
  minHeight: '36px',
};

const formatBtnHoverStyles: React.CSSProperties = {
  background: 'var(--bg-hover)',
  borderColor: 'var(--border-light)',
};

const activeBtnStyles: React.CSSProperties = {
  color: 'white',
  borderColor: 'var(--accent)',
};

const disabledBtnStyles: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

const shortcutStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  opacity: 0.7,
  marginLeft: 'var(--space-1)',
};

const dividerStyles: React.CSSProperties = {
  width: '1px',
  height: '24px',
  background: 'var(--border-color)',
  margin: '0 var(--space-2)',
};

const utilityBtnStyles: React.CSSProperties = {
  ...formatBtnStyles,
  minWidth: 'auto',
};

const iconWrapperStyles: React.CSSProperties = {
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default FormatBar;
