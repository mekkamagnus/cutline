/**
 * ViewModeToggle Component
 *
 * Toggle between different workspace view modes.
 */

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

export function ViewModeToggle({ currentMode, onModeChange }: ViewModeToggleProps) {
  return (
    <div className="view-mode-toggle">
      {VIEW_MODES.map(({ mode, label, icon }) => (
        <button
          key={mode}
          type="button"
          className={`view-mode-toggle__btn ${
            currentMode === mode ? 'view-mode-toggle__btn--active' : ''
          }`}
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
