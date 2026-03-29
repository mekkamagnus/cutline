/**
 * Shot Service - Domain Service for Shot Operations
 *
 * Enforces business rules for the shot-list-first paradigm:
 * - Creates shots in unconfirmed state
 * - BLOCKS updates/deletes on confirmed shots
 */
import type { Shot, ShotData } from '@/types';
import type { ShotRepository } from './repositories/shot-repository';
import { AsyncResult, AppError, Result } from '@/lib/fp';

/**
 * Shot Service
 *
 * Domain service that enforces business rules for shot operations.
 * Uses the repository for data access while enforcing paradigm constraints.
 */
export class ShotService {
  constructor(private repository: ShotRepository) {}

  /**
   * Create a new shot
   *
   * Shots are always created in unconfirmed state.
   */
  createShot(sceneId: string, data: ShotData): AsyncResult<AppError, Shot> {
    return this.repository.create(sceneId, data);
  }

  /**
   * Get a shot by ID
   */
  getShot(id: string): AsyncResult<AppError, Shot | null> {
    return this.repository.findById(id);
  }

  /**
   * Get all shots for a scene
   */
  getShotsByScene(sceneId: string): AsyncResult<AppError, Shot[]> {
    return this.repository.findByScene(sceneId);
  }

  /**
   * Update a shot
   *
   * PARADIGM GATE: Blocks if shot is confirmed.
   */
  updateShot(id: string, data: Partial<ShotData>): AsyncResult<AppError, Shot> {
    const findResult = this.repository.findById(id);
    return AsyncResult.andThen((shot: Shot | null) => {
      if (!shot) {
        return AsyncResult.err(AppError.notFound(`Shot not found: ${id}`, { id }));
      }
      if (shot.confirmed) {
        return AsyncResult.err(
          AppError.validation('Cannot update confirmed shot. Unlock the shot list first.', {
            shotId: id,
            confirmed: true,
          })
        );
      }
      return this.repository.update(id, data);
    })(findResult);
  }

  /**
   * Delete a shot
   *
   * PARADIGM GATE: Blocks if shot is confirmed.
   */
  deleteShot(id: string): AsyncResult<AppError, void> {
    const findResult = this.repository.findById(id);
    return AsyncResult.andThen((shot: Shot | null) => {
      if (!shot) {
        return AsyncResult.err(AppError.notFound(`Shot not found: ${id}`, { id }));
      }
      if (shot.confirmed) {
        return AsyncResult.err(
          AppError.validation('Cannot delete confirmed shot. Unlock the shot list first.', {
            shotId: id,
            confirmed: true,
          })
        );
      }
      return this.repository.delete(id);
    })(findResult);
  }

  /**
   * Get confirmed shots for a scene
   */
  getConfirmedShots(sceneId: string): AsyncResult<AppError, Shot[]> {
    return this.repository.findConfirmedByScene(sceneId);
  }

  /**
   * Check if a shot is confirmed
   */
  isConfirmed(id: string): AsyncResult<AppError, boolean> {
    const result = this.repository.findById(id);
    return AsyncResult.map((shot: Shot | null): boolean => shot?.confirmed ?? false)(result);
  }

  /**
   * Count shots in a scene
   */
  countShots(sceneId: string): AsyncResult<AppError, number> {
    return this.repository.countByScene(sceneId);
  }

  /**
   * Confirm all shots in a scene
   */
  confirmAll(sceneId: string): AsyncResult<AppError, Shot[]> {
    const findBySceneResult = this.repository.findByScene(sceneId);
    return AsyncResult.andThen((shots: Shot[]) => {
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
   */
  unlockAll(sceneId: string): AsyncResult<AppError, void> {
    return this.repository.unlockAll(sceneId);
  }
}
