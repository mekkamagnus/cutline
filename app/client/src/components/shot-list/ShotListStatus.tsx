/**
 * ShotListStatus Component
 *
 * Displays current shot list statistics and confirmation status.
 */
import { useShots, useShotListConfirmationStatus } from '@/hooks';

interface ShotListStatusProps {
  sceneId: string;
  shotCount?: number;
}

export function ShotListStatus({ sceneId, shotCount: propShotCount }: ShotListStatusProps) {
  const { data: shots = [] } = useShots(sceneId);
  const { data: confirmationStatus } = useShotListConfirmationStatus(sceneId);

  const shotCount = propShotCount ?? shots.length;
  const isConfirmed = confirmationStatus?.isConfirmed ?? false;
  const confirmedAt = confirmationStatus?.confirmedAt;

  const totalDuration = shots.reduce((sum, shot) => sum + shot.duration, 0);
  const estimatedCost = shotCount * 0.002;

  return (
    <div className="shot-list-status">
      <div className="shot-list-status__item">
        <span className="shot-list-status__label">Shots</span>
        <span className="shot-list-status__value">{shotCount}</span>
      </div>

      <div className="shot-list-status__item">
        <span className="shot-list-status__label">Total Duration</span>
        <span className="shot-list-status__value">{totalDuration}s</span>
      </div>

      <div className="shot-list-status__item">
        <span className="shot-list-status__label">Est. Cost</span>
        <span className="shot-list-status__value">${estimatedCost.toFixed(3)}</span>
      </div>

      <div className="shot-list-status__item">
        <span className="shot-list-status__label">Status</span>
        <span
          className={`shot-list-status__value shot-list-status__status ${
            isConfirmed ? 'shot-list-status__status--confirmed' : 'shot-list-status__status--draft'
          }`}
        >
          {isConfirmed ? '🔒 Confirmed' : '📝 Draft'}
        </span>
      </div>

      {isConfirmed && confirmedAt && (
        <div className="shot-list-status__item shot-list-status__item--timestamp">
          <span className="shot-list-status__label">Confirmed at</span>
          <span className="shot-list-status__value">
            {confirmedAt.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
