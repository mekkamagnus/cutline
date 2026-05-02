import { useUIStore } from '@/stores';

interface MobileTopBarProps {
  title?: string;
  currentScene?: number;
  totalScenes?: number;
  onPrevScene?: () => void;
  onNextScene?: () => void;
  variant?: 'main' | 'sub';
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function MobileTopBar({
  title = 'Untitled',
  currentScene = 1,
  totalScenes = 1,
  onPrevScene,
  onNextScene,
  variant = 'main',
  onBack,
  rightAction,
}: MobileTopBarProps) {
  const toggleSlidePanel = useUIStore((s) => s.toggleSlidePanel);
  const setMobileSubView = useUIStore((s) => s.setMobileSubView);

  if (variant === 'sub') {
    return (
      <div className="mobile-sub-top-bar">
        <button
          type="button"
          className="mobile-sub-top-bar__btn"
          onClick={onBack ?? (() => setMobileSubView(null))}
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="mobile-sub-top-bar__title">{title}</span>
        {rightAction ?? <div style={{ width: 44 }} />}
      </div>
    );
  }

  return (
    <>
      <div className="mobile-top-bar">
        <button
          type="button"
          className="mobile-top-bar__btn"
          onClick={toggleSlidePanel}
          aria-label="Open scene navigator"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 4h18M3 12h18M3 20h18" />
          </svg>
        </button>

        <span className="mobile-top-bar__title">{title}</span>

        <div className="view-toggle--mobile">
          <button type="button" className="active" title="Script view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </button>
          <button type="button" title="Cards view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="scene-nav-bar">
        <button
          type="button"
          className="scene-nav-bar__btn"
          onClick={onPrevScene}
          disabled={currentScene <= 1}
          aria-label="Previous scene"
        >
          ←
        </button>
        <span className="scene-nav-bar__text">
          Scene <strong>{currentScene}</strong> of {totalScenes}
        </span>
        <button
          type="button"
          className="scene-nav-bar__btn"
          onClick={onNextScene}
          disabled={currentScene >= totalScenes}
          aria-label="Next scene"
        >
          →
        </button>
      </div>
    </>
  );
}

export default MobileTopBar;
