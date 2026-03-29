/**
 * Scene Repository - Data Access Layer for Scenes
 *
 * Uses fp-ts facade (Option, AsyncResult) for functional error handling.
 */
import type { Scene, DBScene, SceneData } from '@/types';
import type { CutlineDB } from '../db';
import { AsyncResult, AppError } from '@/lib/fp';
import { toDomain, toDB, createDBScene, toDomainArray } from '../adapters/scene-adapter';

export class SceneRepository {
  constructor(private db: CutlineDB) {}

  /**
   * Create a new scene
   */
  create(scriptId: string, data: SceneData): AsyncResult<AppError, Scene> {
    const run = async (): Promise<Scene> => {
      const order = await this.getNextOrder(scriptId);
      const id = crypto.randomUUID();
      const dbScene = createDBScene(id, scriptId, order, data);
      await this.db.scenes.add(dbScene);
      return toDomain(dbScene);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to create scene', { scriptId, data }, error)
    );
  }

  /**
   * Find a scene by ID
   */
  findById(id: string): AsyncResult<AppError, Scene | null> {
    const promise = this.db.scenes.get(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find scene', { id }, error)
    );
    return AsyncResult.map((dbScene: DBScene | undefined): Scene | null => {
      if (!dbScene) return null;
      return toDomain(dbScene);
    })(asyncResult);
  }

  /**
   * Find all scenes for a script
   */
  findByScriptId(scriptId: string): AsyncResult<AppError, Scene[]> {
    const promise = this.db.scenes.where('scriptId').equals(scriptId).sortBy('order');
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find scenes by script', { scriptId }, error)
    );
    return AsyncResult.map(toDomainArray)(asyncResult);
  }

  /**
   * Update a scene
   */
  update(id: string, data: Partial<SceneData>): AsyncResult<AppError, Scene> {
    const run = async (): Promise<Scene> => {
      const dbScene = await this.db.scenes.get(id);
      if (!dbScene) {
        throw AppError.notFound(`Scene not found: ${id}`, { id });
      }

      const updatedScene: DBScene = {
        ...dbScene,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await this.db.scenes.put(updatedScene);
      return toDomain(updatedScene);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to update scene', { id, data }, error)
    );
  }

  /**
   * Delete a scene
   */
  delete(id: string): AsyncResult<AppError, void> {
    const run = async (): Promise<void> => {
      await this.db.transaction('rw', this.db.scenes, this.db.shots, this.db.storyboards, async () => {
        // Delete related shots and storyboards first
        const shots = await this.db.shots.where('sceneId').equals(id).toArray();
        for (const shot of shots) {
          await this.db.storyboards.where('shotId').equals(shot.id).delete();
        }
        await this.db.shots.where('sceneId').equals(id).delete();

        // Delete the scene
        await this.db.scenes.delete(id);
      });
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to delete scene', { id }, error)
    );
  }

  /**
   * Reorder scenes
   */
  reorder(sceneOrders: Array<{ id: string; order: number }>): AsyncResult<AppError, Scene[]> {
    const run = async (): Promise<Scene[]> => {
      await this.db.transaction('rw', this.db.scenes, async () => {
        for (const { id, order } of sceneOrders) {
          const dbScene = await this.db.scenes.get(id);
          if (dbScene) {
            await this.db.scenes.update(id, {
              order,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      });

      // Get the script ID from the first scene
      if (sceneOrders.length === 0) return [];
      const firstScene = await this.db.scenes.get(sceneOrders[0].id);
      if (!firstScene) return [];

      const dbScenes = await this.db.scenes
        .where('scriptId')
        .equals(firstScene.scriptId)
        .sortBy('order');
      return toDomainArray(dbScenes);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to reorder scenes', { sceneOrders }, error)
    );
  }

  /**
   * Get the next order number for a script
   */
  private async getNextOrder(scriptId: string): Promise<number> {
    const scenes = await this.db.scenes.where('scriptId').equals(scriptId).toArray();
    if (scenes.length === 0) return 1;
    const maxOrder = Math.max(...scenes.map((s) => s.order));
    return maxOrder + 1;
  }

  /**
   * Count scenes in a script
   */
  countByScript(scriptId: string): AsyncResult<AppError, number> {
    const promise = this.db.scenes.where('scriptId').equals(scriptId).count();
    return AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to count scenes', { scriptId }, error)
    );
  }
}
