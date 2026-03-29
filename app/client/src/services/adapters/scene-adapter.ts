/**
 * Scene Adapter - Domain <-> DB Type Transformations
 *
 * Handles conversions between domain types (Date objects) and
 * database types (ISO strings) for Scene entities.
 */
import type { Scene, DBScene, SceneData } from '@/types';

/**
 * Transform a database scene to a domain scene
 */
export function toDomain(dbScene: DBScene): Scene {
  return {
    id: dbScene.id,
    scriptId: dbScene.scriptId,
    heading: dbScene.heading,
    location: dbScene.location,
    interior: dbScene.interior,
    timeOfDay: dbScene.timeOfDay,
    order: dbScene.order,
    createdAt: new Date(dbScene.createdAt),
    updatedAt: new Date(dbScene.updatedAt),
  };
}

/**
 * Transform a domain scene to a database scene
 */
export function toDB(scene: Scene): DBScene {
  return {
    id: scene.id,
    scriptId: scene.scriptId,
    heading: scene.heading,
    location: scene.location,
    interior: scene.interior,
    timeOfDay: scene.timeOfDay,
    order: scene.order,
    createdAt: scene.createdAt.toISOString(),
    updatedAt: scene.updatedAt.toISOString(),
  };
}

/**
 * Create a DBScene from scene data for insertion
 */
export function createDBScene(id: string, scriptId: string, order: number, data: SceneData): DBScene {
  const now = new Date().toISOString();
  return {
    id,
    scriptId,
    heading: data.heading,
    location: data.location,
    interior: data.interior,
    timeOfDay: data.timeOfDay,
    order,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Transform an array of database scenes to domain scenes
 */
export function toDomainArray(dbScenes: DBScene[]): Scene[] {
  return dbScenes.map(toDomain);
}
