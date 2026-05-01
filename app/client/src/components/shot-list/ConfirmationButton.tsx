/**
 * ConfirmationButton Component
 *
 * Button to confirm/unlock shot list with cost estimate.
 */

interface ConfirmationButtonProps {
  isConfirmed: boolean;
  shotCount: number;
  onConfirm: () => Promise<void>;
  onUnlock: () => Promise<void>;
  isConfirming?: boolean;
  isUnlocking?: boolean;
}

export function ConfirmationButton({
  isConfirmed,
  shotCount,
  onConfirm,
  onUnlock,
  isConfirming,
  isUnlocking,
}: ConfirmationButtonProps) {
  const estimatedCost = shotCount * 0.002;

  if (isConfirmed) {
    return (
      <button
        type="button"
        className="confirmation-button confirmation-button--unlock"
        onClick={onUnlock}
        disabled={isUnlocking}
        title="Unlock for editing"
      >
        {isUnlocking ? 'Unlocking...' : '🔓 Unlock for Editing'}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="confirmation-button confirmation-button--confirm"
      onClick={shotCount === 0 ? undefined : onConfirm}
      disabled={shotCount === 0 || isConfirming}
      title={shotCount === 0 ? 'Add shots first' : `${shotCount} shots · $${estimatedCost.toFixed(3)}`}
    >
      {isConfirming ? 'Confirming...' : `🔒 Confirm (${shotCount} shots · $${estimatedCost.toFixed(3)})`}
    </button>
  );
}
