/**
 * Confirmation Service - Shot List Confirmation Operations
 *
 * Implements the shot-list-first paradigm confirmation workflow:
 * - confirmShotList: Locks all shots for storyboard generation
 * - unlockShotList: Unlocks shots for editing
 *
 * CRITICAL: Confirmed shot lists are immutable for storyboard consistency.
 */
import type { Shot } from '@/types';
import type { ShotRepository } from './repositories/shot-repository';
import type { ShotService } from './shot-service';
import { AsyncResult, AppError } from '@/lib/fp';

/**
 * Confirmation Service
 *
 * Manages shot list confirmation state for the shot-list-first paradigm.
 */
export class ConfirmationService {
  constructor(
    private repository: ShotRepository,
    private shotService: ShotService
  ) {}

  /**
   * Confirm all shots in a scene
   *
   * Validates:
   * - Shots must exist
   * - Scene must have at least one shot
   *
   * On success:
   * - Sets confirmed=true for all shots
   * - Sets confirmedAt timestamp
   */
  confirmShotList(sceneId: string): AsyncResult<AppError, Shot[]> {
    const findBySceneResult = this.repository.findByScene(sceneId);
    return AsyncResult.andThen((shots: Shot[]) => {
      // Validate shots exist
      if (shots.length === 0) {
        return AsyncResult.err(
          AppError.validation('Cannot confirm empty shot list. Add at least one shot first.', {
            sceneId,
            shotCount: 0,
          })
        );
      }

      return this.repository.confirmAll(sceneId);
    })(findBySceneResult);
  }

  /**
   * Unlock all shots in a scene
   *
   * Resets confirmation state to allow editing:
   * - Sets confirmed=false for all shots
   * - Clears confirmedAt timestamp
   */
  unlockShotList(sceneId: string): AsyncResult<AppError, void> {
    return this.repository.unlockAll(sceneId);
  }

  /**
   * Check if a scene has a confirmed shot list
   */
  isConfirmed(sceneId: string): AsyncResult<AppError, boolean> {
    const result = this.repository.findConfirmedByScene(sceneId);
    return AsyncResult.map((shots: Shot[]) => shots.length > 0)(result);
  }

  /**
   * Get confirmation status for a scene
   */
  getConfirmationStatus(
    sceneId: string
  ): AsyncResult<AppError, { totalShots: number; confirmedShots: number; isFullyConfirmed: boolean }> {
    const allShotsResult = this.repository.findByScene(sceneId);
    const confirmedShotsResult = this.repository.findConfirmedByScene(sceneId);
    const combined = AsyncResult.all([allShotsResult, confirmedShotsResult]);
    return AsyncResult.map(([allShots, confirmedShots]: [Shot[], Shot[]]) => ({
      totalShots: allShots.length,
      confirmedShots: confirmedShots.length,
      isFullyConfirmed: allShots.length > 0 && allShots.length === confirmedShots.length,
    }))(combined);
  }
}
