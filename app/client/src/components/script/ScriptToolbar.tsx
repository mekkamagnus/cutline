/**
 * ScriptToolbar Component
 *
 * Formatting toolbar for Fountain script editor with buttons for common elements.
 */
import type { ReactNode } from 'react';

interface ScriptToolbarProps {
  onAction: (action: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  readOnly: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  children: ReactNode;
  title: string;
  disabled?: boolean;
  active?: boolean;
}

function ToolbarButton({ onClick, children, title, disabled, active }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`script-toolbar__button ${active ? 'script-toolbar__button--active' : ''}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="script-toolbar__divider" />;
}

export function ScriptToolbar({
  onAction,
  onSave,
  isSaving,
  isDirty,
  lastSaved,
  readOnly,
}: ScriptToolbarProps) {
  return (
    <div className="script-toolbar">
      <div className="script-toolbar__group">
        <ToolbarButton
          onClick={() => onAction('scene-heading')}
          title="Scene Heading (INT./EXT.)"
          disabled={readOnly}
        >
          🎬 Scene
        </ToolbarButton>
        <ToolbarButton
          onClick={() => onAction('action')}
          title="Action Description"
          disabled={readOnly}
        >
          📝 Action
        </ToolbarButton>
        <ToolbarButton
          onClick={() => onAction('character')}
          title="Character Name (Tab)"
          disabled={readOnly}
        >
          👤 Character
        </ToolbarButton>
        <ToolbarButton
          onClick={() => onAction('dialogue')}
          title="Dialogue"
          disabled={readOnly}
        >
          💬 Dialogue
        </ToolbarButton>
        <ToolbarButton
          onClick={() => onAction('parenthetical')}
          title="Parenthetical"
          disabled={readOnly}
        >
          ( )
        </ToolbarButton>
        <ToolbarButton
          onClick={() => onAction('transition')}
          title="Transition"
          disabled={readOnly}
        >
          ➡️ Transition
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="script-toolbar__group">
        <ToolbarButton
          onClick={onSave}
          title="Save (Ctrl+S)"
          disabled={!isDirty || readOnly}
          active={isDirty}
        >
          {isSaving ? '⏳ Saving...' : '💾 Save'}
        </ToolbarButton>
      </div>

      <div className="script-toolbar__status">
        {readOnly && <span className="script-toolbar__status--readonly">Read Only</span>}
        {lastSaved && !isDirty && (
          <span className="script-toolbar__status--saved">
            ✓ Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
