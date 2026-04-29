/**
 * MobileFormatBar Component
 *
 * Scrollable horizontal format buttons + FAB that opens quick-format overlay.
 * Matches mockup-mobile.html format bar design.
 */
import { useUIStore } from '@/stores';

type FormatType = 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot' | 'note';

interface MobileFormatBarProps {
  onFormat?: (type: FormatType) => void;
  activeType?: FormatType;
}

const FORMAT_BUTTONS: { type: FormatType; label: string; color: string }[] = [
  { type: 'scene', label: 'Scene', color: 'var(--fountain-scene)' },
  { type: 'character', label: 'Char', color: 'var(--fountain-character)' },
  { type: 'dialogue', label: 'Dial', color: 'var(--fountain-dialogue)' },
  { type: 'action', label: 'Act', color: 'var(--fountain-action)' },
  { type: 'parenthetical', label: 'Paren', color: 'var(--fountain-parenthetical)' },
  { type: 'transition', label: 'Trans', color: 'var(--fountain-transition)' },
];

const QUICK_FORMAT_ITEMS: { type: FormatType; label: string; color: string }[] = [
  { type: 'scene', label: 'Scene', color: 'var(--fountain-scene)' },
  { type: 'action', label: 'Action', color: 'var(--fountain-action)' },
  { type: 'character', label: 'Character', color: 'var(--fountain-character)' },
  { type: 'dialogue', label: 'Dialogue', color: 'var(--fountain-dialogue)' },
  { type: 'parenthetical', label: 'Paren.', color: 'var(--fountain-parenthetical)' },
  { type: 'transition', label: 'Transition', color: 'var(--fountain-transition)' },
  { type: 'shot', label: 'Shot', color: 'var(--fountain-shot)' },
  { type: 'note', label: 'Note', color: 'var(--text-secondary)' },
];

export function MobileFormatBar({ onFormat, activeType }: MobileFormatBarProps) {
  const quickFormatOpen = useUIStore((s) => s.quickFormatOpen);
  const setQuickFormatOpen = useUIStore((s) => s.setQuickFormatOpen);

  const handleFormat = (type: FormatType) => {
    onFormat?.(type);
    setQuickFormatOpen(false);
  };

  return (
    <>
      {/* Scrollable Format Bar */}
      <div className="mobile-format-bar">
        {FORMAT_BUTTONS.map((btn) => (
          <button
            key={btn.type}
            type="button"
            className={`mobile-format-bar__btn ${activeType === btn.type ? 'active' : ''}`}
            onClick={() => handleFormat(btn.type)}
          >
            <span className="mobile-format-bar__dot" style={{ background: btn.color }} />
            {btn.label}
          </button>
        ))}
        <button
          type="button"
          className="mobile-format-bar__btn"
          onClick={() => setQuickFormatOpen(true)}
        >
          More ▾
        </button>
      </div>

      {/* FAB */}
      <button
        type="button"
        className="fab"
        onClick={() => setQuickFormatOpen(true)}
        aria-label="Quick format"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'white' }}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Quick Format Overlay */}
      <div
        className={`quick-format-overlay ${quickFormatOpen ? 'quick-format-overlay--open' : ''}`}
      >
        <div className="quick-format-overlay__header">
          <span className="quick-format-overlay__title">Format Element</span>
          <button
            type="button"
            className="quick-format-overlay__close"
            onClick={() => setQuickFormatOpen(false)}
            aria-label="Close format panel"
          >
            ✕
          </button>
        </div>
        <div className="quick-format-grid">
          {QUICK_FORMAT_ITEMS.map((item) => (
            <button
              key={item.type}
              type="button"
              className="quick-format-grid__btn"
              style={{ color: item.color }}
              onClick={() => handleFormat(item.type)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default MobileFormatBar;
