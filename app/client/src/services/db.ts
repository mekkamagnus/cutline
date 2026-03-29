/**
 * Cutline IndexedDB Database
 *
 * Dexie-based IndexedDB wrapper with proper indexing strategy.
 * Implements the schema from architecture.md lines 2062-2209.
 */
import Dexie, { type Table } from 'dexie';
import type {
  DBProject,
  DBScript,
  DBScene,
  DBShot,
  DBStoryboard,
  DBCharacter,
  DBComment,
  DBVersion,
} from '@/types';

/**
 * Cutline Database Class
 *
 * Provides IndexedDB storage with:
 * - Proper indexing for fast queries
 * - Type-safe table access
 */
export class CutlineDB extends Dexie {
  projects!: Table<DBProject, string>;
  scripts!: Table<DBScript, string>;
  scenes!: Table<DBScene, string>;
  shots!: Table<DBShot, string>;
  storyboards!: Table<DBStoryboard, string>;
  characters!: Table<DBCharacter, string>;
  comments!: Table<DBComment, string>;
  versions!: Table<DBVersion, string>;

  constructor(name = 'CutlineDB') {
    super(name);

    this.version(1).stores({
      // Projects: indexed by name and timestamps
      projects: 'id, name, createdAt, updatedAt',

      // Scripts: indexed by projectId for cascade delete
      scripts: 'id, projectId',

      // Scenes: indexed by scriptId and order for scene ordering
      scenes: 'id, scriptId, order, [scriptId+order]',

      // Shots: CRITICAL - indexed by sceneId, confirmed state, and compound for ordering
      // The confirmed index is essential for the shot-list-first paradigm
      shots: 'id, sceneId, shotNumber, confirmed, [sceneId+shotNumber]',

      // Storyboards: indexed by shotId for lookup
      storyboards: 'id, shotId',

      // Characters: indexed by projectId and compound for unique names per project
      characters: 'id, projectId, name, [projectId+name]',

      // Comments: indexed by entity type and compound for entity lookup
      comments: 'id, entityType, entityId, [entityType+entityId]',

      // Versions: indexed by projectId, entityType, and compound for timeline queries
      versions: 'id, projectId, entityType, createdAt, [projectId+createdAt]',
    });
  }
}

// Default database instance (singleton pattern)
let dbInstance: CutlineDB | null = null;

/**
 * Get the default database instance
 */
export function getDB(): CutlineDB {
  if (!dbInstance) {
    dbInstance = new CutlineDB();
  }
  return dbInstance;
}

/**
 * Reset the database instance (useful for testing)
 */
export function resetDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
