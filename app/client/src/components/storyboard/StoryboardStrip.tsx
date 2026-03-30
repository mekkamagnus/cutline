/**
 * StoryboardStrip Component
 *
 * Horizontal scrollable filmstrip of storyboard panels.
 */
import { useRef, useState, useCallback } from 'react';
import { StoryboardPanel } from './StoryboardPanel';
import type { StoryboardPanel as StoryboardPanelType, Shot } from '@/types';

interface StoryboardStripProps {
  storyboards: StoryboardPanelType[];
  shots: Shot[];
  selectedPanelId?: string;
  onPanelSelect?: (storyboard: StoryboardPanelType) => void;
}

export function StoryboardStrip({
  storyboards,
  shots,
  selectedPanelId,
  onPanelSelect,
}: StoryboardStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Map shots to storyboards
  const storyboardMap = new Map<string, StoryboardPanelType>();
  for (const sb of storyboards) {
    storyboardMap.set(sb.shotId, sb);
  }

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!stripRef.current) return;

    const scrollAmount = 300;
    const newPosition =
      direction === 'right'
        ? scrollPosition + scrollAmount
        : Math.max(0, scrollPosition - scrollAmount);

    stripRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    });
    setScrollPosition(newPosition);
  }, [scrollPosition]);

  return (
    <div className="storyboard-strip">
      {/* Navigation arrows */}
      <button
        type="button"
        className="storyboard-strip__nav storyboard-strip__nav--left"
        onClick={() => scroll('left')}
        disabled={scrollPosition === 0}
        aria-label="Scroll left"
      >
        ‹
      </button>

      {/* Strip container */}
      <div ref={stripRef} className="storyboard-strip__container">
        {shots.map((shot) => {
          const storyboard = storyboardMap.get(shot.id);
          if (!storyboard) {
            // Placeholder for missing storyboard
            return (
              <div
                key={shot.id}
                className="storyboard-strip__placeholder"
              >
                <div className="storyboard-strip__placeholder-content">
                  <span className="storyboard-strip__placeholder-shot">Shot {shot.shotNumber}</span>
                  <span className="storyboard-strip__placeholder-status">
                    {shot.confirmed ? '✓ Confirmed' : '⏳ Pending'}
                  </span>
                  {shot.confirmed && (
                    <span className="storyboard-strip__placeholder-action">
                      Generate
                    </span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={storyboard.id} className="storyboard-strip__panel-wrapper">
              <div className="storyboard-strip__shot-label">
                Shot {shot.shotNumber}
              </div>
              <StoryboardPanel
                storyboard={storyboard}
                isSelected={storyboard.id === selectedPanelId}
                onClick={() => onPanelSelect?.(storyboard)}
              />
            </div>
          );
        })}
      </div>

      {/* Navigation arrows */}
      <button
        type="button"
        className="storyboard-strip__nav storyboard-strip__nav--right"
        onClick={() => scroll('right')}
        aria-label="Scroll right"
      >
        ›
      </button>

      {/* Summary */}
      <div className="storyboard-strip__summary">
        <span className="storyboard-strip__stat">
          {storyboards.length} / {shots.length} generated
        </span>
        <span className="storyboard-strip__stat">
          Est. Total: ${(storyboards.length * 0.002).toFixed(3)}
        </span>
      </div>
    </div>
  );
}
