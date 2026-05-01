/**
 * LeftSidebar Component
 *
 * Left sidebar with scene navigator and script stats.
 * Matches mockup design with INT/EXT color coding.
 */
import { useScenes } from '@/hooks';
import type { Scene } from '@/types';

interface LeftSidebarProps {
  projectId: string;
  currentSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  scenes?: Scene[];
  scriptStats?: {
    totalScenes: number;
    totalCharacters: number;
    totalLocations: number;
    estimatedRuntime: string;
    wordCount: number;
  };
}

export function LeftSidebar({
  projectId,
  currentSceneId,
  onSceneSelect,
  scenes: scenesProp,
  scriptStats,
}: LeftSidebarProps) {
  const { data: fetchedScenes = [], isLoading: hookLoading } = useScenes(projectId);
  const scenes = scenesProp ?? fetchedScenes;
  const isLoading = scenesProp ? false : hookLoading;

  // Calculate stats from scenes if not provided
  const stats = scriptStats || {
    totalScenes: scenes.length,
    totalCharacters: 0,
    totalLocations: new Set(scenes.map((s) => s.location)).size,
    estimatedRuntime: `~${Math.round(scenes.length * 1.5)} min`,
    wordCount: 0,
  };

  return (
    <aside style={sidebarStyles}>
      {/* Scenes Section */}
      <div style={sectionStyles}>
        <div style={headerStyles}>
          <span style={titleStyles}>Scenes</span>
          <button
            type="button"
            style={addButtonStyles}
            title="Add Scene"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {/* Scene List */}
        <nav style={navStyles}>
          {isLoading ? (
            <div style={loadingStyles}>Loading...</div>
          ) : scenes.length === 0 ? (
            <div style={emptyStyles}>No scenes yet</div>
          ) : (
            <div style={listStyles}>
              {scenes.map((scene) => (
                <SceneItem
                  key={scene.id}
                  scene={scene}
                  isActive={scene.id === currentSceneId}
                  onClick={() => onSceneSelect(scene.id)}
                />
              ))}
            </div>
          )}
        </nav>
      </div>

      {/* Script Stats Section */}
      <div style={{ ...sectionStyles, borderTop: '1px solid var(--border-color)' }}>
        <div style={headerStyles}>
          <span style={titleStyles}>Script Stats</span>
        </div>
        <div style={statsStyles}>
          <StatRow label="Total Scenes" value={stats.totalScenes} />
          <StatRow label="Characters" value={stats.totalCharacters} />
          <StatRow label="Locations" value={stats.totalLocations} />
          <StatRow label="Est. Runtime" value={stats.estimatedRuntime} />
          <StatRow label="Word Count" value={stats.wordCount.toLocaleString()} />
        </div>
      </div>
    </aside>
  );
}

interface SceneItemProps {
  scene: Scene;
  isActive: boolean;
  onClick: () => void;
}

function SceneItem({ scene, isActive, onClick }: SceneItemProps) {
  const isInterior = scene.interior;
  const iconColor = isInterior ? 'var(--fountain-scene)' : 'var(--success)';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...itemStyles,
        ...(isActive ? activeItemStyles : {}),
        borderLeftColor: isActive ? 'var(--accent)' : 'transparent',
      }}
      title={`${scene.heading} - ${scene.timeOfDay}`}
    >
      {/* INT/EXT Icon */}
      <div style={{ ...iconStyles, color: iconColor }}>
        {isInterior ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        )}
      </div>

      {/* Scene Info */}
      <div style={itemContentStyles}>
        <span style={itemLocationStyles}>{scene.location}</span>
        <span style={itemNumberStyles}>#{scene.order}</span>
      </div>
    </button>
  );
}

interface StatRowProps {
  label: string;
  value: string | number;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div style={statRowStyles}>
      <span style={statLabelStyles}>{label}</span>
      <span style={statValueStyles}>{value}</span>
    </div>
  );
}

// Styles
const sidebarStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: 'var(--sidebar-width)',
  minWidth: 'var(--sidebar-width)',
  background: 'var(--bg-secondary)',
  borderRight: '1px solid var(--border-color)',
  overflowY: 'auto',
  height: '100%',
};

const sectionStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
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

const navStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
};

const loadingStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-muted)',
  padding: 'var(--space-2)',
};

const emptyStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-muted)',
  padding: 'var(--space-2)',
};

const listStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
};

const itemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  borderLeft: '3px solid transparent',
  transition: 'all var(--transition-fast)',
};

const activeItemStyles: React.CSSProperties = {
  background: 'var(--accent-light)',
  color: 'var(--accent)',
};

const iconStyles: React.CSSProperties = {
  width: '16px',
  height: '16px',
  flexShrink: 0,
};

const itemContentStyles: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const itemLocationStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const itemNumberStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  fontWeight: 'var(--font-weight-semibold)',
};

const statsStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-muted)',
};

const statRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
};

const statLabelStyles: React.CSSProperties = {};

const statValueStyles: React.CSSProperties = {
  color: 'var(--text-primary)',
  fontWeight: 'var(--font-weight-medium)',
};

export default LeftSidebar;
