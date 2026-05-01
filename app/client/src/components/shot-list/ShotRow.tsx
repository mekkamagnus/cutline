/**
 * ShotRow Component
 *
 * Individual shot row in the shot list with inline editing and move functionality.
 */
import { useState } from 'react';
import { ShotForm } from './ShotForm';
import type { Shot, ShotData } from '@/types';

interface ShotRowProps {
  shot: Shot;
  isEditing: boolean;
  isConfirmed: boolean;
  isSelected: boolean;
  onEdit: () => void;
  onSave: (data: ShotData) => void;
  onDelete: () => void;
  onSelect: () => void;
  onCancelEdit: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function ShotRow({
  shot,
  isEditing,
  isConfirmed,
  isSelected,
  onEdit,
  onSave,
  onDelete,
  onSelect,
  onCancelEdit,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: ShotRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isEditing) {
    return <ShotForm initialData={shot} onSave={onSave} onCancel={onCancelEdit} />;
  }

  return (
    <div
      className={`shot-list-editor__row ${isSelected ? 'shot-row--selected' : ''} ${isConfirmed ? 'shot-row--confirmed' : ''}`}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="shot-list-editor__cell shot-list-editor__cell--number">{shot.shotNumber}</div>
      <div className="shot-list-editor__cell shot-list-editor__cell--type">
        <span className={`shot-type shot-type--${shot.type}`}>{shot.type}</span>
      </div>
      <div className="shot-list-editor__cell shot-list-editor__cell--angle">{shot.angle}</div>
      <div className="shot-list-editor__cell shot-list-editor__cell--movement">{shot.movement}</div>
      <div className="shot-list-editor__cell shot-list-editor__cell--characters">
        {shot.charactersInFrame.length > 0 ? shot.charactersInFrame.join(', ') : '-'}
      </div>
      <div className="shot-list-editor__cell shot-list-editor__cell--action">{shot.actionDescription}</div>
      <div className="shot-list-editor__cell shot-list-editor__cell--duration">{shot.duration}s</div>
      <div className="shot-list-editor__cell shot-list-editor__cell--actions">
        {!isConfirmed && (
          <div className="shot-row__actions">
            <button
              type="button"
              className="shot-row__action-btn"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              title="Edit shot"
            >
              ✏️
            </button>
            <button
              type="button"
              className="shot-row__action-btn shot-row__action-btn--delete"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Delete shot"
            >
              🗑️
            </button>
            {isHovered && (
              <>
                {canMoveUp && (
                  <button
                    type="button"
                    className="shot-row__action-btn"
                    onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
                    title="Move up"
                  >
                    ↑
                  </button>
                )}
                {canMoveDown && (
                  <button
                    type="button"
                    className="shot-row__action-btn"
                    onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
                    title="Move down"
                  >
                    ↓
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
