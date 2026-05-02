import type { Shot } from '@/types';

interface MobileShotCardsProps {
  shots: Shot[];
  sceneHeading?: string;
  sceneNumber?: number;
  onShotSelect?: (shot: Shot) => void;
}

export function MobileShotCards({
  shots,
  sceneHeading = '',
  sceneNumber = 1,
  onShotSelect,
}: MobileShotCardsProps) {
  return (
    <div className="mobile-shot-list">
      <div className="mobile-shot-list__header">
        <div className="mobile-shot-list__scene-label">Scene {sceneNumber}</div>
        <div className="mobile-shot-list__scene-heading">{sceneHeading}</div>
      </div>

      <div className="mobile-shot-list__cards">
        {shots.map((shot) => (
          <button
            key={shot.id}
            type="button"
            className="shot-card"
            onClick={() => onShotSelect?.(shot)}
          >
            <div className="shot-card__number">{shot.shotNumber}</div>
            <div className="shot-card__info">
              <div className="shot-card__type">{formatShotType(shot.type)}</div>
              <div className="shot-card__desc">{shot.actionDescription}</div>
            </div>
          </button>
        ))}
      </div>

      {shots.length > 0 && shots[0] && (
        <div className="mobile-shot-list__bottom-sheet">
          <div className="mobile-shot-list__handle" />
          <button type="button" className="mobile-shot-list__confirm-btn">
            Confirm Shot List &rarr;
          </button>
        </div>
      )}

      {shots.length === 0 && (
        <div className="mobile-shot-list__empty">
          <p>No shots generated for this scene yet.</p>
        </div>
      )}
    </div>
  );
}

function formatShotType(type: string): string {
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
}
