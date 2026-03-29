/**
 * Version Repository - Data Access Layer for Version History
 *
 * Uses fp-ts facade (Option, AsyncResult) for functional error handling.
 * Supports undo/redo functionality.
 */
import type { Version, DBVersion, VersionData } from '@/types';
import type { CutlineDB } from '../db';
import { AsyncResult, AppError } from '@/lib/fp';
import { toDomain, toDB, createDBVersion, toDomainArray } from '../adapters/version-adapter';

export class VersionRepository {
  constructor(private db: CutlineDB) {}

  /**
   * Create a new version snapshot
   */
  create(projectId: string, data: VersionData): AsyncResult<AppError, Version> {
    const run = async (): Promise<Version> => {
      const id = crypto.randomUUID();
      const dbVersion = createDBVersion(id, projectId, data);
      await this.db.versions.add(dbVersion);
      return toDomain(dbVersion);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to create version', { projectId, data }, error)
    );
  }

  /**
   * Find a version by ID
   */
  findById(id: string): AsyncResult<AppError, Version | null> {
    const promise = this.db.versions.get(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find version', { id }, error)
    );
    return AsyncResult.map((dbVersion: DBVersion | undefined): Version | null => {
      if (!dbVersion) return null;
      return toDomain(dbVersion);
    })(asyncResult);
  }

  /**
   * Find versions for an entity (for undo history)
   */
  findByEntity(entityType: VersionData['entityType'], entityId: string): AsyncResult<AppError, Version[]> {
    const run = async (): Promise<Version[]> => {
      const dbVersions = await this.db.versions
        .where('entityType')
        .equals(entityType)
        .filter((v) => v.entityId === entityId)
        .sortBy('createdAt');
      return toDomainArray(dbVersions.reverse()); // Most recent first
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to find versions by entity', { entityType, entityId }, error)
    );
  }

  /**
   * Find recent versions for a project
   */
  findRecentByProject(projectId: string, limit = 20): AsyncResult<AppError, Version[]> {
    const run = async (): Promise<Version[]> => {
      const dbVersions = await this.db.versions
        .where('projectId')
        .equals(projectId)
        .reverse()
        .limit(limit)
        .toArray();
      return toDomainArray(dbVersions);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to find recent versions', { projectId }, error)
    );
  }

  /**
   * Get the latest version for an entity
   */
  getLatest(entityType: VersionData['entityType'], entityId: string): AsyncResult<AppError, Version | null> {
    const run = async (): Promise<Version | null> => {
      const dbVersions = await this.db.versions
        .where('entityType')
        .equals(entityType)
        .filter((v) => v.entityId === entityId)
        .toArray();

      if (dbVersions.length === 0) return null;

      // Sort by createdAt descending and take the first
      const sorted = dbVersions.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return toDomain(sorted[0]);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to get latest version', { entityType, entityId }, error)
    );
  }

  /**
   * Delete a version
   */
  delete(id: string): AsyncResult<AppError, void> {
    const promise = this.db.versions.delete(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to delete version', { id }, error)
    );
    return AsyncResult.map(() => undefined)(asyncResult);
  }

  /**
   * Delete old versions for an entity (keep only the last N)
   */
  pruneOldVersions(entityType: VersionData['entityType'], entityId: string, keepCount = 10): AsyncResult<AppError, void> {
    const run = async (): Promise<void> => {
      const versions = await this.db.versions
        .where('entityType')
        .equals(entityType)
        .filter((v) => v.entityId === entityId)
        .toArray();

      if (versions.length <= keepCount) return;

      // Sort by date, keep most recent
      const sorted = versions.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const toDelete = sorted.slice(keepCount);
      await Promise.all(toDelete.map((v) => this.db.versions.delete(v.id)));
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to prune old versions', { entityType, entityId }, error)
    );
  }

  /**
   * Count versions for a project
   */
  countByProject(projectId: string): AsyncResult<AppError, number> {
    const promise = this.db.versions.where('projectId').equals(projectId).count();
    return AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to count versions', { projectId }, error)
    );
  }
}
