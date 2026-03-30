/**
 * StoryboardGenerator Component
 *
 * Controls for generating storyboards from confirmed shot lists.
 * Implements paradigm gate: requires confirmed shot list.
 */
import { useState, useCallback } from 'react';
import { useGenerateStoryboards, useShotListConfirmationStatus, useShots } from '@/hooks';
import type { GenerationStatus } from '@/hooks';

interface StoryboardGeneratorProps {
  sceneId: string;
  onGenerationComplete?: () => void;
}

const STORYBOARD_STYLES = [
  { value: 'pencil-sketch', label: 'Pencil Sketch' },
  { value: 'ink-drawing', label: 'Ink Drawing' },
  { value: 'manga', label: 'Manga/Comic' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'noir', label: 'Noir' },
  { value: 'storyboard', label: 'Traditional Storyboard' },
] as const;

export function StoryboardGenerator({ sceneId, onGenerationComplete }: StoryboardGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState('pencil-sketch');
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);

  const { data: shots = [] } = useShots(sceneId);
  const { data: confirmationStatus } = useShotListConfirmationStatus(sceneId);
  const generateStoryboards = useGenerateStoryboards();

  const isConfirmed = confirmationStatus?.isConfirmed ?? false;
  const confirmedShots = shots.filter((s) => s.confirmed);
  const ungeneratedShots = shots.filter((s) => s.confirmed); // Would need storyboard check

  const handleGenerate = useCallback(async () => {
    if (!isConfirmed) {
      alert('Shot list must be confirmed before generating storyboards');
      return;
    }

    if (confirmedShots.length === 0) {
      alert('No confirmed shots to generate');
      return;
    }

    const shotIds = confirmedShots.map((s) => s.id);

    await generateStoryboards.mutateAsync({
      shotIds,
      style: selectedStyle,
      onProgress: setGenerationStatus,
    });

    onGenerationComplete?.();
  }, [isConfirmed, confirmedShots, selectedStyle, generateStoryboards, onGenerationComplete]);

  const isGenerating = generationStatus?.isGenerating ?? false;

  return (
    <div className="storyboard-generator">
      {/* Paradigm gate warning */}
      {!isConfirmed && (
        <div className="storyboard-generator__warning">
          ⚠️ Shot list must be confirmed before generating storyboards
        </div>
      )}

      {/* Style selector */}
      <div className="storyboard-generator__style-selector">
        <label className="storyboard-generator__label">Visual Style</label>
        <select
          className="storyboard-generator__select"
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
          disabled={isGenerating}
        >
          {STORYBOARD_STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
      </div>

      {/* Generation controls */}
      <div className="storyboard-generator__controls">
        <button
          type="button"
          className="storyboard-generator__button"
          onClick={handleGenerate}
          disabled={!isConfirmed || isGenerating || confirmedShots.length === 0}
        >
          {isGenerating ? (
            <>
              <span className="storyboard-generator__spinner">⏳</span>
              Generating...
            </>
          ) : (
            <>🎨 Generate Storyboards</>
          )}
        </button>

        {/* Stats */}
        <div className="storyboard-generator__stats">
          <div className="storyboard-generator__stat">
              <span className="storyboard-generator__stat-label">Confirmed Shots</span>
              <span className="storyboard-generator__stat-value">{confirmedShots.length}</span>
          </div>
          <div className="storyboard-generator__stat">
              <span className="storyboard-generator__stat-label">Est. Cost</span>
              <span className="storyboard-generator__stat-value">
                  ${(confirmedShots.length * 0.002).toFixed(3)}
              </span>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      {isGenerating && generationStatus && (
          <div className="storyboard-generator__progress">
              <div className="storyboard-generator__progress-bar">
                  <div
                      className="storyboard-generator__progress-fill"
                      style={{ width: `${generationStatus.progress}%` }}
                  />
              </div>
              <span className="storyboard-generator__progress-text">
                  {generationStatus.currentShot} / {generationStatus.totalShots} shots
              </span>
          </div>
      )}
    </div>
  );
}
