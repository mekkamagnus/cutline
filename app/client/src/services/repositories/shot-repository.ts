/**
 * Shot Repository - Data Access Layer for Shots
 *
 * Uses fp-ts facade (Option, AsyncResult) for functional error handling.
 * All operations return AsyncResult for composable async operations.
 */
import type { Shot, DBShot, ShotData } from '@/types';
import type { CutlineDB } from '../db';
import { AsyncResult, AppError } from '@/lib/fp';
import { toDomain, toDB, createDBShot, toDomainArray } from '../adapters/shot-adapter';

/**
 * Shot Repository
 *
 * Provides data access operations for Shot entities with functional error handling.
 */
export class ShotRepository {
  constructor(private db: CutlineDB) {}

  /**
   * Create a new shot
   */
  create(sceneId: string, data: ShotData): AsyncResult<AppError, Shot> {
    const run = async (): Promise<Shot> => {
      const shotNumber = await this.getNextShotNumber(sceneId);
      const id = crypto.randomUUID();
      const dbShot = createDBShot(id, sceneId, shotNumber, data);
      await this.db.shots.add(dbShot);
      return toDomain(dbShot);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to create shot', { sceneId, data }, error)
    );
  }

  /**
   * Find a shot by ID
   */
  findById(id: string): AsyncResult<AppError, Shot | null> {
    const promise = this.db.shots.get(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find shot', { id }, error)
    );
    return AsyncResult.map((dbShot: DBShot | undefined): Shot | null => {
      if (!dbShot) return null;
      return toDomain(dbShot);
    })(asyncResult);
  }

  /**
   * Find all shots for a scene
   */
  findByScene(sceneId: string): AsyncResult<AppError, Shot[]> {
    const promise = this.db.shots.where('sceneId').equals(sceneId).sortBy('shotNumber');
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find shots by scene', { sceneId }, error)
    );
    return AsyncResult.map(toDomainArray)(asyncResult);
  }

  /**
   * Find only confirmed shots for a scene
   */
  findConfirmedByScene(sceneId: string): AsyncResult<AppError, Shot[]> {
    const promise = this.db.shots
      .where('sceneId')
      .equals(sceneId)
      .filter((shot) => shot.confirmed === true)
      .sortBy('shotNumber');
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find confirmed shots', { sceneId }, error)
    );
    return AsyncResult.map(toDomainArray)(asyncResult);
  }

  /**
   * Update a shot
   */
  update(id: string, data: Partial<ShotData>): AsyncResult<AppError, Shot> {
    const run = async (): Promise<Shot> => {
      const dbShot = await this.db.shots.get(id);
      if (!dbShot) {
        throw AppError.notFound(`Shot not found: ${id}`, { id });
      }

      const updatedShot: DBShot = {
        ...dbShot,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await this.db.shots.put(updatedShot);
      return toDomain(updatedShot);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to update shot', { id, data }, error)
    );
  }

  /**
   * Update shot directly (internal use - bypasses business rules)
   */
  updateDirect(id: string, updates: Partial<DBShot>): AsyncResult<AppError, Shot> {
    const run = async (): Promise<Shot> => {
      const dbShot = await this.db.shots.get(id);
      if (!dbShot) {
        throw AppError.notFound(`Shot not found: ${id}`, { id });
      }

      const updatedShot: DBShot = {
        ...dbShot,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.db.shots.put(updatedShot);
      return toDomain(updatedShot);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to directly update shot', { id }, error)
    );
  }

  /**
   * Delete a shot
   */
  delete(id: string): AsyncResult<AppError, void> {
    const promise = this.db.shots.delete(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to delete shot', { id }, error)
    );
    return AsyncResult.map(() => undefined)(asyncResult);
  }

  /**
   * Confirm all shots in a scene
   */
  confirmAll(sceneId: string): AsyncResult<AppError, Shot[]> {
    const run = async (): Promise<Shot[]> => {
      const now = new Date().toISOString();
      await this.db.shots
        .where('sceneId')
        .equals(sceneId)
        .modify({
          confirmed: true,
          confirmedAt: now,
          updatedAt: now,
        });
      const dbShots = await this.db.shots
        .where('sceneId')
        .equals(sceneId)
        .sortBy('shotNumber');
      return toDomainArray(dbShots);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to confirm shots', { sceneId }, error)
    );
  }

  /**
   * Unlock all shots in a scene
   */
  unlockAll(sceneId: string): AsyncResult<AppError, void> {
    const run = async (): Promise<void> => {
      const now = new Date().toISOString();
      await this.db.shots
        .where('sceneId')
        .equals(sceneId)
        .modify({
          confirmed: false,
          confirmedAt: undefined,
          updatedAt: now,
        });
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to unlock shots', { sceneId }, error)
    );
  }

  /**
   * Get the next shot number for a scene
   */
  private async getNextShotNumber(sceneId: string): Promise<number> {
    const shots = await this.db.shots.where('sceneId').equals(sceneId).toArray();
    if (shots.length === 0) return 1;
    const maxNumber = Math.max(...shots.map((s) => s.shotNumber));
    return maxNumber + 1;
  }

  /**
   * Check if a shot exists
   */
  exists(id: string): AsyncResult<AppError, boolean> {
    const promise = this.db.shots.get(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to check shot existence', { id }, error)
    );
    return AsyncResult.map((shot) => shot !== undefined)(asyncResult);
  }

  /**
   * Count shots in a scene
   */
  countByScene(sceneId: string): AsyncResult<AppError, number> {
    const promise = this.db.shots.where('sceneId').equals(sceneId).count();
    return AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to count shots', { sceneId }, error)
    );
  }
}
