import { useState, useEffect, useCallback, useRef } from 'react';
import { StoryboardGenerator } from './StoryboardGenerator';
import { RefinementPanel } from './RefinementPanel';
import { useShots, useShotListConfirmationStatus, useStoryboardsForShots, useCreateShot } from '@/hooks';
import type { Shot, ShotData, StoryboardPanel } from '@/types';

interface StoryboardScreenProps {
  sceneId: string;
  initialShots?: Shot[];
}

export function StoryboardScreen({ sceneId, initialShots }: StoryboardScreenProps) {
  const [selectedStoryboard, setSelectedStoryboard] = useState<StoryboardPanel | null>(null);
  const [storyboardMap, setStoryboardMap] = useState<Map<string, StoryboardPanel>>(new Map());
  const hasSeeded = useRef(false);

  const { data: shots = [], isLoading } = useShots(sceneId);
  const { data: confirmationStatus } = useShotListConfirmationStatus(sceneId);
  const createShot = useCreateShot();

  const displayShots = shots.length > 0 ? shots : (initialShots ?? []);

  // Auto-seed initialShots into IndexedDB when DB is empty
  useEffect(() => {
    if (isLoading || shots.length > 0 || !initialShots || initialShots.length === 0 || hasSeeded.current) return;

    hasSeeded.current = true;
    const seedShots = async () => {
      for (const shot of initialShots) {
        const { id: _id, sceneId: _sid, shotNumber: _sn, confirmed: _c, confirmedAt: _ca, createdAt: _cra, updatedAt: _u, ...data }: typeof shot & ShotData = shot;
        await createShot.mutateAsync({ sceneId, data });
      }
    };
    seedShots();
  }, [shots.length, isLoading, initialShots, sceneId, createShot]);

  const shotIds = displayShots.map((s) => s.id);
  const { data: hookMap = new Map<string, StoryboardPanel>() } = useStoryboardsForShots(shotIds);

  useEffect(() => {
    if (hookMap.size > 0) {
      setStoryboardMap(hookMap);
    }
  }, [hookMap]);

  const storyboards = Array.from(storyboardMap.values());
  const allGenerated = displayShots.length > 0 && storyboards.length >= displayShots.length;
  const isConfirmed = confirmationStatus?.isConfirmed ?? false;

  const handleRefinementClose = useCallback(() => {
    setSelectedStoryboard(null);
  }, []);

  const handleRefined = useCallback((panel: StoryboardPanel) => {
    setStoryboardMap((prev) => {
      const next = new Map(prev);
      next.set(panel.shotId, panel);
      return next;
    });
    setSelectedStoryboard(null);
  }, []);

  const handleGenerationComplete = useCallback(() => {
    // useGenerateStoryboards hook invalidates caches; queries refetch automatically
  }, []);

  useEffect(() => {
    if (!selectedStoryboard) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedStoryboard(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStoryboard]);

  if (displayShots.length === 0 && !isLoading) {
    return (
      <div className="storyboard-screen">
        <div className="storyboard-screen__empty-state">
          <h3>No Shots Yet</h3>
          <p>Go to the Shots tab to create your shot list first.</p>
        </div>
      </div>
    );
  }

  if (!isConfirmed) {
    return (
      <div className="storyboard-screen">
        <div className="storyboard-screen__paradigm-warning">
          <h3>Confirm Your Shot List</h3>
          <p>
            Your shot list must be confirmed before generating storyboards.
            Go to the Shots tab and click "Confirm Shot List".
          </p>
        </div>
      </div>
    );
  }

  const totalCost = storyboards.reduce((sum, sb) => sum + sb.cost, 0);

  return (
    <div className="storyboard-screen">
      {/* Stats bar */}
      <div className="storyboard-screen__stats">
        <span className="storyboard-screen__stat">
          {storyboards.length} / {displayShots.length} panels generated
        </span>
        <span className="storyboard-screen__stat">
          Total cost: ${totalCost.toFixed(3)}
        </span>
      </div>

      {/* Grid of annotated storyboard cards */}
      <div className="storyboard-grid">
        {displayShots.map((shot) => {
          const storyboard = storyboardMap.get(shot.id);
          return (
            <div
              key={shot.id}
              className={`storyboard-card${selectedStoryboard?.id === storyboard?.id ? ' storyboard-card--selected' : ''}`}
              onClick={() => storyboard && setSelectedStoryboard(storyboard)}
            >
              {/* Image panel */}
              <div className="storyboard-card__image-area">
                {storyboard ? (
                  <img
                    src={storyboard.imageUrl}
                    alt={`Shot ${shot.shotNumber}`}
                    className="storyboard-card__image"
                  />
                ) : (
                  <div className="storyboard-card__placeholder">
                    <span className="storyboard-card__placeholder-shot">Shot {shot.shotNumber}</span>
                    <span className="storyboard-card__placeholder-action">Generate</span>
                  </div>
                )}
              </div>

              {/* Annotations */}
              <div className="storyboard-card__annotations">
                {/* Scene | Frame | Time */}
                <div className="storyboard-card__row storyboard-card__row--header">
                  <div className="storyboard-card__field">
                    <span className="storyboard-card__label">Scene</span>
                    <span className="storyboard-card__value">{shot.sceneId.split('-').pop()}</span>
                  </div>
                  <div className="storyboard-card__field">
                    <span className="storyboard-card__label">Frame</span>
                    <span className="storyboard-card__value">{shot.shotNumber}</span>
                  </div>
                  <div className="storyboard-card__field">
                    <span className="storyboard-card__label">Time</span>
                    <span className="storyboard-card__value">{shot.duration}s</span>
                  </div>
                </div>

                {/* Description */}
                <div className="storyboard-card__row">
                  <div className="storyboard-card__field storyboard-card__field--full">
                    <span className="storyboard-card__label">Description</span>
                    <span className="storyboard-card__value">{shot.actionDescription}</span>
                  </div>
                </div>

                {/* Script / Camera */}
                <div className="storyboard-card__row">
                  <div className="storyboard-card__field storyboard-card__field--full">
                    <span className="storyboard-card__label">Script</span>
                    <span className="storyboard-card__value">
                      {[shot.type, shot.angle, shot.movement].filter(Boolean).join(' / ')}
                      {shot.charactersInFrame.length > 0 && ` — ${shot.charactersInFrame.join(', ')}`}
                    </span>
                  </div>
                </div>

                {/* Sound | Music */}
                <div className="storyboard-card__row storyboard-card__row--footer">
                  <div className="storyboard-card__field">
                    <span className="storyboard-card__label">Sound</span>
                    <span className="storyboard-card__value">{shot.notes || '—'}</span>
                  </div>
                  <div className="storyboard-card__field">
                    <span className="storyboard-card__label">Music</span>
                    <span className="storyboard-card__value">—</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generator — show when not all panels are generated */}
      {!allGenerated && (
        <div className="storyboard-screen__generator-section">
          <StoryboardGenerator
            sceneId={sceneId}
            onGenerationComplete={handleGenerationComplete}
          />
        </div>
      )}

      {/* Refinement overlay */}
      {selectedStoryboard && (
        <div className="storyboard-screen__refinement-overlay">
          <div
            className="storyboard-screen__refinement-backdrop"
            onClick={handleRefinementClose}
          />
          <div className="storyboard-screen__refinement-section">
            <RefinementPanel
              storyboard={selectedStoryboard}
              onClose={handleRefinementClose}
              onRefined={handleRefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
