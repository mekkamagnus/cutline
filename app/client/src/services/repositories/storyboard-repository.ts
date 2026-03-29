/**
 * Storyboard Repository - Data Access Layer for Storyboards
 *
 * Uses fp-ts facade (Option, AsyncResult) for functional error handling.
 */
import type { StoryboardPanel, DBStoryboard, StoryboardData, DBStoryboardPanelVersion } from '@/types';
import type { CutlineDB } from '../db';
import { AsyncResult, AppError } from '@/lib/fp';
import { toDomain, toDB, createDBStoryboard, toDomainArray } from '../adapters/storyboard-adapter';

export class StoryboardRepository {
  constructor(private db: CutlineDB) {}

  /**
   * Create a new storyboard
   */
  create(shotId: string, data: StoryboardData): AsyncResult<AppError, StoryboardPanel> {
    const run = async (): Promise<StoryboardPanel> => {
      const id = crypto.randomUUID();
      const dbStoryboard = createDBStoryboard(id, shotId, data);
      await this.db.storyboards.add(dbStoryboard);
      return toDomain(dbStoryboard);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to create storyboard', { shotId, data }, error)
    );
  }

  /**
   * Find a storyboard by ID
   */
  findById(id: string): AsyncResult<AppError, StoryboardPanel | null> {
    const promise = this.db.storyboards.get(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find storyboard', { id }, error)
    );
    return AsyncResult.map((dbStoryboard: DBStoryboard | undefined): StoryboardPanel | null => {
      if (!dbStoryboard) return null;
      return toDomain(dbStoryboard);
    })(asyncResult);
  }

  /**
   * Find storyboard by shot ID
   */
  findByShotId(shotId: string): AsyncResult<AppError, StoryboardPanel | null> {
    const promise = this.db.storyboards.where('shotId').equals(shotId).first();
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find storyboard by shot', { shotId }, error)
    );
    return AsyncResult.map((dbStoryboard: DBStoryboard | undefined): StoryboardPanel | null => {
      if (!dbStoryboard) return null;
      return toDomain(dbStoryboard);
    })(asyncResult);
  }

  /**
   * Find all storyboards for multiple shots
   */
  findByShotIds(shotIds: string[]): AsyncResult<AppError, StoryboardPanel[]> {
    const promise = this.db.storyboards.where('shotId').anyOf(shotIds).toArray();
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find storyboards by shots', { shotIds }, error)
    );
    return AsyncResult.map(toDomainArray)(asyncResult);
  }

  /**
   * Update a storyboard
   */
  update(id: string, data: Partial<StoryboardData>): AsyncResult<AppError, StoryboardPanel> {
    const run = async (): Promise<StoryboardPanel> => {
      const dbStoryboard = await this.db.storyboards.get(id);
      if (!dbStoryboard) {
        throw AppError.notFound(`Storyboard not found: ${id}`, { id });
      }

      const updatedStoryboard: DBStoryboard = {
        ...dbStoryboard,
        ...data,
      };

      await this.db.storyboards.put(updatedStoryboard);
      return toDomain(updatedStoryboard);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to update storyboard', { id, data }, error)
    );
  }

  /**
   * Add a new version to a storyboard (for refinement workflow)
   */
  addVersion(id: string, newVersion: StoryboardData): AsyncResult<AppError, StoryboardPanel> {
    const run = async (): Promise<StoryboardPanel> => {
      const dbStoryboard = await this.db.storyboards.get(id);
      if (!dbStoryboard) {
        throw AppError.notFound(`Storyboard not found: ${id}`, { id });
      }

      // Store current version in history
      const previousVersion: DBStoryboardPanelVersion = {
        version: dbStoryboard.version,
        imageUrl: dbStoryboard.imageUrl,
        generatedAt: dbStoryboard.generatedAt,
        refinementPrompt: dbStoryboard.refinementPrompt,
      };

      const updatedStoryboard: DBStoryboard = {
        ...dbStoryboard,
        ...newVersion,
        version: dbStoryboard.version + 1,
        previousVersions: [...dbStoryboard.previousVersions, previousVersion],
      };

      await this.db.storyboards.put(updatedStoryboard);
      return toDomain(updatedStoryboard);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to add storyboard version', { id }, error)
    );
  }

  /**
   * Delete a storyboard
   */
  delete(id: string): AsyncResult<AppError, void> {
    const promise = this.db.storyboards.delete(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to delete storyboard', { id }, error)
    );
    return AsyncResult.map(() => undefined)(asyncResult);
  }

  /**
   * Delete storyboards by shot IDs
   */
  deleteByShotIds(shotId: string): AsyncResult<AppError, void> {
    const promise = this.db.storyboards.where('shotId').equals(shotId).delete();
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to delete storyboards by shot', { shotId }, error)
    );
    return AsyncResult.map(() => undefined)(asyncResult);
  }

  /**
   * Get total cost for a project
   */
  getTotalCostByScene(sceneId: string): AsyncResult<AppError, number> {
    const run = async (): Promise<number> => {
      // Get all shots for the scene
      const shots = await this.db.shots.where('sceneId').equals(sceneId).toArray();
      const shotIds = shots.map((s) => s.id);

      // Get all storyboards for those shots
      const storyboards = await this.db.storyboards.where('shotId').anyOf(shotIds).toArray();

      return storyboards.reduce((sum, s) => sum + s.cost, 0);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to get total cost', { sceneId }, error)
    );
  }
}
