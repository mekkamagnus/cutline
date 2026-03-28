/**
 * Shot Service
 *
 * Handles CRUD operations for shots with paradigm gate enforcement.
 * CRITICAL: Confirmed shots cannot be updated or deleted.
 */
import { nanoid } from 'nanoid';
import { db } from '../db/connection.js';
import type { DBShot, CreateShotRequest, UpdateShotRequest } from '../types/index.js';

export class ShotService {
  /**
   * Get all shots for a scene
   */
  static getByScene(sceneId: string): DBShot[] {
    const query = db.query(`
      SELECT * FROM shots
      WHERE scene_id = $sceneId
      ORDER BY shot_number ASC
    `);
    return query.all({ $sceneId: sceneId }) as DBShot[];
  }

  /**
   * Get a single shot by ID
   */
  static getById(shotId: string): DBShot | undefined {
    const query = db.query('SELECT * FROM shots WHERE id = $id');
    return query.get({ $id: shotId }) as DBShot | undefined;
  }

  /**
   * Get confirmed shots for a scene
   * Used by storyboard generation (paradigm gate)
   */
  static getConfirmedByScene(sceneId: string): DBShot[] {
    const query = db.query(`
      SELECT * FROM shots
      WHERE scene_id = $sceneId AND confirmed = 1
      ORDER BY shot_number ASC
    `);
    return query.all({ $sceneId: sceneId }) as DBShot[];
  }

  /**
   * Create a new shot (always unconfirmed)
   */
  static create(sceneId: string, data: CreateShotRequest): DBShot {
    // Get next shot number
    const countQuery = db.query('SELECT COUNT(*) as count FROM shots WHERE scene_id = $sceneId');
    const result = countQuery.get({ $sceneId: sceneId }) as { count: number } | undefined;
    const count = result?.count ?? 0;
    const shotNumber = count + 1;

    const id = nanoid();
    const now = new Date().toISOString();

    const insert = db.query(`
      INSERT INTO shots (
        id, scene_id, shot_number, type, angle, movement,
        characters_in_frame, action_description, duration, notes,
        confirmed, created_at, updated_at, version
      ) VALUES ($id, $sceneId, $shotNumber, $type, $angle, $movement,
         $charactersInFrame, $actionDescription, $duration, $notes,
         0, $createdAt, $updatedAt, 1)
    `);

    insert.run({
      $id: id,
      $sceneId: sceneId,
      $shotNumber: shotNumber,
      $type: data.type,
      $angle: data.angle,
      $movement: data.movement,
      $charactersInFrame: JSON.stringify(data.charactersInFrame),
      $actionDescription: data.actionDescription,
      $duration: data.duration,
      $notes: data.notes || null,
      $createdAt: now,
      $updatedAt: now,
    });

    return this.getById(id)!;
  }

  /**
   * Update a shot
   * PARADIGM GATE: Blocks update if shot is confirmed
   */
  static update(shotId: string, data: UpdateShotRequest): DBShot | { error: string } {
    const shot = this.getById(shotId);
    if (!shot) {
      return { error: 'Shot not found' };
    }

    // PARADIGM ENFORCEMENT: Cannot update confirmed shots
    if (shot.confirmed === 1) {
      return { error: 'Cannot update confirmed shot. Unlock the shot list first.' };
    }

    const updates: string[] = [];
    const params: Record<string, unknown> = { $id: shotId, $updatedAt: new Date().toISOString() };

    if (data.type !== undefined) {
      updates.push('type = $type');
      params.$type = data.type;
    }
    if (data.angle !== undefined) {
      updates.push('angle = $angle');
      params.$angle = data.angle;
    }
    if (data.movement !== undefined) {
      updates.push('movement = $movement');
      params.$movement = data.movement;
    }
    if (data.charactersInFrame !== undefined) {
      updates.push('characters_in_frame = $charactersInFrame');
      params.$charactersInFrame = JSON.stringify(data.charactersInFrame);
    }
    if (data.actionDescription !== undefined) {
      updates.push('action_description = $actionDescription');
      params.$actionDescription = data.actionDescription;
    }
    if (data.duration !== undefined) {
      updates.push('duration = $duration');
      params.$duration = data.duration;
    }
    if (data.notes !== undefined) {
      updates.push('notes = $notes');
      params.$notes = data.notes || null;
    }

    if (updates.length === 0) {
      return shot;
    }

    updates.push('updated_at = $updatedAt');

    const update = db.query(`
      UPDATE shots SET ${updates.join(', ')} WHERE id = $id
    `);
    update.run(params);

    return this.getById(shotId)!;
  }

  /**
   * Delete a shot
   * PARADIGM GATE: Blocks delete if shot is confirmed
   */
  static delete(shotId: string): { success: boolean } | { error: string } {
    const shot = this.getById(shotId);
    if (!shot) {
      return { error: 'Shot not found' };
    }

    // PARADIGM ENFORCEMENT: Cannot delete confirmed shots
    if (shot.confirmed === 1) {
      return { error: 'Cannot delete confirmed shot. Unlock the shot list first.' };
    }

    const deleteQuery = db.query('DELETE FROM shots WHERE id = $id');
    deleteQuery.run({ $id: shotId });

    return { success: true };
  }

  /**
   * Reorder shots within a scene
   * PARADIGM GATE: Only allowed for unconfirmed shots
   */
  static reorder(sceneId: string, shotIds: string[]): { success: boolean } | { error: string } {
    // Check all shots are unconfirmed
    const shots = this.getByScene(sceneId);
    const confirmedShot = shots.find(s => s.confirmed === 1);
    if (confirmedShot) {
      return { error: 'Cannot reorder shots when scene has confirmed shots. Unlock first.' };
    }

    // Update shot numbers
    const update = db.query('UPDATE shots SET shot_number = $shotNumber, updated_at = $updatedAt WHERE id = $id');
    const now = new Date().toISOString();

    const transaction = db.transaction(() => {
      for (let i = 0; i < shotIds.length; i++) {
        update.run({
          $shotNumber: i + 1,
          $updatedAt: now,
          $id: shotIds[i],
        });
      }
    });

    transaction();
    return { success: true };
  }
}
