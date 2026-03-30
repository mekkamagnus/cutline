/**
 * ViewModeToggle Component
 *
 * Toggle between different workspace view modes.
 */
import { useState } from 'react';

export type ViewMode = 'script' | 'shots' | 'storyboard' | 'split';

  interface ViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}


const VIEW_MODES: Array<{ mode: ViewMode; label: string; icon: string }> = [
  { mode: 'script', label: 'Script', icon: '📝' },
  { mode: 'shots', label: 'Shots', icon: '🎬' },
  { mode: 'storyboard', label: 'Storyboard', icon: '🖼️' },
  { mode: 'split', label: 'Split', icon: '↔️' },
];

const viewToggleStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-1)',
  padding: 'var(--space-1)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--bg-tertiary)',
};

const pillStyles: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: 'var(--font-size-sm)',
  transition: 'all var(--transition-fast)',
};

const pillActiveStyles: React.CSSProperties = {
  background: 'var(--accent)',
  color: 'white',
  boxShadow: 'var(--shadow-sm)',
};

const pillLabelStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
};

const iconStyles: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: 1,
};

export function ViewModeToggle({ currentMode, onModeChange }: ViewModeToggleProps) {
  return (
    <div style={viewToggleStyles}>
      {VIEW_MODES.map(({ mode, label, icon }) => (
        <button
          key={mode}
          type="button"
          style={{
            ...pillStyles,
            ...(currentMode === mode ? pillActiveStyles : {}),
          }}
          onClick={() => onModeChange(mode)}
          title={label}
        >
          <span className="view-mode-toggle__icon">{icon}</span>
          <span className="view-mode-toggle__label">{label}</span>
        </button>
      ))}
    </div>
  );
}
