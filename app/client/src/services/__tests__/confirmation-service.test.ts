/**
 * Tests for Confirmation Service - Paradigm Enforcement
 *
 * These tests verify the shot-list-first paradigm:
 * - Cannot confirm empty shot list
 * - Cannot update confirmed shot
 * - Cannot delete confirmed shot
 * - Confirmation locks shots properly
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfirmationService } from '../confirmation-service';
import { ShotService } from '../shot-service';
import { ShotRepository } from '../repositories/shot-repository';
import { CutlineDB } from '../db';
import { Result, AsyncResult, AppError } from '@/lib/fp';
import {
  createTestDBProject,
  createTestDBScript,
  createTestDBScene,
  createTestDBShot,
  createTestShotData,
} from '@/test-utils';

describe('ConfirmationService - Paradigm Enforcement', () => {
  let db: CutlineDB;
  let shotRepository: ShotRepository;
  let shotService: ShotService;
  let confirmationService: ConfirmationService;

  beforeEach(async () => {
    const dbName = `test-confirmation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    db = new CutlineDB(dbName);
    await db.open();

    shotRepository = new ShotRepository(db);
    shotService = new ShotService(shotRepository);
    confirmationService = new ConfirmationService(shotRepository, shotService);
  });

  afterEach(async () => {
    if (db) {
      await Promise.all([
        db.projects.clear(),
        db.scripts.clear(),
        db.scenes.clear(),
        db.shots.clear(),
      ]);
      db.close();
    }
  });

  async function setupScene() {
    const project = createTestDBProject();
    const script = createTestDBScript(project.id);
    const scene = createTestDBScene(script.id, 1);

    await db.projects.add(project);
    await db.scripts.add(script);
    await db.scenes.add(scene);

    return { project, script, scene };
  }

  describe('confirmShotList', () => {
    it('fails when confirming empty shot list', async () => {
      const { scene } = await setupScene();

      const result = await confirmationService.confirmShotList(scene.id).run();

      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.left.kind).toBe('validation');
        expect(result.left.message).toContain('empty');
      }
    });

    it('fails when scene has no shots', async () => {
      const { scene } = await setupScene();

      const result = await confirmationService.confirmShotList(scene.id).run();

      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.left.kind).toBe('validation');
      }
    });

    it('confirms all shots in a scene', async () => {
      const { scene } = await setupScene();

      // Create unconfirmed shots
      const shot1 = createTestDBShot(scene.id, 1, { confirmed: false });
      const shot2 = createTestDBShot(scene.id, 2, { confirmed: false });
      await db.shots.bulkAdd([shot1, shot2]);

      const result = await confirmationService.confirmShotList(scene.id).run();

      expect(Result.isOk(result)).toBe(true);

      // Verify all shots are confirmed
      const shots = await db.shots.where('sceneId').equals(scene.id).toArray();
      expect(shots.every((s) => s.confirmed === true)).toBe(true);
      expect(shots.every((s) => s.confirmedAt != null)).toBe(true);
    });

    it('sets confirmedAt timestamp on confirmation', async () => {
      const { scene } = await setupScene();
      const shot = createTestDBShot(scene.id, 1, { confirmed: false });
      await db.shots.add(shot);

      const beforeConfirm = new Date();
      const result = await confirmationService.confirmShotList(scene.id).run();

      expect(Result.isOk(result)).toBe(true);

      const confirmedShot = await db.shots.get(shot.id);
      expect(confirmedShot?.confirmedAt).toBeDefined();
      const confirmedAt = new Date(confirmedShot!.confirmedAt!);
      expect(confirmedAt.getTime()).toBeGreaterThanOrEqual(beforeConfirm.getTime());
    });

    it('returns validation error for scene with no shots', async () => {
      const result = await confirmationService.confirmShotList('non-existent-scene').run();

      expect(Result.isErr(result)).toBe(true);
      if (Result.isErr(result)) {
        expect(result.left.kind).toBe('validation');
      }
    });
  });

  describe('unlockShotList', () => {
    it('unlocks confirmed shots', async () => {
      const { scene } = await setupScene();

      // Create confirmed shots
      const shot1 = createTestDBShot(scene.id, 1, {
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      });
      const shot2 = createTestDBShot(scene.id, 2, {
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      });
      await db.shots.bulkAdd([shot1, shot2]);

      const result = await confirmationService.unlockShotList(scene.id).run();

      expect(Result.isOk(result)).toBe(true);

      // Verify all shots are unlocked
      const shots = await db.shots.where('sceneId').equals(scene.id).toArray();
      expect(shots.every((s) => s.confirmed === false)).toBe(true);
      expect(shots.every((s) => s.confirmedAt === undefined)).toBe(true);
    });

    it('succeeds when no shots exist', async () => {
      const { scene } = await setupScene();

      const result = await confirmationService.unlockShotList(scene.id).run();

      expect(Result.isOk(result)).toBe(true);
    });
  });

  describe('ShotService - Paradigm Gates', () => {
    describe('updateShot', () => {
      it('allows updating unconfirmed shot', async () => {
        const { scene } = await setupScene();
        const shot = createTestDBShot(scene.id, 1, { confirmed: false });
        await db.shots.add(shot);

        const result = await shotService
          .updateShot(shot.id, { actionDescription: 'Updated description' })
          .run();

        expect(Result.isOk(result)).toBe(true);
        if (Result.isOk(result)) {
          expect(result.right.actionDescription).toBe('Updated description');
        }
      });

      it('blocks updating confirmed shot', async () => {
        const { scene } = await setupScene();
        const shot = createTestDBShot(scene.id, 1, {
          confirmed: true,
          confirmedAt: new Date().toISOString(),
        });
        await db.shots.add(shot);

        const result = await shotService
          .updateShot(shot.id, { actionDescription: 'Updated description' })
          .run();

        expect(Result.isErr(result)).toBe(true);
        if (Result.isErr(result)) {
          expect(result.left.kind).toBe('validation');
          expect(result.left.message).toContain('confirmed');
        }
      });

      it('preserves confirmation state when updating other fields', async () => {
        const { scene } = await setupScene();
        const shot = createTestDBShot(scene.id, 1, { confirmed: false });
        await db.shots.add(shot);

        const result = await shotService.updateShot(shot.id, { duration: 10 }).run();

        expect(Result.isOk(result)).toBe(true);
        if (Result.isOk(result)) {
          expect(result.right.duration).toBe(10);
          expect(result.right.confirmed).toBe(false);
        }
      });
    });

    describe('deleteShot', () => {
      it('allows deleting unconfirmed shot', async () => {
        const { scene } = await setupScene();
        const shot = createTestDBShot(scene.id, 1, { confirmed: false });
        await db.shots.add(shot);

        const result = await shotService.deleteShot(shot.id).run();

        expect(Result.isOk(result)).toBe(true);

        const deleted = await db.shots.get(shot.id);
        expect(deleted).toBeUndefined();
      });

      it('blocks deleting confirmed shot', async () => {
        const { scene } = await setupScene();
        const shot = createTestDBShot(scene.id, 1, {
          confirmed: true,
          confirmedAt: new Date().toISOString(),
        });
        await db.shots.add(shot);

        const result = await shotService.deleteShot(shot.id).run();

        expect(Result.isErr(result)).toBe(true);
        if (Result.isErr(result)) {
          expect(result.left.kind).toBe('validation');
          expect(result.left.message).toContain('confirmed');
        }

        // Verify shot still exists
        const stillExists = await db.shots.get(shot.id);
        expect(stillExists).toBeDefined();
      });
    });

    describe('createShot', () => {
      it('creates shot in unconfirmed state', async () => {
        const { scene } = await setupScene();
        const shotData = createTestShotData();

        const result = await shotService.createShot(scene.id, shotData).run();

        expect(Result.isOk(result)).toBe(true);
        if (Result.isOk(result)) {
          expect(result.right.confirmed).toBe(false);
          expect(result.right.confirmedAt).toBeUndefined();
        }
      });

      it('assigns correct shot number', async () => {
        const { scene } = await setupScene();

        // Create existing shots
        const shot1 = createTestDBShot(scene.id, 1);
        const shot2 = createTestDBShot(scene.id, 2);
        await db.shots.bulkAdd([shot1, shot2]);

        const shotData = createTestShotData();
        const result = await shotService.createShot(scene.id, shotData).run();

        expect(Result.isOk(result)).toBe(true);
        if (Result.isOk(result)) {
          expect(result.right.shotNumber).toBe(3);
        }
      });
    });
  });
});
