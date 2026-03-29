/**
 * Shot Service
 *
 * Handles CRUD operations for shots with paradigm gate enforcement.
 * CRITICAL: Confirmed shots cannot be updated or deleted.
 *
 * Shot-List-First Paradigm:
 * - Shots are always created in unconfirmed state
 * - Update/delete operations ONLY work on unconfirmed shots
 * - Confirmation locks shots for storyboard generation
 * - Unlocking re-enables editing
 */
import { nanoid } from 'nanoid';
import { db } from '../db/connection.js';
import { nanoid } from 'nanoid';
import { db } from '../db/connection.js';
import type { DBShot, CreateShotRequest, UpdateShotRequest, ServiceResult } from '../types/index.js';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ShotService {
  // =========================================================================
  // Core CRUD Operations (Paradigm-Enforced)
  // =========================================================================

  /**
   * Create a new shot (ALWAYS unconfirmed)
   * This is the entry point for the shot-list-first workflow
   */
  static create(sceneId: string, data: CreateShotRequest): ServiceResult<DBShot> {
    // Validate scene exists
    const sceneCheck = db.query('SELECT id FROM scenes WHERE id = $sceneId');
    const scene = sceneCheck.get({ $sceneId: sceneId });
    if (!scene) {
      return { success: false, error: 'Scene not found' };
    }

    // Get next shot number atomically
    const countQuery = db.query(`
      SELECT COALESCE(MAX(shot_number), 0) + 1 as next_number
      FROM shots WHERE scene_id = $sceneId
    `);
    const result = countQuery.get({ $sceneId: sceneId }) as { next_number: number };
    const shotNumber = result.next_number;

    const id = nanoid();
    const now = new Date().toISOString();

    const insert = db.query(`
      INSERT INTO shots (
        id, scene_id, shot_number, type, angle, movement,
        characters_in_frame, action_description, duration, notes,
        confirmed, confirmed_at, created_at, updated_at, version
      ) VALUES ($id, $sceneId, $shotNumber, $type, $angle, $movement,
         $charactersInFrame, $actionDescription, $duration, $notes,
         0, NULL, $createdAt, $updatedAt, 1)
    `);

    try {
      insert.run({
        $id: id,
        $sceneId: sceneId,
        $shotNumber: shotNumber,
        $type: data.type,
        $angle: data.angle,
        $movement: data.movement,
        $charactersInFrame: JSON.stringify(data.charactersInFrame || []),
        $actionDescription: data.actionDescription,
        $duration: data.duration ?? 5,
        $notes: data.notes || null,
        $createdAt: now,
        $updatedAt: now,
      });

      const shot = this.getById(id);
      return { success: true, data: shot };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Failed to create shot: ${message}` };
    }
  }

  /**
   * Find all shots for a scene
   */
  static findByScene(sceneId: string): DBShot[] {
    const query = db.query(`
      SELECT * FROM shots
      WHERE scene_id = $sceneId
      ORDER BY shot_number ASC
    `);
    return query.all({ $sceneId: sceneId }) as DBShot[];
  }

  /**
   * Find a single shot by ID
   */
  static findById(shotId: string): DBShot | undefined {
    const query = db.query('SELECT * FROM shots WHERE id = $id');
    return query.get({ $id: shotId }) as DBShot | undefined;
  }

  /**
   * Update a shot
   * PARADIGM GATE: ONLY works if shot is NOT confirmed
   * Returns error if shot is confirmed - must unlock first
   */
  static update(shotId: string, data: UpdateShotRequest): ServiceResult<DBShot> {
    const shot = this.findById(shotId);
    if (!shot) {
      return { success: false, error: 'Shot not found' };
    }

    // PARADIGM ENFORCEMENT: Cannot update confirmed shots
    if (shot.confirmed === 1) {
      return {
        success: false,
        error: 'Cannot update confirmed shot. Unlock the shot list first.'
      };
    }

    const updates: string[] = [];
    const params: Record<string, unknown> = {
      $id: shotId,
      $updatedAt: new Date().toISOString()
    };

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

    // No updates needed - return current shot
    if (updates.length === 0) {
      return { success: true, data: shot };
    }

    updates.push('updated_at = $updatedAt');
    updates.push('version = version + 1');

    const update = db.query(`
      UPDATE shots SET ${updates.join(', ')} WHERE id = $id
    `);
    update.run(params);

    const updated = this.findById(shotId);
    return { success: true, data: updated };
  }

  /**
   * Delete a shot
   * PARADIGM GATE: ONLY works if shot is NOT confirmed
   * Returns error if shot is confirmed - must unlock first
   */
  static delete(shotId: string): ServiceResult<void> {
    const shot = this.findById(shotId);
    if (!shot) {
      return { success: false, error: 'Shot not found' };
    }

    // PARADIGM ENFORCEMENT: Cannot delete confirmed shots
    if (shot.confirmed === 1) {
      return {
        success: false,
        error: 'Cannot delete confirmed shot. Unlock the shot list first.'
      };
    }

    const deleteQuery = db.query('DELETE FROM shots WHERE id = $id');
    deleteQuery.run({ $id: shotId });

    return { success: true };
  }

  // =========================================================================
  // Query Operations
  // =========================================================================

  /**
   * Get all shots for a scene (legacy alias)
   */
  static getByScene(sceneId: string): DBShot[] {
    return this.findByScene(sceneId);
  }

  /**
   * Get a single shot by ID (legacy alias)
   */
  static getById(shotId: string): DBShot | undefined {
    return this.findById(shotId);
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
   * Get unconfirmed shots for a scene
   */
  static getUnconfirmedByScene(sceneId: string): DBShot[] {
    const query = db.query(`
      SELECT * FROM shots
      WHERE scene_id = $sceneId AND confirmed = 0
      ORDER BY shot_number ASC
    `);
    return query.all({ $sceneId: sceneId }) as DBShot[];
  }

  // =========================================================================
  // Batch Operations
  // =========================================================================

  /**
   * Reorder shots within a scene
   * PARADIGM GATE: Only allowed for unconfirmed shots
   */
  static reorder(sceneId: string, shotIds: string[]): ServiceResult<void> {
    // Check all shots are unconfirmed
    const shots = this.findByScene(sceneId);
    const confirmedShot = shots.find(s => s.confirmed === 1);
    if (confirmedShot) {
      return {
        success: false,
        error: 'Cannot reorder shots when scene has confirmed shots. Unlock first.'
      };
    }

    // Verify all shot IDs belong to this scene
    const sceneShotIds = new Set(shots.map(s => s.id));
    for (const id of shotIds) {
      if (!sceneShotIds.has(id)) {
        return { success: false, error: `Shot ${id} not found in scene` };
      }
    }

    // Update shot numbers atomically
    const update = db.query(`
      UPDATE shots
      SET shot_number = $shotNumber, updated_at = $updatedAt
      WHERE id = $id
    `);
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

  // =========================================================================
  // Paradigm State Queries
  // =========================================================================

  /**
   * Check if a shot is confirmed
   */
  static isConfirmed(shotId: string): boolean {
    const shot = this.findById(shotId);
    return shot?.confirmed === 1;
  }

  /**
   * Check if a scene has any confirmed shots
   */
  static hasConfirmedShots(sceneId: string): boolean {
    const query = db.query(`
      SELECT COUNT(*) as count FROM shots
      WHERE scene_id = $sceneId AND confirmed = 1
    `);
    const result = query.get({ $sceneId: sceneId }) as { count: number };
    return result.count > 0;
  }

  /**
   * Get confirmation statistics for a scene
   */
  static getConfirmationStats(sceneId: string): {
    total: number;
    confirmed: number;
    unconfirmed: number;
    isFullyConfirmed: boolean;
  } {
    const shots = this.findByScene(sceneId);
    const confirmed = shots.filter(s => s.confirmed === 1).length;

    return {
      total: shots.length,
      confirmed,
      unconfirmed: shots.length - confirmed,
      isFullyConfirmed: shots.length > 0 && confirmed === shots.length,
    };
  }
}
