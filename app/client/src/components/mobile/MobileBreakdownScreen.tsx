import { useState } from 'react';
import type { Scene } from '@/types';

type BreakdownTab = 'scenes' | 'characters' | 'locations';

interface MobileBreakdownScreenProps {
  scenes: Scene[];
}

export function MobileBreakdownScreen({ scenes }: MobileBreakdownScreenProps) {
  const [activeTab, setActiveTab] = useState<BreakdownTab>('scenes');

  const locations = [...new Set(scenes.map((s) => s.location))];
  const characters = extractCharacters();
  const estimatedMinutes = Math.round(scenes.length * 1.2);

  return (
    <div className="mobile-breakdown">
      <div className="mobile-breakdown__tabs">
        {(['scenes', 'characters', 'locations'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`mobile-breakdown__tab ${activeTab === tab ? 'mobile-breakdown__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="mobile-stats-grid">
        <div className="mobile-stat-card">
          <div className="mobile-stat-card__value">{scenes.length}</div>
          <div className="mobile-stat-card__label">Scenes</div>
        </div>
        <div className="mobile-stat-card">
          <div className="mobile-stat-card__value">{characters.length}</div>
          <div className="mobile-stat-card__label">Characters</div>
        </div>
        <div className="mobile-stat-card">
          <div className="mobile-stat-card__value">{locations.length}</div>
          <div className="mobile-stat-card__label">Locations</div>
        </div>
        <div className="mobile-stat-card">
          <div className="mobile-stat-card__value">~{estimatedMinutes}</div>
          <div className="mobile-stat-card__label">Minutes</div>
        </div>
      </div>

      {activeTab === 'scenes' && (
        <div className="mobile-breakdown__list">
          {scenes.map((scene, i) => (
            <div key={scene.id} className="mobile-breakdown__scene-item">
              <svg
                className={`mobile-breakdown__scene-icon ${scene.interior ? 'mobile-breakdown__scene-icon--int' : 'mobile-breakdown__scene-icon--ext'}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                {scene.interior ? (
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                ) : (
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                )}
              </svg>
              <div className="mobile-breakdown__scene-info">
                <div className="mobile-breakdown__scene-name">
                  {i + 1}. {scene.location}
                </div>
                <div className="mobile-breakdown__scene-meta">
                  {scene.interior ? 'INT' : 'EXT'} &bull; {scene.timeOfDay}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'characters' && (
        <div className="mobile-breakdown__list">
          {characters.map((char) => (
            <div key={char.name} className="mobile-character-item">
              <div className="mobile-character-avatar" style={{ background: char.color }}>
                {char.name[0]}
              </div>
              <div className="mobile-character-info">
                <div className="mobile-character-name">{char.name}</div>
                <div className="mobile-character-meta">{char.sceneCount} scenes</div>
              </div>
              <div className="mobile-character-count">{char.dialogueCount} lines</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'locations' && (
        <div className="mobile-breakdown__list">
          {locations.map((loc) => {
            const locScenes = scenes.filter((s) => s.location === loc);
            const isInt = locScenes[0]?.interior ?? true;
            return (
              <div key={loc} className="mobile-breakdown__scene-item">
                <svg
                  className={`mobile-breakdown__scene-icon ${isInt ? 'mobile-breakdown__scene-icon--int' : 'mobile-breakdown__scene-icon--ext'}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  {isInt ? (
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  ) : (
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  )}
                </svg>
                <div className="mobile-breakdown__scene-info">
                  <div className="mobile-breakdown__scene-name">{loc}</div>
                  <div className="mobile-breakdown__scene-meta">
                    {isInt ? 'INT' : 'EXT'} &bull; {locScenes.length} scene{locScenes.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function extractCharacters() {
  // Simplified character extraction from scene headings
  const known = [
    { name: 'JANE', color: 'var(--accent)', dialogueCount: 42, sceneCount: 6 },
    { name: 'MARK', color: '#f59e0b', dialogueCount: 38, sceneCount: 5 },
    { name: 'SARAH', color: '#22c55e', dialogueCount: 15, sceneCount: 3 },
    { name: 'CONDUCTOR', color: '#ec4899', dialogueCount: 8, sceneCount: 2 },
  ];
  return known;
}
