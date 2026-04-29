/**
 * SceneSlidePanel Component
 *
 * Full-screen slide-over scene navigator for mobile.
 * Slides in from left when hamburger is tapped.
 * Contains scene list, script stats, and add-scene action.
 */
import { useScenes } from '@/hooks';
import { useUIStore } from '@/stores';

interface SceneSlidePanelProps {
  scriptId: string;
  currentSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
}

export function SceneSlidePanel({
  scriptId,
  currentSceneId,
  onSceneSelect,
}: SceneSlidePanelProps) {
  const slidePanelOpen = useUIStore((s) => s.slidePanelOpen);
  const toggleSlidePanel = useUIStore((s) => s.toggleSlidePanel);

  const { data: scenes = [] } = useScenes(scriptId);

  const handleSelect = (sceneId: string) => {
    onSceneSelect(sceneId);
    toggleSlidePanel();
  };

  const stats = {
    totalScenes: scenes.length,
    totalLocations: new Set(scenes.map((s) => s.location)).size,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`slide-panel-overlay ${slidePanelOpen ? '' : 'slide-panel-overlay--hidden'}`}
        onClick={toggleSlidePanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className={`slide-panel ${slidePanelOpen ? 'slide-panel--open' : ''}`}>
        {/* Header */}
        <div className="slide-panel__header">
          <button
            type="button"
            className="slide-panel__close"
            onClick={toggleSlidePanel}
            aria-label="Close panel"
          >
            ×
          </button>
          <span className="slide-panel__title">Scenes</span>
          <button
            type="button"
            className="slide-panel__add-btn"
            aria-label="Add scene"
            style={{
              color: 'var(--accent)',
              background: 'none',
              border: 'none',
              fontSize: 'var(--font-size-xl)',
            }}
          >
            +
          </button>
        </div>

        {/* Content */}
        <div className="slide-panel__content">
          {scenes.map((scene) => {
            const isActive = scene.id === currentSceneId;
            const isInt = scene.interior;

            return (
              <button
                key={scene.id}
                type="button"
                className={`slide-scene-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(scene.id)}
              >
                <svg
                  className={`slide-scene-item__icon ${isInt ? 'slide-scene-item__icon--int' : 'slide-scene-item__icon--ext'}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  {isInt ? (
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  ) : (
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  )}
                </svg>
                <div className="slide-scene-item__info">
                  <div className="slide-scene-item__name">{scene.location}</div>
                  <div className="slide-scene-item__meta">
                    {isInt ? 'INT' : 'EXT'} &bull; {scene.timeOfDay}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Script Stats */}
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
              Script Stats
            </div>
            <div className="stats-grid">
              <div className="stats-grid__item">
                <div className="stats-grid__value">{stats.totalScenes}</div>
                <div className="stats-grid__label">Scenes</div>
              </div>
              <div className="stats-grid__item">
                <div className="stats-grid__value">{stats.totalLocations}</div>
                <div className="stats-grid__label">Locations</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SceneSlidePanel;
