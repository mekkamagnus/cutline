/**
 * ShotListEditor Component
 *
 * Main shot list editing interface with tabular view.
 * Implements the shot-list-first paradigm with confirmation workflow.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { ShotRow } from './ShotRow';
import { ShotForm } from './ShotForm';
import { ConfirmationButton } from './ConfirmationButton';
import { ShotListStatus } from './ShotListStatus';
import { useShots, useCreateShot, useUpdateShot, useDeleteShot, useConfirmShotList, useUnlockShotList, useShotListConfirmationStatus } from '@/hooks';
import type { Shot, ShotData } from '@/types';

interface ShotListEditorProps {
  sceneId: string;
  onShotSelect?: (shot: Shot) => void;
  selectedShotId?: string;
  initialShots?: Shot[];
}

export function ShotListEditor({ sceneId, onShotSelect, selectedShotId, initialShots }: ShotListEditorProps) {
  const [editingShotId, setEditingShotId] = useState<string | null>(null);
  const [isAddingShot, setIsAddingShot] = useState(false);
  const hasSeeded = useRef(false);

  // Hooks
  const { data: shots = [], isLoading } = useShots(sceneId);
  const { data: confirmationStatus } = useShotListConfirmationStatus(sceneId);
  const createShot = useCreateShot();
  const updateShot = useUpdateShot();
  const deleteShot = useDeleteShot();
  const confirmShotList = useConfirmShotList();
  const unlockShotList = useUnlockShotList();

  const isConfirmed = confirmationStatus?.isConfirmed ?? false;
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

  // Handlers
  const handleAddShot = useCallback(
    async (data: ShotData) => {
      await createShot.mutateAsync({ sceneId, data });
      setIsAddingShot(false);
    },
    [createShot, sceneId]
  );

  const handleUpdateShot = useCallback(
    async (shotId: string, data: ShotData) => {
      await updateShot.mutateAsync({ id: shotId, data });
      setEditingShotId(null);
    },
    [updateShot]
  );

  const handleDeleteShot = useCallback(
    async (shotId: string) => {
      if (window.confirm('Are you sure you want to delete this shot?')) {
        await deleteShot.mutateAsync({ id: shotId, sceneId });
      }
    },
    [deleteShot, sceneId]
  );

  const handleConfirmShotList = useCallback(async () => {
    if (displayShots.length === 0) {
      alert('Cannot confirm an empty shot list');
      return;
    }

    const totalCost = displayShots.length * 0.002;
    const confirmed = window.confirm(
      `Confirm shot list?\n\n${displayShots.length} shots will generate approximately $${totalCost.toFixed(3)} in AI generation costs.\n\nAfter confirmation, you cannot edit shots until you unlock.`
    );

    if (confirmed) {
      await confirmShotList.mutateAsync(sceneId);
    }
  }, [confirmShotList, sceneId, displayShots.length]);

  const handleUnlockShotList = useCallback(async () => {
    const confirmed = window.confirm(
      'Unlock shot list for editing?\n\nThis will allow you to edit shots, but storyboards may become outdated.'
    );

    if (confirmed) {
      await unlockShotList.mutateAsync(sceneId);
    }
  }, [unlockShotList, sceneId]);

  const handleMoveShot = useCallback(
    async (shotId: string, direction: 'up' | 'down') => {
      const currentIndex = displayShots.findIndex((s) => s.id === shotId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= displayShots.length) return;

      const newShots = [...displayShots];
      const temp = newShots[currentIndex];
      const swapTarget = newShots[newIndex];
      if (temp && swapTarget) {
        newShots[currentIndex] = swapTarget;
        newShots[newIndex] = temp;
      }
    },
    [displayShots]
  );

  if (isLoading) {
    return (
      <div className="shot-list-editor shot-list-editor--loading">
        <p>Loading shots...</p>
      </div>
    );
  }

  return (
    <div className="shot-list-editor">
      {/* Header */}
      <div className="shot-list-editor__header">
        <h2 className="shot-list-editor__title">Shot List</h2>
        <ShotListStatus
          shotCount={displayShots.length}
          isConfirmed={isConfirmed}
          confirmedAt={confirmationStatus?.confirmedAt}
        />
      </div>

      {/* Toolbar */}
      <div className="shot-list-editor__toolbar">
        {!isConfirmed && (
          <button
            type="button"
            className="shot-list-editor__button shot-list-editor__button--add"
            onClick={() => setIsAddingShot(true)}
            disabled={isAddingShot}
          >
            + Add Shot
          </button>
        )}

        <ConfirmationButton
          isConfirmed={isConfirmed}
          shotCount={displayShots.length}
          onConfirm={handleConfirmShotList}
          onUnlock={handleUnlockShotList}
          isConfirming={confirmShotList.isPending}
          isUnlocking={unlockShotList.isPending}
        />
      </div>

      {/* Add shot form */}
      {isAddingShot && !isConfirmed && (
        <ShotForm
          onSave={handleAddShot}
          onCancel={() => setIsAddingShot(false)}
          shotNumber={displayShots.length + 1}
          isCreating
        />
      )}

      {/* Shot list table */}
      <div className="shot-list-editor__table">
        {/* Header row */}
        <div className="shot-list-editor__row shot-list-editor__row--header">
          <div className="shot-list-editor__cell shot-list-editor__cell--number">#</div>
          <div className="shot-list-editor__cell shot-list-editor__cell--type">Type</div>
          <div className="shot-list-editor__cell shot-list-editor__cell--angle">Angle</div>
          <div className="shot-list-editor__cell shot-list-editor__cell--movement">Movement</div>
          <div className="shot-list-editor__cell shot-list-editor__cell--characters">Characters</div>
          <div className="shot-list-editor__cell shot-list-editor__cell--action">Action</div>
          <div className="shot-list-editor__cell shot-list-editor__cell--duration">Duration</div>
          <div className="shot-list-editor__cell shot-list-editor__cell--actions">Actions</div>
        </div>

        {/* Shot rows */}
        {displayShots.length === 0 && !isAddingShot ? (
          <div className="shot-list-editor__empty">
            <p>No shots yet. Add your first shot to get started.</p>
          </div>
        ) : (
          displayShots.map((shot) => (
            <ShotRow
              key={shot.id}
              shot={shot}
              isEditing={editingShotId === shot.id}
              isConfirmed={isConfirmed}
              isSelected={shot.id === selectedShotId}
              onEdit={() => setEditingShotId(shot.id)}
              onSave={(data) => handleUpdateShot(shot.id, data)}
              onDelete={() => handleDeleteShot(shot.id)}
              onSelect={() => onShotSelect?.(shot)}
              onCancelEdit={() => setEditingShotId(null)}
              onMoveUp={() => handleMoveShot(shot.id, 'up')}
              onMoveDown={() => handleMoveShot(shot.id, 'down')}
              canMoveUp={displayShots[0]?.id !== shot.id}
              canMoveDown={displayShots[displayShots.length - 1]?.id !== shot.id}
            />
          ))
        )}
      </div>

      {/* Summary */}
      {displayShots.length > 0 && (
        <div className="shot-list-editor__summary">
          <span className="shot-list-editor__stat">
            Total Duration: {displayShots.reduce((sum, s) => sum + s.duration, 0)}s
          </span>
          <span className="shot-list-editor__stat">
            Est. Cost: ${(displayShots.length * 0.002).toFixed(3)}
          </span>
        </div>
      )}
    </div>
  );
}
