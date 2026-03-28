/**
 * Project Service
 *
 * Handles CRUD operations for projects.
 */
import { nanoid } from 'nanoid';
import { db } from '../db/connection.js';
import type { DBProject, CreateProjectRequest, UpdateProjectRequest } from '../types/index.js';

export class ProjectService {
  /**
   * Get all projects
   */
  static getAll(): DBProject[] {
    const query = db.query(`
      SELECT * FROM projects
      ORDER BY updated_at DESC
    `);
    return query.all() as DBProject[];
  }

  /**
   * Get a project by ID
   */
  static getById(projectId: string): DBProject | undefined {
    const query = db.query('SELECT * FROM projects WHERE id = $id');
    return query.get({ $id: projectId }) as DBProject | undefined;
  }

  /**
   * Create a new project
   */
  static create(data: CreateProjectRequest): DBProject {
    const id = nanoid();
    const now = new Date().toISOString();

    const insert = db.query(`
      INSERT INTO projects (id, name, visual_style, color_palette, tone, created_at, updated_at)
      VALUES ($id, $name, $visualStyle, $colorPalette, $tone, $createdAt, $updatedAt)
    `);

    insert.run({
      $id: id,
      $name: data.name,
      $visualStyle: data.visualStyle || 'cinematic',
      $colorPalette: JSON.stringify(data.colorPalette || []),
      $tone: data.tone || 'neutral',
      $createdAt: now,
      $updatedAt: now,
    });

    return this.getById(id)!;
  }

  /**
   * Update a project
   */
  static update(projectId: string, data: UpdateProjectRequest): DBProject | undefined {
    const project = this.getById(projectId);
    if (!project) return undefined;

    const updates: string[] = [];
    const params: Record<string, unknown> = { $id: projectId, $updatedAt: new Date().toISOString() };

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

    if (updates.length === 0) return project;

    updates.push('updated_at = $updatedAt');

    const update = db.query(`UPDATE projects SET ${updates.join(', ')} WHERE id = $id`);
    update.run(params);

    return this.getById(projectId);
  }

  /**
   * Delete a project (cascades to all related data)
   */
  static delete(projectId: string): boolean {
    const deleteQuery = db.query('DELETE FROM projects WHERE id = $id');
    const result = deleteQuery.run({ $id: projectId });
    return result.changes > 0;
  }
}
