/**
 * ShotRow Component
 *
 * Individual shot row in the shot list with inline editing and move functionality.
 */
import { useState } from 'react';
import type { Shot, ShotData } from '@/types';

interface ShotRowProps {
  shot: Shot;
  isEditing: boolean;
  isConfirmed: boolean;
  isSelected: boolean;
  onEdit: () => void;
  onSave: (data: Partial<ShotData>) => void;
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
    return (
      <ShotForm
        initialData={shot}
        onSave={onSave}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <tr
      className={`shot-row ${isSelected ? 'shot-row--selected' : ''} ${isConfirmed ? 'shot-row--confirmed' : ''}`}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td className="shot-row__cell shot-row__cell--number">{shot.shotNumber}</td>
      <td className="shot-row__cell shot-row__cell--type">
        <span className={`shot-type shot-type--${shot.type}`}>{shot.type}</span>
      </td>
      <td className="shot-row__cell shot-row__cell--angle">{shot.angle}</td>
      <td className="shot-row__cell shot-row__cell--movement">{shot.movement}</td>
      <td className="shot-row__cell shot-row__cell--characters">
        {shot.charactersInFrame.length > 0 ? shot.charactersInFrame.join(', ') : '-'}
      </td>
      <td className="shot-row__cell shot-row__cell--action">{shot.actionDescription}</td>
      <td className="shot-row__cell shot-row__cell--duration">{shot.duration}s</td>
      <td className="shot-row__cell shot-row__cell--actions">
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
      </td>
    </tr>
  );
}
