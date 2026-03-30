/**
 * ConfirmationButton Component
 *
 * Button to confirm/unlock shot list with cost estimate.
 * Implements the critical paradigm gate for storyboard generation.
 */
import { useState } from 'react';
import { useConfirmShotList, useUnlockShotList, useShots } from '@/hooks';

interface ConfirmationButtonProps {
  sceneId: string;
  isConfirmed: boolean;
  onConfirm?: () => void;
  onUnlock?: () => void;
}

export function ConfirmationButton({
  sceneId,
  isConfirmed,
  onConfirm,
  onUnlock,
}: ConfirmationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: shots = [] } = useShots(sceneId);
  const confirmShotList = useConfirmShotList();
  const unlockShotList = useUnlockShotList();

  const shotCount = shots.length;
  const estimatedCost = shotCount * 0.002; // $0.002 per shot

  const handleConfirm = async () => {
    if (shotCount === 0) {
      alert('Cannot confirm an empty shot list');
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmConfirm = async () => {
    await confirmShotList.mutateAsync(sceneId);
    setIsModalOpen(false);
    onConfirm?.();
  };

  const handleUnlock = async () => {
    if (window.confirm('Unlocking will allow editing. Continue?')) {
      await unlockShotList.mutateAsync(sceneId);
      onUnlock?.();
    }
  };

  return (
    <>
      {isConfirmed ? (
        <button
          type="button"
          className="confirmation-button confirmation-button--unlock"
          onClick={handleUnlock}
          title="Unlock for editing"
        >
          🔓 Unlock for Editing
        </button>
      ) : (
        <button
          type="button"
          className="confirmation-button confirmation-button--confirm"
          onClick={handleConfirm}
          disabled={shotCount === 0}
          title={shotCount === 0 ? 'Add shots first' : 'Confirm shot list'}
        >
          🔒 Confirm Shot List
        </button>
      )}

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="confirmation-modal">
          <div className="confirmation-modal__content">
            <h3 className="confirmation-modal__title">Confirm Shot List</h3>
            <p className="confirmation-modal__text">
              You are about to confirm {shotCount} shots for storyboard generation.
            </p>
            <div className="confirmation-modal__stats">
              <div className="confirmation-modal__stat">
                <span className="confirmation-modal__stat-label">Shots</span>
                <span className="confirmation-modal__stat-value">{shotCount}</span>
              </div>
              <div className="confirmation-modal__stat">
                <span className="confirmation-modal__stat-label">Est. Cost</span>
                <span className="confirmation-modal__stat-value">${estimatedCost.toFixed(3)}</span>
              </div>
            </div>
            <p className="confirmation-modal__warning">
              ⚠️ After confirmation, you cannot edit shots without unlocking.
            </p>
            <div className="confirmation-modal__actions">
              <button
                type="button"
                className="confirmation-modal__btn confirmation-modal__btn--cancel"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirmation-modal__btn confirmation-modal__btn--confirm"
                onClick={handleConfirmConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
