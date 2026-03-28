/**
 * Confirmation Service
 *
 * CRITICAL: This is the core of the shot-list-first paradigm.
 * - No storyboard generation can occur without confirmation
 * - Confirmed shots are locked from editing
 * - Provides explicit lock/unlock workflow
 */
import { db } from '../db/connection.js';
import { ShotService } from './shot-service.js';
import type { DBShot } from '../types/index.js';

export interface ConfirmationResult {
  success: boolean;
  confirmedCount: number;
  confirmedAt: string;
}

export interface UnlockResult {
  success: boolean;
  unlockedCount: number;
}

export class ConfirmationService {
  /**
   * Get confirmation status for a scene
   */
  static getStatus(sceneId: string): {
    totalShots: number;
    confirmedShots: number;
    isFullyConfirmed: boolean;
    hasUnconfirmedChanges: boolean;
  } {
    const shots = ShotService.getByScene(sceneId);
    const confirmedShots = shots.filter(s => s.confirmed === 1);

    return {
      totalShots: shots.length,
      confirmedShots: confirmedShots.length,
      isFullyConfirmed: shots.length > 0 && confirmedShots.length === shots.length,
      hasUnconfirmedChanges: shots.length > 0 && confirmedShots.length < shots.length,
    };
  }

  /**
   * Confirm all shots in a scene
   * PARADIGM GATE: This enables storyboard generation
   */
  static confirmShotList(sceneId: string): ConfirmationResult | { error: string } {
    const shots = ShotService.getByScene(sceneId);

    // Cannot confirm empty shot list
    if (shots.length === 0) {
      return { error: 'Cannot confirm empty shot list. Add shots first.' };
    }

    const now = new Date().toISOString();

    const update = db.query(`
      UPDATE shots
      SET confirmed = 1, confirmed_at = $confirmedAt, updated_at = $updatedAt
      WHERE scene_id = $sceneId AND confirmed = 0
    `);

    const result = update.run({
      $confirmedAt: now,
      $updatedAt: now,
      $sceneId: sceneId,
    });

    return {
      success: true,
      confirmedCount: result.changes,
      confirmedAt: now,
    };
  }

  /**
   * Unlock a confirmed shot list for editing
   * This disables storyboard generation and allows shot modifications
   */
  static unlockShotList(sceneId: string): UnlockResult {
    const update = db.query(`
      UPDATE shots
      SET confirmed = 0, confirmed_at = NULL, updated_at = $updatedAt
      WHERE scene_id = $sceneId AND confirmed = 1
    `);

    const now = new Date().toISOString();
    const result = update.run({
      $updatedAt: now,
      $sceneId: sceneId,
    });

    return {
      success: true,
      unlockedCount: result.changes,
    };
  }

  /**
   * Check if storyboard generation is allowed for a scene
   * PARADIGM ENFORCEMENT: Returns false if any shot is unconfirmed
   */
  static canGenerateStoryboards(sceneId: string): {
    allowed: boolean;
    reason?: string;
    confirmedShotCount: number;
  } {
    const shots = ShotService.getByScene(sceneId);
    const confirmedShots = shots.filter(s => s.confirmed === 1);

    if (shots.length === 0) {
      return {
        allowed: false,
        reason: 'No shots exist for this scene. Create shots first.',
        confirmedShotCount: 0,
      };
    }

    if (confirmedShots.length === 0) {
      return {
        allowed: false,
        reason: 'No confirmed shots. Confirm the shot list first.',
        confirmedShotCount: 0,
      };
    }

    if (confirmedShots.length < shots.length) {
      return {
        allowed: false,
        reason: `${shots.length - confirmedShots.length} shots are unconfirmed. Confirm all shots first.`,
        confirmedShotCount: confirmedShots.length,
      };
    }

    return {
      allowed: true,
      confirmedShotCount: confirmedShots.length,
    };
  }

  /**
   * Get all confirmed shots for storyboard generation
   * Only returns shots if the scene is fully confirmed
   */
  static getConfirmedShotsForGeneration(sceneId: string): DBShot[] | { error: string } {
    const canGenerate = this.canGenerateStoryboards(sceneId);
    if (!canGenerate.allowed) {
      return { error: canGenerate.reason! };
    }

    return ShotService.getConfirmedByScene(sceneId);
  }
}
