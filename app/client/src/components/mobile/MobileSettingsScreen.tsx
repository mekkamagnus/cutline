import { useState } from 'react';

interface MobileSettingsScreenProps {
  projectName?: string;
  totalScenes?: number;
  confirmedScenes?: number;
}

export function MobileSettingsScreen({
  projectName = 'The Last Train',
  totalScenes = 12,
  confirmedScenes = 7,
}: MobileSettingsScreenProps) {
  const [autoSave, setAutoSave] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('pencil-sketch');
  const progress = totalScenes > 0 ? (confirmedScenes / totalScenes) * 100 : 0;

  return (
    <div className="mobile-settings">
      <div className="mobile-card">
        <div className="mobile-card__title">Project: {projectName}</div>
        <div className="mobile-card__subtitle">
          {totalScenes} scenes &bull; Last saved just now
        </div>
        <div className="mobile-settings__progress">
          <div className="mobile-settings__progress-bar">
            <div
              className="mobile-settings__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="mobile-settings__progress-text">
          {confirmedScenes} of {totalScenes} scenes confirmed
        </div>
      </div>

      <div className="mobile-settings__section-label">Editor</div>

      <div className="mobile-card mobile-settings__row">
        <div>
          <div className="mobile-settings__row-title">Auto-save</div>
          <div className="mobile-settings__row-desc">Every 30 seconds</div>
        </div>
        <button
          type="button"
          className={`mobile-settings__toggle ${autoSave ? 'mobile-settings__toggle--on' : ''}`}
          onClick={() => setAutoSave(!autoSave)}
          aria-label="Toggle auto-save"
        >
          <div className="mobile-settings__toggle-knob" />
        </button>
      </div>

      <div className="mobile-card mobile-settings__row">
        <div>
          <div className="mobile-settings__row-title">Font Size</div>
          <div className="mobile-settings__row-desc">16pt (100%)</div>
        </div>
        <span className="mobile-settings__arrow">&rarr;</span>
      </div>

      <div className="mobile-settings__section-label">Export</div>

      <button type="button" className="btn btn--secondary btn--full mobile-settings__export-btn">
        Export Project (JSON)
      </button>
      <button type="button" className="btn btn--secondary btn--full mobile-settings__export-btn">
        Export as Fountain (.txt)
      </button>

      <div className="mobile-settings__section-label">Storyboard Style</div>

      <div className="mobile-settings__style-grid">
        {(['pencil-sketch', 'ink-drawing', 'manga', 'watercolor'] as const).map((style) => (
          <button
            key={style}
            type="button"
            className={`btn ${selectedStyle === style ? 'btn--primary' : 'btn--secondary'} btn--sm`}
            onClick={() => setSelectedStyle(style)}
          >
            {formatStyle(style)}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatStyle(style: string): string {
  return style
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
