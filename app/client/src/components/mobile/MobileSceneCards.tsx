import type { Scene } from '@/types';

interface MobileSceneCardsProps {
  scenes: Scene[];
  onSceneSelect?: (scene: Scene) => void;
}

export function MobileSceneCards({ scenes, onSceneSelect }: MobileSceneCardsProps) {
  return (
    <div className="mobile-scene-cards">
      {scenes.map((scene, i) => (
        <button
          key={scene.id}
          type="button"
          className="mobile-scene-card"
          onClick={() => onSceneSelect?.(scene)}
        >
          <div className="mobile-scene-card__badge-row">
            <svg
              className={`mobile-scene-card__icon ${scene.interior ? 'mobile-scene-card__icon--int' : 'mobile-scene-card__icon--ext'}`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {scene.interior ? (
                <rect x="3" y="3" width="18" height="18" rx="2" />
              ) : (
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
              )}
            </svg>
            <span className="mobile-scene-card__int-ext">
              {scene.interior ? 'INT' : 'EXT'} &bull; {scene.timeOfDay}
            </span>
          </div>
          <div className="mobile-scene-card__title">
            Scene {i + 1}: {scene.location}
          </div>
          <div className="mobile-scene-card__stats">
            {Math.floor(Math.random() * 12) + 1} dialogue lines &bull; ~{Math.round(Math.random() * 2 + 0.5) * 0.5} pages
          </div>
        </button>
      ))}
    </div>
  );
}
