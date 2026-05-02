import type { ShotSuggestion } from '@/types';

interface MobileAISuggestionsProps {
  suggestions?: ShotSuggestion[];
  onAccept?: (index: number) => void;
  onAcceptAll?: () => void;
}

const DEFAULT_SUGGESTIONS: ShotSuggestion[] = [
  {
    type: 'wide',
    angle: 'eye-level',
    movement: 'static',
    charactersInFrame: [],
    actionDescription: 'Wide Establishing Shot',
    reasoning: 'Establish the coffee shop location and show Jane isolated at the corner table.',
    confidence: 0.9,
  },
  {
    type: 'medium',
    angle: 'eye-level',
    movement: 'static',
    charactersInFrame: ['JANE'],
    actionDescription: 'Medium - Character Action',
    reasoning: "Focus on Jane's determined expression as she types.",
    confidence: 0.8,
  },
  {
    type: 'close-up',
    angle: 'low-angle',
    movement: 'static',
    charactersInFrame: ['MARK'],
    actionDescription: "Close-up - Mark's entrance",
    reasoning: "Emphasize Mark's hesitation as he approaches Jane.",
    confidence: 0.75,
  },
];

export function MobileAISuggestions({
  suggestions = DEFAULT_SUGGESTIONS,
  onAccept,
  onAcceptAll,
}: MobileAISuggestionsProps) {
  return (
    <div className="mobile-suggestions">
      <div className="mobile-suggestions__count">
        {suggestions.length} suggestions for Scene 1
      </div>

      {suggestions.map((suggestion, i) => {
        if (!suggestion) return null;
        return (
        <div
          key={i}
          className={`mobile-suggestion-card ${i === 0 ? 'mobile-suggestion-card--new' : ''}`}
        >
          <div className="mobile-suggestion-card__header">
            <span className="mobile-suggestion-card__title">
              Suggested Shot {i + 1}
            </span>
            {i === 0 && (
              <span className="mobile-suggestion-card__badge">New</span>
            )}
          </div>
          <div className="mobile-suggestion-card__desc">
            {suggestion.actionDescription}
          </div>
          <div className="mobile-suggestion-card__tags">
            <span className="badge" style={{ background: '#dc2626', color: 'white' }}>
              {formatShotType(suggestion.type)}
            </span>
            <span className="badge" style={{ background: 'var(--bg-hover)' }}>
              {formatAngle(suggestion.angle)}
            </span>
          </div>
          <div className="mobile-suggestion-card__reasoning">
            {suggestion.reasoning}
          </div>
          <div className="mobile-suggestion-card__actions">
            <button
              type="button"
              className="btn btn--primary btn--flex"
              onClick={() => onAccept?.(i)}
            >
              Accept
            </button>
            <button type="button" className="btn btn--secondary">Edit</button>
          </div>
        </div>
        );
      })}

      {suggestions.length > 1 && (
        <div className="mobile-suggestions__batch">
          <button
            type="button"
            className="btn btn--primary btn--full"
            onClick={onAcceptAll}
          >
            Accept All ({suggestions.length})
          </button>
        </div>
      )}
    </div>
  );
}

function formatShotType(type: string): string {
  return type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
}

function formatAngle(angle: string): string {
  return angle.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
