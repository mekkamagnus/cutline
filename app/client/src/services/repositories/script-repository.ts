/**
 * Script Repository - Data Access Layer for Scripts
 *
 * Uses fp-ts facade (Option, AsyncResult) for functional error handling.
 */
import type { Script, DBScript, ScriptData } from '@/types';
import type { CutlineDB } from '../db';
import { AsyncResult, AppError } from '@/lib/fp';
import { toDomain, toDB, createDBScript, toDomainArray } from '../adapters/script-adapter';

export class ScriptRepository {
  constructor(private db: CutlineDB) {}

  /**
   * Create a new script
   */
  create(projectId: string, data: ScriptData): AsyncResult<AppError, Script> {
    const run = async (): Promise<Script> => {
      const id = crypto.randomUUID();
      const dbScript = createDBScript(id, projectId, data);
      await this.db.scripts.add(dbScript);
      return toDomain(dbScript);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to create script', { projectId, data }, error)
    );
  }

  /**
   * Find a script by ID
   */
  findById(id: string): AsyncResult<AppError, Script | null> {
    const promise = this.db.scripts.get(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find script', { id }, error)
    );
    return AsyncResult.map((dbScript: DBScript | undefined): Script | null => {
      if (!dbScript) return null;
      return toDomain(dbScript);
    })(asyncResult);
  }

  /**
   * Find script by project ID
   */
  findByProjectId(projectId: string): AsyncResult<AppError, Script | null> {
    const promise = this.db.scripts.where('projectId').equals(projectId).first();
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find script by project', { projectId }, error)
    );
    return AsyncResult.map((dbScript: DBScript | undefined): Script | null => {
      if (!dbScript) return null;
      return toDomain(dbScript);
    })(asyncResult);
  }

  /**
   * Update a script
   */
  update(id: string, data: Partial<ScriptData>): AsyncResult<AppError, Script> {
    const run = async (): Promise<Script> => {
      const dbScript = await this.db.scripts.get(id);
      if (!dbScript) {
        throw AppError.notFound(`Script not found: ${id}`, { id });
      }

      const updatedScript: DBScript = {
        ...dbScript,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await this.db.scripts.put(updatedScript);
      return toDomain(updatedScript);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to update script', { id, data }, error)
    );
  }

  /**
   * Update script content
   */
  updateContent(id: string, fountainText: string): AsyncResult<AppError, Script> {
    return this.update(id, { fountainText });
  }

  /**
   * Delete a script and all related scenes
   */
  delete(id: string): AsyncResult<AppError, void> {
    const run = async (): Promise<void> => {
      await this.db.transaction('rw', this.db.scripts, this.db.scenes, this.db.shots, this.db.storyboards, async () => {
        // Get all scenes for this script
        const scenes = await this.db.scenes.where('scriptId').equals(id).toArray();

        // Delete all shots and storyboards for each scene
        for (const scene of scenes) {
          const shots = await this.db.shots.where('sceneId').equals(scene.id).toArray();
          for (const shot of shots) {
            await this.db.storyboards.where('shotId').equals(shot.id).delete();
          }
          await this.db.shots.where('sceneId').equals(scene.id).delete();
        }

        // Delete all scenes
        await this.db.scenes.where('scriptId').equals(id).delete();

        // Delete the script
        await this.db.scripts.delete(id);
      });
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to delete script', { id }, error)
    );
  }
}
