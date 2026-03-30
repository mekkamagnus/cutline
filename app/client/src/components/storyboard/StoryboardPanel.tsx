/**
 * StoryboardPanel Component
 *
 * Individual storyboard panel with image, metadata, and version history.
 */
import { useState } from 'react';
import type { StoryboardPanel as StoryboardPanelType } from '@/types';

interface StoryboardPanelProps {
  storyboard: StoryboardPanelType;
  onClick?: () => void;
  isSelected?: boolean;
  onVersionChange?: (versionIndex: number) => void;
}

export function StoryboardPanel({
  storyboard,
  onClick,
  isSelected,
  onVersionChange,
}: StoryboardPanelProps) {
  const [showVersions, setShowVersions] = useState(false);

  const hasVersions = storyboard.previousVersions.length > 0;
  const currentVersion = storyboard.version;

  return (
    <div
      className={`storyboard-panel ${isSelected ? 'storyboard-panel--selected' : ''}`}
      onClick={onClick}
    >
      {/* Main image */}
      <div className="storyboard-panel__image-container">
        <img
          src={storyboard.imageUrl}
          alt={`Storyboard panel v${currentVersion}`}
          className="storyboard-panel__image"
          loading="lazy"
        />

        {/* Version badge */}
        {currentVersion > 1 && (
          <span className="storyboard-panel__version-badge">v{currentVersion}</span>
        )}

        {/* Version toggle */}
        {hasVersions && (
          <button
            type="button"
            className="storyboard-panel__version-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setShowVersions(!showVersions);
            }}
            title="View version history"
          >
            📚
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="storyboard-panel__metadata">
        <div className="storyboard-panel__stat">
          <span className="storyboard-panel__stat-label">Style</span>
          <span className="storyboard-panel__stat-value">{storyboard.style}</span>
        </div>
        <div className="storyboard-panel__stat">
          <span className="storyboard-panel__stat-label">API</span>
          <span className="storyboard-panel__stat-value">{storyboard.apiProvider}</span>
        </div>
        <div className="storyboard-panel__stat">
          <span className="storyboard-panel__stat-label">Cost</span>
          <span className="storyboard-panel__stat-value">${storyboard.cost.toFixed(4)}</span>
        </div>
      </div>

      {/* Prompt */}
      {storyboard.generationParams.prompt && (
        <div className="storyboard-panel__prompt">
          <p className="storyboard-panel__prompt-text">
            {storyboard.generationParams.prompt}
          </p>
        </div>
      )}

      {/* Refinement prompt */}
      {storyboard.refinementPrompt && (
        <div className="storyboard-panel__refinement">
          <span className="storyboard-panel__refinement-label">Refinement</span>
          <p className="storyboard-panel__refinement-text">{storyboard.refinementPrompt}</p>
        </div>
      )}

      {/* Version history */}
      {showVersions && hasVersions && (
        <div className="storyboard-panel__versions">
          <h4 className="storyboard-panel__versions-title">Version History</h4>
          <ul className="storyboard-panel__versions-list">
            {storyboard.previousVersions.map((version, index) => (
              <li
                key={index}
                className="storyboard-panel__version-item"
                onClick={(e) => {
                  e.stopPropagation();
                  onVersionChange?.(index);
                }}
              >
                <span className="storyboard-panel__version-number">v{version.version}</span>
                <span className="storyboard-panel__version-date">
                  {new Date(version.generatedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generated timestamp */}
      <div className="storyboard-panel__footer">
        <span className="storyboard-panel__timestamp">
          Generated: {new Date(storyboard.generatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
