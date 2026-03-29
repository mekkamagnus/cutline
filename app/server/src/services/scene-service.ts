/**
 * Scene Service
 *
 * Handles CRUD operations for scenes.
 */
import { nanoid } from 'nanoid';
import { db } from '../db/connection.js';
import type { DBScene } from '../types/index.js';
import { ServiceResult } from '../types/index.js';

export class SceneService {
  /**
   * Find all scenes for a script
   */
  static findByScript(scriptId: string): DBScene[] {
    const query = db.query(`
      SELECT * FROM scenes
      WHERE script_id = $scriptId
      ORDER BY scene_order ASC
    `);
    return query.all({ $scriptId: scriptId }) as DBScene[];
  }

  /**
   * Find a scene by ID
   */
  static findById(sceneId: string): DBScene | undefined {
    const query = db.query('SELECT * FROM scenes WHERE id = $id');
    return query.get({ $id: sceneId }) as DBScene | undefined;
  }

  /**
   * Create a new scene
   */
  static create(scriptId: string, data: {
    heading: string;
    location: string;
    interior: boolean;
    timeOfDay: string;
    sceneOrder: number;
    metadata?: Record<string, unknown>;
  }): ServiceResult<DBScene> {
    const id = nanoid();
    const now = new Date().toISOString();

    const insert = db.query(`
      INSERT INTO scenes (
        id, script_id, heading, location, interior, time_of_day, scene_order, metadata
      ) VALUES ($id, $scriptId, $heading, $location, $interior, $timeOfDay, $sceneOrder, $metadata, $createdAt)
    `);

    try {
      insert.run({
        $id: id,
        $scriptId: scriptId,
        $heading: data.heading,
        $location: data.location,
        $interior: data.interior ? 1 : 0,
        $timeOfDay: data.timeOfDay,
        $sceneOrder: data.sceneOrder,
        $metadata: JSON.stringify(data.metadata || {}),
        $createdAt: now,
      });

      const scene = this.findById(id);
      return { success: true, data: scene };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Failed to create scene: ${message}` };
    }
  }

  /**
   * Update a scene
   */
  static update(sceneId: string, data: Partial<{
    heading?: string;
    location?: string;
    interior?: boolean;
    timeOfDay?: string;
  }>): ServiceResult<DBScene> {
    const scene = this.findById(sceneId);
    if (!scene) {
      return { success: false, error: 'Scene not found' };
    }

    const updates: string[] = [];
    const params: Record<string, unknown> = {
      $id: sceneId,
      $updatedAt: new Date().toISOString(),
    };

    if (data.heading !== undefined) {
      updates.push('heading = $heading');
      params.$heading = data.heading;
    }
    if (data.location !== undefined) {
      updates.push('location = $location');
      params.$location = data.location;
    }
    if (data.interior !== undefined) {
      updates.push('interior = $interior');
      params.$interior = data.interior ? 1 : 0;
    }
    if (data.timeOfDay !== undefined) {
      updates.push('time_of_day = $timeOfDay');
      params.$timeOfDay = data.timeOfDay;
    }

    if (updates.length === 0) {
      return { success: true, data: scene };
    }

    updates.push('updated_at = $updatedAt');

    const update = db.query(`
      UPDATE scenes SET ${updates.join(', ')} WHERE id = $id
    `);
    update.run(params);

    const updated = this.findById(sceneId);
    return { success: true, data: updated };
  }

  /**
   * Delete a scene
   * Cascades to all shots in the scene
   */
  static delete(sceneId: string): ServiceResult<void> {
    const scene = this.findById(sceneId);
    if (!scene) {
      return { success: false, error: 'Scene not found' };
    }

    // Delete scene and cascade to shots
    const deleteQuery = db.query('DELETE FROM scenes WHERE id = $id');
    deleteQuery.run({ $id: sceneId });

    return { success: true };
  }

  /**
   * Reorder scenes within a script
   */
  static reorder(scriptId: string, sceneIds: string[]): ServiceResult<void> {
    // Verify all scene IDs belong to this script
    const scenes = this.findByScript(scriptId);
    const sceneIdSet = new Set(scenes.map(s => s.id));

    for (const id of sceneIds) {
      if (!sceneIdSet.has(id)) {
        return { success: false, error: `Scene ${id} not found in script ${scriptId}` };
      }
    }

    // Update order indices
    const update = db.query(`
      UPDATE scenes
      SET scene_order = $sceneOrder, updated_at = $updatedAt
      WHERE id = $id
    `);
    const now = new Date().toISOString();

    const transaction = db.transaction(() => {
      for (let i = 0; i < sceneIds.length; i++) {
        update.run({
          $sceneOrder: i,
          $updatedAt: now,
          $id: sceneIds[i],
        });
      }
    });

    transaction();
    return { success: true };
  }
}
