/**
 * BottomNav Component
 *
 * Fixed bottom navigation for mobile with 4 tabs.
 * Matches mockup-mobile.html bottom nav design.
 */
export type MobileView = 'script' | 'shots' | 'storyboards' | 'breakdown';

interface BottomNavProps {
  activeView: MobileView;
  onViewChange: (view: MobileView) => void;
}

const TABS: { view: MobileView; label: string; icon: JSX.Element }[] = [
  {
    view: 'script',
    label: 'Script',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    view: 'shots',
    label: 'Shots',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    view: 'storyboards',
    label: 'Boards',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    view: 'breakdown',
    label: 'Breakdown',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
      </svg>
    ),
  },
];

export function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.view}
          type="button"
          className={`bottom-nav__item ${activeView === tab.view ? 'active' : ''}`}
          onClick={() => onViewChange(tab.view)}
          role="tab"
          aria-selected={activeView === tab.view}
          aria-label={tab.label}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default BottomNav;
