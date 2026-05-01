/**
 * ShotListStatus Component
 *
 * Displays current shot list statistics and confirmation status.
 */

interface ShotListStatusProps {
  shotCount: number;
  isConfirmed?: boolean;
  confirmedAt?: Date;
}

export function ShotListStatus({ shotCount, isConfirmed, confirmedAt }: ShotListStatusProps) {
  const estimatedCost = shotCount * 0.002;

  return (
    <div className="shot-list-status">
      <div className="shot-list-status__item">
        <span className="shot-list-status__label">Shots</span>
        <span className="shot-list-status__value">{shotCount}</span>
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
