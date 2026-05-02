import { useState } from 'react';
import type { Shot } from '@/types';

interface MobileStoryboardViewProps {
  shots: Shot[];
  sceneHeading?: string;
  sceneNumber?: number;
}

export function MobileStoryboardView({
  shots,
  sceneHeading = '',
  sceneNumber = 1,
}: MobileStoryboardViewProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedShot = shots[selectedIdx];

  return (
    <div className="mobile-storyboard">
      <div className="mobile-storyboard__header">
        <div className="mobile-storyboard__scene-label">Scene {sceneNumber}</div>
        <div className="mobile-storyboard__scene-heading">{sceneHeading}</div>
      </div>

      <div className="mobile-filmstrip">
        {shots.map((shot, i) => (
          <button
            key={shot.id}
            type="button"
            className={`mobile-filmstrip__thumb ${i === selectedIdx ? 'mobile-filmstrip__thumb--selected' : ''}`}
            onClick={() => setSelectedIdx(i)}
          >
            <div className="mobile-filmstrip__placeholder">{shot.shotNumber}</div>
          </button>
        ))}
      </div>

      {selectedShot && shots.length > 0 && (
        <div className="mobile-storyboard__detail">
          <div className="mobile-storyboard__image-area">
            <div className="mobile-storyboard__image-placeholder">
              Storyboard {selectedShot.shotNumber}
            </div>
          </div>

          <div className="mobile-storyboard__card">
            <div className="mobile-storyboard__card-header">
              <span className="mobile-storyboard__shot-label">
                Shot {selectedShot.shotNumber}: {formatShotType(selectedShot.type)}
              </span>
              <span className="badge badge--success">Ready</span>
            </div>
            <div className="mobile-storyboard__card-desc">
              {selectedShot.actionDescription}
            </div>
            <div className="mobile-storyboard__card-actions">
              <button type="button" className="btn btn--primary btn--flex">Edit</button>
              <button type="button" className="btn btn--secondary btn--flex">Regenerate</button>
            </div>
          </div>
        </div>
      )}

      {shots.length === 0 && (
        <div className="mobile-storyboard__empty">
          <p>No storyboards yet. Confirm your shot list first.</p>
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
