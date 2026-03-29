/**
 * Project Repository - Data Access Layer for Projects
 *
 * Uses fp-ts facade (Option, AsyncResult) for functional error handling.
 */
import type { Project, DBProject, ProjectData } from '@/types';
import type { CutlineDB } from '../db';
import { AsyncResult, AppError } from '@/lib/fp';
import { toDomain, toDB, createDBProject, toDomainArray } from '../adapters/project-adapter';

export class ProjectRepository {
  constructor(private db: CutlineDB) {}

  /**
   * Create a new project
   */
  create(data: ProjectData): AsyncResult<AppError, Project> {
    const run = async (): Promise<Project> => {
      const id = crypto.randomUUID();
      const dbProject = createDBProject(id, data);
      await this.db.projects.add(dbProject);
      return toDomain(dbProject);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to create project', { data }, error)
    );
  }

  /**
   * Find a project by ID
   */
  findById(id: string): AsyncResult<AppError, Project | null> {
    const promise = this.db.projects.get(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find project', { id }, error)
    );
    return AsyncResult.map((dbProject: DBProject | undefined): Project | null => {
      if (!dbProject) return null;
      return toDomain(dbProject);
    })(asyncResult);
  }

  /**
   * Find all projects
   */
  findAll(): AsyncResult<AppError, Project[]> {
    const promise = this.db.projects.orderBy('updatedAt').reverse().toArray();
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find all projects', {}, error)
    );
    return AsyncResult.map(toDomainArray)(asyncResult);
  }

  /**
   * Update a project
   */
  update(id: string, data: Partial<ProjectData>): AsyncResult<AppError, Project> {
    const run = async (): Promise<Project> => {
      const dbProject = await this.db.projects.get(id);
      if (!dbProject) {
        throw AppError.notFound(`Project not found: ${id}`, { id });
      }

      const updatedProject: DBProject = {
        ...dbProject,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await this.db.projects.put(updatedProject);
      return toDomain(updatedProject);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to update project', { id, data }, error)
    );
  }

  /**
   * Delete a project and all related data
   */
  delete(id: string): AsyncResult<AppError, void> {
    const run = async (): Promise<void> => {
      // Delete in transaction to ensure cascade
      await this.db.transaction('rw', this.db.projects, this.db.scripts, this.db.scenes, this.db.shots, this.db.storyboards, this.db.characters, this.db.comments, this.db.versions, async () => {
        // Delete project
        await this.db.projects.delete(id);

        // Delete related scripts
        const scriptIds = await this.db.scripts.where('projectId').equals(id).primaryKeys();
        await this.db.scripts.bulkDelete(scriptIds);

        // Delete related characters
        await this.db.characters.where('projectId').equals(id).delete();

        // Delete related versions
        await this.db.versions.where('projectId').equals(id).delete();

        // Delete related comments
        const projectComments = await this.db.comments.where('entityType').equals('project').toArray();
        await Promise.all(
          projectComments
            .filter(c => c.entityId === id)
            .map(c => this.db.comments.delete(c.id))
        );
      });
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to delete project', { id }, error)
    );
  }

  /**
   * Update sync status
   */
  updateSyncStatus(id: string, status: 'synced' | 'pending' | 'conflict'): AsyncResult<AppError, Project> {
    const run = async (): Promise<Project> => {
      const dbProject = await this.db.projects.get(id);
      if (!dbProject) {
        throw AppError.notFound(`Project not found: ${id}`, { id });
      }

      const updatedProject: DBProject = {
        ...dbProject,
        syncStatus: status,
        lastSyncedAt: status === 'synced' ? new Date().toISOString() : dbProject.lastSyncedAt,
        updatedAt: new Date().toISOString(),
      };

      await this.db.projects.put(updatedProject);
      return toDomain(updatedProject);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to update sync status', { id, status }, error)
    );
  }

  /**
   * Check if a project exists
   */
  exists(id: string): AsyncResult<AppError, boolean> {
    const promise = this.db.projects.get(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to check project existence', { id }, error)
    );
    return AsyncResult.map((project) => project !== undefined)(asyncResult);
  }

  /**
   * Count all projects
   */
  count(): AsyncResult<AppError, number> {
    const promise = this.db.projects.count();
    return AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to count projects', {}, error)
    );
  }
}
