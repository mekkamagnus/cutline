/**
 * RightPanel Component
 *
 * Right sidebar with character list, current scene info, and quick actions.
 * Matches mockup design with proper sections and styling.
 */
import type { Shot, StoryboardPanel, Scene } from '@/types';

interface Character {
  id: string;
  name: string;
  color: string;
  dialogueCount: number;
}

interface RightPanelProps {
  selectedShot: Shot | null | undefined;
  selectedStoryboard: StoryboardPanel | null | undefined;
  currentScene: Scene | null | undefined;
  characters?: Character[];
  sceneId: string;
  onEditScene?: () => void;
  onExportScene?: () => void;
  onAddNote?: () => void;
}

const DEFAULT_CHARACTERS: Character[] = [
  { id: '1', name: 'JANE', color: 'var(--accent)', dialogueCount: 42 },
  { id: '2', name: 'MARK', color: '#f59e0b', dialogueCount: 38 },
  { id: '3', name: 'SARAH', color: '#22c55e', dialogueCount: 15 },
  { id: '4', name: 'CONDUCTOR', color: '#ec4899', dialogueCount: 8 },
];

export function RightPanel({
  selectedShot,
  selectedStoryboard,
  currentScene,
  characters = DEFAULT_CHARACTERS,
  sceneId,
  onEditScene,
  onExportScene,
  onAddNote,
}: RightPanelProps) {
  return (
    <aside style={sidebarStyles}>
      {/* Characters Section */}
      <section style={sectionStyles}>
        <div style={headerStyles}>
          <span style={titleStyles}>Characters</span>
          <button
            type="button"
            style={addButtonStyles}
            title="Add Character"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <div style={characterListStyles}>
          {characters.map((char) => (
            <button
              key={char.id}
              type="button"
              style={characterItemStyles}
              title={`${char.name} - ${char.dialogueCount} lines`}
            >
              <div style={{ ...avatarStyles, background: char.color }}>
                {char.name.charAt(0)}
              </div>
              <span style={characterNameStyles}>{char.name}</span>
              <span style={characterCountStyles}>{char.dialogueCount}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Current Scene Section */}
      <section style={{ ...sectionStyles, borderTop: '1px solid var(--border-color)' }}>
        <div style={headerStyles}>
          <span style={titleStyles}>Current Scene</span>
        </div>
        {currentScene ? (
          <div style={sceneInfoStyles}>
            <div style={sceneHeadingStyles}>
              {currentScene.interior ? 'INT' : 'EXT'}. {currentScene.location} - {currentScene.timeOfDay}
            </div>
            <div style={sceneMetaStyles}>
              Characters: {currentScene.characters?.join(', ') || 'None'}
            </div>
            <div style={sceneMetaStyles}>
              Time: {currentScene.timeOfDay}
            </div>
            <button
              type="button"
              style={sceneNoteButtonStyles}
              onClick={onAddNote}
            >
              + Add Scene Note
            </button>
          </div>
        ) : (
          <div style={emptyStateStyles}>
            No scene selected
          </div>
        )}
      </section>

      {/* Quick Actions Section */}
      <section style={{ ...sectionStyles, borderTop: '1px solid var(--border-color)' }}>
        <div style={headerStyles}>
          <span style={titleStyles}>Quick Actions</span>
        </div>
        <div style={actionsStyles}>
          <button
            type="button"
            style={actionButtonStyles}
            onClick={onEditScene}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Scene
          </button>
          <button
            type="button"
            style={actionButtonStyles}
            onClick={onExportScene}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export Scene
          </button>
          <button
            type="button"
            style={actionButtonStyles}
            title="Toggle Line Numbers"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Line Numbers
          </button>
        </div>
      </section>

      {/* Shot Details (if selected) */}
      {selectedShot && (
        <section style={{ ...sectionStyles, borderTop: '1px solid var(--border-color)' }}>
          <div style={headerStyles}>
            <span style={titleStyles}>Shot Details</span>
          </div>
          <div style={shotDetailsStyles}>
            <div style={shotRowStyles}>
              <span style={shotLabelStyles}>Shot Number</span>
              <span style={shotValueStyles}>{selectedShot.shotNumber}</span>
            </div>
            <div style={shotRowStyles}>
              <span style={shotLabelStyles}>Type</span>
              <span style={shotValueStyles}>{selectedShot.type}</span>
            </div>
            <div style={shotRowStyles}>
              <span style={shotLabelStyles}>Angle</span>
              <span style={shotValueStyles}>{selectedShot.angle}</span>
            </div>
            <div style={shotRowStyles}>
              <span style={shotLabelStyles}>Movement</span>
              <span style={shotValueStyles}>{selectedShot.movement}</span>
            </div>
            <div style={shotRowStyles}>
              <span style={shotLabelStyles}>Duration</span>
              <span style={shotValueStyles}>{selectedShot.duration}s</span>
            </div>
            <div style={shotRowStyles}>
              <span style={shotLabelStyles}>Characters</span>
              <span style={shotValueStyles}>
                {selectedShot.charactersInFrame.length > 0
                  ? selectedShot.charactersInFrame.join(', ')
                  : 'None'}
              </span>
            </div>
            {selectedShot.actionDescription && (
              <div style={shotActionStyles}>
                <span style={shotLabelStyles}>Action</span>
                <p style={shotActionTextStyles}>{selectedShot.actionDescription}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </aside>
  );
}

// Styles
const sidebarStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: 'var(--right-sidebar-width)',
  minWidth: 'var(--right-sidebar-width)',
  background: 'var(--bg-secondary)',
  borderLeft: '1px solid var(--border-color)',
  overflowY: 'auto',
  height: '100%',
};

const sectionStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 'var(--space-2)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
  fontWeight: 'var(--font-weight-semibold)',
};

const addButtonStyles: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 'var(--space-1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-sm)',
  transition: 'color var(--transition-fast)',
};

const characterListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
};

const characterItemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-1) var(--space-3)',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'background var(--transition-fast)',
};

const avatarStyles: React.CSSProperties = {
  width: 'var(--space-6)',
  height: 'var(--space-6)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'white',
  flexShrink: 0,
};

const characterNameStyles: React.CSSProperties = {
  flex: 1,
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-primary)',
};

const characterCountStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-muted)',
};

const sceneInfoStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-muted)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const sceneHeadingStyles: React.CSSProperties = {
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-2)',
};

const sceneMetaStyles: React.CSSProperties = {};

const sceneNoteButtonStyles: React.CSSProperties = {
  marginTop: 'var(--space-2)',
  width: '100%',
  padding: 'var(--space-2) var(--space-3)',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--font-size-sm)',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
};

const emptyStateStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-muted)',
};

const actionsStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const actionButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  width: '100%',
  padding: 'var(--space-2) var(--space-3)',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--font-size-sm)',
  cursor: 'pointer',
};

const shotDetailsStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const shotRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--font-size-sm)',
};

const shotLabelStyles: React.CSSProperties = {
  color: 'var(--text-muted)',
};

const shotValueStyles: React.CSSProperties = {
  color: 'var(--text-primary)',
};

const shotActionStyles: React.CSSProperties = {
  marginTop: 'var(--space-2)',
};

const shotActionTextStyles: React.CSSProperties = {
  marginTop: 'var(--space-1)',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-primary)',
  lineHeight: 1.4,
};

export default RightPanel;
