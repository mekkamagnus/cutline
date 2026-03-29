/**
 * Shot Adapter - Domain <-> DB Type Transformations
 *
 * Handles conversions between domain types (Date objects) and
 * database types (ISO strings) for Shot entities.
 */
import type { Shot, DBShot, ShotData } from '@/types';

/**
 * Transform a database shot to a domain shot
 */
export function toDomain(dbShot: DBShot): Shot {
  return {
    id: dbShot.id,
    sceneId: dbShot.sceneId,
    shotNumber: dbShot.shotNumber,
    type: dbShot.type,
    angle: dbShot.angle,
    movement: dbShot.movement,
    charactersInFrame: dbShot.charactersInFrame,
    actionDescription: dbShot.actionDescription,
    duration: dbShot.duration,
    notes: dbShot.notes,
    confirmed: dbShot.confirmed,
    confirmedAt: dbShot.confirmedAt ? new Date(dbShot.confirmedAt) : undefined,
    createdAt: new Date(dbShot.createdAt),
    updatedAt: new Date(dbShot.updatedAt),
  };
}

/**
 * Transform a domain shot to a database shot
 */
export function toDB(shot: Shot): DBShot {
  return {
    id: shot.id,
    sceneId: shot.sceneId,
    shotNumber: shot.shotNumber,
    type: shot.type,
    angle: shot.angle,
    movement: shot.movement,
    charactersInFrame: shot.charactersInFrame,
    actionDescription: shot.actionDescription,
    duration: shot.duration,
    notes: shot.notes,
    confirmed: shot.confirmed,
    confirmedAt: shot.confirmedAt?.toISOString(),
    createdAt: shot.createdAt.toISOString(),
    updatedAt: shot.updatedAt.toISOString(),
  };
}

/**
 * Create a DBShot from shot data for insertion
 */
export function createDBShot(
  id: string,
  sceneId: string,
  shotNumber: number,
  data: ShotData
): DBShot {
  const now = new Date().toISOString();
  return {
    id,
    sceneId,
    shotNumber,
    type: data.type,
    angle: data.angle,
    movement: data.movement,
    charactersInFrame: data.charactersInFrame,
    actionDescription: data.actionDescription,
    duration: data.duration,
    notes: data.notes,
    confirmed: false, // CRITICAL: Always unconfirmed on creation
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Transform an array of database shots to domain shots
 */
export function toDomainArray(dbShots: DBShot[]): Shot[] {
  return dbShots.map(toDomain);
}
