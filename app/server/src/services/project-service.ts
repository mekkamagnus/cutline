/**
 * Project Service
 *
 * Handles CRUD operations for projects with user ownership verification.
 * Follows Elm Architecture patterns with immutable state updates.
 */
import { nanoid } from 'nanoid';
import { db } from '../db/connection.js';
import type { DBProject, CreateProjectRequest, UpdateProjectRequest } from '../types/index.js';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ProjectService {
  /**
   * Find all projects for a user
   * Orders by most recently updated first
   */
  static findAll(userId: string): DBProject[] {
    const query = db.query(`
      SELECT * FROM projects
      WHERE user_id = $userId
      ORDER BY updated_at DESC
    `);
    return query.all({ $userId: userId }) as DBProject[];
  }

  /**
   * Find a project by ID, verifying user ownership
   * Returns undefined if project doesn't exist or user doesn't own it
   */
  static findById(projectId: string, userId: string): DBProject | undefined {
    const query = db.query(`
      SELECT * FROM projects
      WHERE id = $id AND user_id = $userId
    `);
    return query.get({ $id: projectId, $userId: userId }) as DBProject | undefined;
  }

  /**
   * Create a new project for a user
   */
  static create(userId: string, data: CreateProjectRequest): DBProject {
    const id = nanoid();
    const now = new Date().toISOString();

    const insert = db.query(`
      INSERT INTO projects (id, user_id, name, visual_style, color_palette, tone, created_at, updated_at)
      VALUES ($id, $userId, $name, $visualStyle, $colorPalette, $tone, $createdAt, $updatedAt)
    `);

    insert.run({
      $id: id,
      $userId: userId,
      $name: data.name,
      $visualStyle: data.visualStyle || 'cinematic',
      $colorPalette: JSON.stringify(data.colorPalette || []),
      $tone: data.tone || 'neutral',
      $createdAt: now,
      $updatedAt: now,
    });

    return this.findById(id, userId)!;
  }

  /**
   * Update a project, verifying user ownership
   * Returns ServiceResult with updated project or error
   */
  static update(projectId: string, userId: string, data: UpdateProjectRequest): ServiceResult<DBProject> {
    const project = this.findById(projectId, userId);
    if (!project) {
      return { success: false, error: 'Project not found or access denied' };
    }

    const updates: string[] = [];
    const params: Record<string, unknown> = { $id: projectId, $userId: userId, $updatedAt: new Date().toISOString() };

    if (data.name !== undefined) {
      updates.push('name = $name');
      params.$name = data.name;
    }
    if (data.visualStyle !== undefined) {
      updates.push('visual_style = $visualStyle');
      params.$visualStyle = data.visualStyle;
    }
    if (data.colorPalette !== undefined) {
      updates.push('color_palette = $colorPalette');
      params.$colorPalette = JSON.stringify(data.colorPalette);
    }
    if (data.tone !== undefined) {
      updates.push('tone = $tone');
      params.$tone = data.tone;
    }

    // No updates needed
    if (updates.length === 0) {
      return { success: true, data: project };
    }

    updates.push('updated_at = $updatedAt');

    const update = db.query(`
      UPDATE projects SET ${updates.join(', ')}
      WHERE id = $id AND user_id = $userId
    `);
    update.run(params);

    const updated = this.findById(projectId, userId);
    return { success: true, data: updated };
  }

  /**
   * Delete a project and all related data (cascade)
   * Verifies user ownership before deletion
   */
  static delete(projectId: string, userId: string): ServiceResult<void> {
    // Verify ownership first
    const project = this.findById(projectId, userId);
    if (!project) {
      return { success: false, error: 'Project not found or access denied' };
    }

    // Delete with cascade (foreign keys handle related data)
    const deleteQuery = db.query(`
      DELETE FROM projects WHERE id = $id AND user_id = $userId
    `);
    const result = deleteQuery.run({ $id: projectId, $userId: userId });

    if (result.changes === 0) {
      return { success: false, error: 'Failed to delete project' };
    }

    return { success: true };
  }

  // =========================================================================
  // Legacy Methods (for backward compatibility during transition)
  // =========================================================================

  /**
   * @deprecated Use findAll(userId) instead
   */
  static getAll(): DBProject[] {
    const query = db.query(`
      SELECT * FROM projects
      ORDER BY updated_at DESC
    `);
    return query.all() as DBProject[];
  }

  /**
   * @deprecated Use findById(projectId, userId) instead
   */
  static getById(projectId: string): DBProject | undefined {
    const query = db.query('SELECT * FROM projects WHERE id = $id');
    return query.get({ $id: projectId }) as DBProject | undefined;
  }
}
