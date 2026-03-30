/**
 * ShotListEditor Component
 *
 * Main shot list editing interface with tabular view.
 * Implements the shot-list-first paradigm with confirmation workflow.
 */
import { useState, useCallback } from 'react';
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
}

export function ShotListEditor({ sceneId, onShotSelect, selectedShotId }: ShotListEditorProps) {
  const [editingShotId, setEditingShotId] = useState<string | null>(null);
  const [isAddingShot, setIsAddingShot] = useState(false);

  // Hooks
  const { data: shots = [], isLoading } = useShots(sceneId);
  const { data: confirmationStatus } = useShotListConfirmationStatus(sceneId);
  const createShot = useCreateShot();
  const updateShot = useUpdateShot();
  const deleteShot = useDeleteShot();
  const confirmShotList = useConfirmShotList();
  const unlockShotList = useUnlockShotList();

  const isConfirmed = confirmationStatus?.isConfirmed ?? false;

  // Handlers
  const handleAddShot = useCallback(
    async (data: ShotData) => {
      await createShot.mutateAsync({ sceneId, data });
      setIsAddingShot(false);
    },
    [createShot, sceneId]
  );

  const handleUpdateShot = useCallback(
    async (shotId: string, data: Partial<ShotData>) => {
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
    if (shots.length === 0) {
      alert('Cannot confirm an empty shot list');
      return;
    }

    const totalCost = shots.length * 0.002; // $0.002 per shot
    const confirmed = window.confirm(
      `Confirm shot list?\n\n${shots.length} shots will generate approximately $${totalCost.toFixed(3)} in AI generation costs.\n\nAfter confirmation, you cannot edit shots until you unlock.`
    );

    if (confirmed) {
      await confirmShotList.mutateAsync(sceneId);
    }
  }, [confirmShotList, sceneId, shots.length]);

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
      const currentIndex = shots.findIndex((s) => s.id === shotId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= shots.length) return;

      // Create new order
      const newShots = [...shots];
      [newShots[currentIndex], newShots[newIndex]] = [newShots[newIndex], newShots[currentIndex]];

      // Update shot numbers
      // Note: This would require a reorder mutation - for now just visual reorder
      // In full implementation, we'd call a reorder API here
    },
    [shots]
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
          shotCount={shots.length}
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
          shotCount={shots.length}
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
          shotNumber={shots.length + 1}
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
        {shots.length === 0 && !isAddingShot ? (
          <div className="shot-list-editor__empty">
            <p>No shots yet. Add your first shot to get started.</p>
          </div>
        ) : (
          shots.map((shot) => (
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
              canMoveUp={shots[0]?.id !== shot.id}
              canMoveDown={shots[shots.length - 1]?.id !== shot.id}
            />
          ))
        )}
      </div>

      {/* Summary */}
      {shots.length > 0 && (
        <div className="shot-list-editor__summary">
          <span className="shot-list-editor__stat">
            Total Duration: {shots.reduce((sum, s) => sum + s.duration, 0)}s
          </span>
          <span className="shot-list-editor__stat">
            Est. Cost: ${(shots.length * 0.002).toFixed(3)}
          </span>
        </div>
      )}
    </div>
  );
}
