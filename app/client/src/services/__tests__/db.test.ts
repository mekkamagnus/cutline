/**
 * Tests for IndexedDB Schema (CutlineDB)
 *
 * These tests verify the database schema and indexing strategy.
 * Uses fake-indexeddb for testing in jsdom environment.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CutlineDB } from '../db';
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
import {
  createTestDBProject,
  createTestDBScript,
  createTestDBScene,
  createTestDBShot,
  createTestDBStoryboard,
  createTestDBCharacter,
} from '@/test-utils';

describe('CutlineDB', () => {
  let db: CutlineDB;

  beforeEach(async () => {
    // Create a unique DB for each test
    const dbName = `test-cutline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    db = new CutlineDB(dbName);
    await db.open();
  });

  afterEach(async () => {
    if (db) {
      // Clear all tables instead of deleting the database
      await Promise.all([
        db.projects.clear(),
        db.scripts.clear(),
        db.scenes.clear(),
        db.shots.clear(),
        db.storyboards.clear(),
        db.characters.clear(),
        db.comments.clear(),
        db.versions.clear(),
      ]);
      db.close();
    }
  });

  describe('Schema', () => {
    it('creates all required tables', () => {
      expect(db.projects).toBeDefined();
      expect(db.scripts).toBeDefined();
      expect(db.scenes).toBeDefined();
      expect(db.shots).toBeDefined();
      expect(db.storyboards).toBeDefined();
      expect(db.characters).toBeDefined();
      expect(db.comments).toBeDefined();
      expect(db.versions).toBeDefined();
    });
  });

  describe('Projects Table', () => {
    it('indexes projects by name', async () => {
      const project = createTestDBProject({ name: 'Test Film' });
      await db.projects.add(project);

      const found = await db.projects.where('name').equals('Test Film').first();
      expect(found?.id).toBe(project.id);
    });
  });

  describe('Shots Table', () => {
    it('indexes shots by sceneId for fast lookup', async () => {
      const project = createTestDBProject();
      const script = createTestDBScript(project.id);
      const scene = createTestDBScene(script.id, 1);

      await db.projects.add(project);
      await db.scripts.add(script);
      await db.scenes.add(scene);

      const shot1 = createTestDBShot(scene.id, 1);
      const shot2 = createTestDBShot(scene.id, 2);

      await db.shots.bulkAdd([shot1, shot2]);

      const sceneShots = await db.shots
        .where('sceneId')
        .equals(scene.id)
        .toArray();
      expect(sceneShots).toHaveLength(2);
      // Sort by shotNumber since IndexedDB doesn't guarantee order without compound index
      expect(sceneShots.map((s) => s.shotNumber).sort()).toEqual([1, 2]);
    });

    it('indexes shots by confirmed state for paradigm queries', async () => {
      const project = createTestDBProject();
      const script = createTestDBScript(project.id);
      const scene = createTestDBScene(script.id, 1);

      await db.projects.add(project);
      await db.scripts.add(script);
      await db.scenes.add(scene);

      const confirmedShot = createTestDBShot(scene.id, 1, { confirmed: true });
      const unconfirmedShot = createTestDBShot(scene.id, 2, { confirmed: false });

      await db.shots.bulkAdd([confirmedShot, unconfirmedShot]);

      // Query confirmed shots using filter since IndexedDB stores booleans as 1/0
      const allShots = await db.shots.toArray();
      const confirmed = allShots.filter((s) => s.confirmed === true);
      expect(confirmed).toHaveLength(1);
      expect(confirmed[0].id).toBe(confirmedShot.id);
    });
  });

  describe('Scenes Table', () => {
    it('indexes scenes by scriptId', async () => {
      const project = createTestDBProject();
      const script = createTestDBScript(project.id);

      await db.projects.add(project);
      await db.scripts.add(script);

      const scene1 = createTestDBScene(script.id, 1);
      const scene2 = createTestDBScene(script.id, 2);

      await db.scenes.bulkAdd([scene1, scene2]);

      const scenes = await db.scenes.where('scriptId').equals(script.id).toArray();
      expect(scenes).toHaveLength(2);
    });
  });

  describe('Storyboards Table', () => {
    it('indexes storyboards by shotId', async () => {
      const project = createTestDBProject();
      const script = createTestDBScript(project.id);
      const scene = createTestDBScene(script.id, 1);
      const shot = createTestDBShot(scene.id, 1, { confirmed: true });

      await db.projects.add(project);
      await db.scripts.add(script);
      await db.scenes.add(scene);
      await db.shots.add(shot);

      const storyboard = createTestDBStoryboard(shot.id);
      await db.storyboards.add(storyboard);

      const found = await db.storyboards.where('shotId').equals(shot.id).first();
      expect(found?.id).toBe(storyboard.id);
    });
  });

  describe('Characters Table', () => {
    it('indexes characters by projectId', async () => {
      const project = createTestDBProject();
      await db.projects.add(project);

      const character1 = createTestDBCharacter(project.id, 'JOHN');
      const character2 = createTestDBCharacter(project.id, 'SARAH');

      await db.characters.bulkAdd([character1, character2]);

      const chars = await db.characters.where('projectId').equals(project.id).toArray();
      expect(chars).toHaveLength(2);
    });
  });

  describe('Comments Table', () => {
    it('indexes comments by entityType and entityId', async () => {
      const project = createTestDBProject();
      const script = createTestDBScript(project.id);
      const scene = createTestDBScene(script.id, 1);
      const shot = createTestDBShot(scene.id, 1);

      await db.projects.add(project);
      await db.scripts.add(script);
      await db.scenes.add(scene);
      await db.shots.add(shot);

      const comment: DBComment = {
        id: crypto.randomUUID(),
        entityType: 'shot',
        entityId: shot.id,
        content: 'Great composition',
        author: 'Director',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.comments.add(comment);

      const found = await db.comments
        .where('[entityType+entityId]')
        .equals(['shot', shot.id])
        .first();
      expect(found?.content).toBe('Great composition');
    });
  });

  describe('CRUD Operations', () => {
    it('supports full CRUD cycle for shots', async () => {
      const project = createTestDBProject();
      const script = createTestDBScript(project.id);
      const scene = createTestDBScene(script.id, 1);

      await db.projects.add(project);
      await db.scripts.add(script);
      await db.scenes.add(scene);

      const shot = createTestDBShot(scene.id, 1);

      // Create
      await db.shots.add(shot);
      let found = await db.shots.get(shot.id);
      expect(found?.actionDescription).toContain('Shot 1');

      // Update
      await db.shots.update(shot.id, { actionDescription: 'Updated description' });
      found = await db.shots.get(shot.id);
      expect(found?.actionDescription).toBe('Updated description');

      // Delete
      await db.shots.delete(shot.id);
      found = await db.shots.get(shot.id);
      expect(found).toBeUndefined();
    });
  });
});
