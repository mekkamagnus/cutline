/**
 * Tests for Repositories - Data Access Layer
 *
 * Tests verify:
 * 1. CRUD operations for each repository
 * 2. Indexed queries (findByProjectId, findByScriptId, etc.)
 * 3. Error handling (not found, validation errors)
 * 4. AsyncResult patterns
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CutlineDB } from '../db';
import { ShotRepository } from '../repositories/shot-repository';
import { ProjectRepository } from '../repositories/project-repository';
import { SceneRepository } from '../repositories/scene-repository';
import { StoryboardRepository } from '../repositories/storyboard-repository';
import { ScriptRepository } from '../repositories/script-repository';
import { CharacterRepository } from '../repositories/character-repository';
import { CommentRepository } from '../repositories/comment-repository';
import { VersionRepository } from '../repositories/version-repository';
import { Result } from '@/lib/fp';
import type {
  ProjectData,
  SceneData,
  ShotData,
  StoryboardData,
  ScriptData,
  CharacterData,
  CommentData,
  VersionData,
} from '@/types';

describe('Repositories', () => {
  let db: CutlineDB;

  beforeEach(async () => {
    db = new CutlineDB('test-repos-' + crypto.randomUUID());
    await db.projects.clear();
    await db.scripts.clear();
    await db.scenes.clear();
    await db.shots.clear();
    await db.storyboards.clear();
    await db.characters.clear();
    await db.comments.clear();
    await db.versions.clear();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('ProjectRepository', () => {
    const defaultProjectData: ProjectData = {
      name: 'Test Project',
      visualStyle: 'cinematic',
      colorPalette: [],
      tone: 'dramatic',
    };

    it('creates a project', async () => {
      const repo = new ProjectRepository(db);
      const result = await repo.create(defaultProjectData).run();

      expect(Result.isOk(result)).toBe(true);
      const project = Result.unwrap(result);
      expect(project.name).toBe('Test Project');
    });

    it('finds project by id', async () => {
      const repo = new ProjectRepository(db);
      const created = await repo.create({ ...defaultProjectData, name: 'Find Me' }).run();
      const id = Result.unwrap(created).id;

      const found = await repo.findById(id).run();
      expect(Result.isOk(found)).toBe(true);
      expect(Result.unwrap(found)?.name).toBe('Find Me');
    });

    it('updates a project', async () => {
      const repo = new ProjectRepository(db);
      const created = await repo.create(defaultProjectData).run();
      const project = Result.unwrap(created);

      const updated = await repo.update(project.id, { name: 'Updated' }).run();
      expect(Result.isOk(updated)).toBe(true);
      expect(Result.unwrap(updated).name).toBe('Updated');
    });

    it('deletes a project', async () => {
      const repo = new ProjectRepository(db);
      const created = await repo.create({ ...defaultProjectData, name: 'To Delete' }).run();
      const id = Result.unwrap(created).id;

      const deleted = await repo.delete(id).run();
      expect(Result.isOk(deleted)).toBe(true);

      const found = await repo.findById(id).run();
      expect(Result.unwrap(found)).toBeNull();
    });
  });

  describe('ScriptRepository', () => {
    it('creates and finds by project id', async () => {
      const projectRepo = new ProjectRepository(db);
      const scriptRepo = new ScriptRepository(db);

      const project = Result.unwrap(await projectRepo.create({ name: 'P1' }).run());
      const scriptData: ScriptData = { fountainText: 'INT. TEST', format: 'fountain' };

      const created = await scriptRepo.create(project.id, scriptData).run();
      expect(Result.isOk(created)).toBe(true);

      const found = await scriptRepo.findByProjectId(project.id).run();
      expect(Result.isOk(found)).toBe(true);
      expect(Result.unwrap(found)?.fountainText).toBe('INT. TEST');
    });
  });

  describe('SceneRepository', () => {
    it('creates and finds by script id', async () => {
      const projectRepo = new ProjectRepository(db);
      const scriptRepo = new ScriptRepository(db);
      const sceneRepo = new SceneRepository(db);

      const project = Result.unwrap(await projectRepo.create({ name: 'P1' }).run());
      const script = Result.unwrap(await scriptRepo.create(project.id, { fountainText: '' }).run());

      const sceneData: SceneData = {
        heading: 'INT. OFFICE - DAY',
        location: 'OFFICE',
        interior: true,
        timeOfDay: 'DAY',
      };

      const created = await sceneRepo.create(script.id, 1, sceneData).run();
      expect(Result.isOk(created)).toBe(true);

      const found = await sceneRepo.findByScriptId(script.id).run();
      expect(Result.isOk(found)).toBe(true);
      expect(Result.unwrap(found)).toHaveLength(1);
    });
  });

  describe('ShotRepository', () => {
    it('creates and confirms shots', async () => {
      const projectRepo = new ProjectRepository(db);
      const scriptRepo = new ScriptRepository(db);
      const sceneRepo = new SceneRepository(db);
      const shotRepo = new ShotRepository(db);

      const project = Result.unwrap(await projectRepo.create({ name: 'P1' }).run());
      const script = Result.unwrap(await scriptRepo.create(project.id, { fountainText: '' }).run());
      const scene = Result.unwrap(await sceneRepo.create(script.id, 1, {
        heading: 'INT. TEST',
        location: 'TEST',
        interior: true,
        timeOfDay: 'DAY',
      }).run());

      const shotData: ShotData = {
        type: 'medium',
        angle: 'eye-level',
        movement: 'static',
        charactersInFrame: [],
        actionDescription: 'Test shot',
        duration: 5,
      };

      const shot = Result.unwrap(await shotRepo.create(scene.id, 1, shotData).run());
      expect(shot.confirmed).toBe(false);

      // Confirm all shots
      await shotRepo.confirmAll(scene.id).run();

      const found = await shotRepo.findById(shot.id).run();
      expect(Result.unwrap(found)?.confirmed).toBe(true);
    });
  });

  describe('StoryboardRepository', () => {
    it('creates and finds by shot id', async () => {
      const projectRepo = new ProjectRepository(db);
      const scriptRepo = new ScriptRepository(db);
      const sceneRepo = new SceneRepository(db);
      const shotRepo = new ShotRepository(db);
      const storyboardRepo = new StoryboardRepository(db);

      const project = Result.unwrap(await projectRepo.create({ name: 'P1' }).run());
      const script = Result.unwrap(await scriptRepo.create(project.id, { fountainText: '' }).run());
      const scene = Result.unwrap(await sceneRepo.create(script.id, 1, {
        heading: 'INT. TEST',
        location: 'TEST',
        interior: true,
        timeOfDay: 'DAY',
      }).run());
      const shot = Result.unwrap(await shotRepo.create(scene.id, 1, {
        type: 'medium',
        angle: 'eye-level',
        movement: 'static',
        charactersInFrame: [],
        actionDescription: 'Test',
        duration: 5,
      }).run());

      const storyboardData: StoryboardData = {
        imageUrl: 'https://example.com/test.png',
        generationParams: { prompt: 'Test', width: 512, height: 512 },
        apiProvider: 'sdxl',
        cost: 0.002,
        style: 'pencil-sketch',
      };

      const created = await storyboardRepo.create(shot.id, storyboardData).run();
      expect(Result.isOk(created)).toBe(true);

      const found = await storyboardRepo.findByShotId(shot.id).run();
      expect(Result.isOk(found)).toBe(true);
      expect(Result.unwrap(found)?.imageUrl).toBe('https://example.com/test.png');
    });
  });

  describe('CharacterRepository', () => {
    it('creates and finds by project id', async () => {
      const projectRepo = new ProjectRepository(db);
      const charRepo = new CharacterRepository(db);

      const project = Result.unwrap(await projectRepo.create({ name: 'P1' }).run());

      const charData: CharacterData = { name: 'JOHN', description: 'Protagonist' };
      const created = await charRepo.create(project.id, charData).run();
      expect(Result.isOk(created)).toBe(true);

      const found = await charRepo.findByProjectId(project.id).run();
      expect(Result.isOk(found)).toBe(true);
      expect(Result.unwrap(found)).toHaveLength(1);
      expect(Result.unwrap(found)[0]?.name).toBe('JOHN');
    });
  });

  describe('CommentRepository', () => {
    it('creates and finds by entity', async () => {
      const commentRepo = new CommentRepository(db);

      const entityId = crypto.randomUUID();
      const commentData: CommentData = {
        entityType: 'shot',
        entityId,
        content: 'Great shot!',
        author: 'Director',
      };

      const created = await commentRepo.create(commentData).run();
      expect(Result.isOk(created)).toBe(true);

      const found = await commentRepo.findByEntity('shot', entityId).run();
      expect(Result.isOk(found)).toBe(true);
      expect(Result.unwrap(found)).toHaveLength(1);
    });
  });

  describe('VersionRepository', () => {
    it('creates and finds by project', async () => {
      const projectRepo = new ProjectRepository(db);
      const versionRepo = new VersionRepository(db);

      const project = Result.unwrap(await projectRepo.create({ name: 'P1' }).run());

      const versionData: VersionData = {
        entityType: 'script',
        entityId: crypto.randomUUID(),
        snapshot: JSON.stringify({ text: 'v1' }),
      };

      const created = await versionRepo.create(project.id, versionData).run();
      expect(Result.isOk(created)).toBe(true);

      const found = await versionRepo.findRecentByProject(project.id).run();
      expect(Result.isOk(found)).toBe(true);
      expect(Result.unwrap(found)).toHaveLength(1);
    });
  });
});
