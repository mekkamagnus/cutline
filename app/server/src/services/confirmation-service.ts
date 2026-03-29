/**
 * Confirmation Service
 *
 * CRITICAL: This is the core of the shot-list-first paradigm.
 * - No storyboard generation can occur without confirmation
 * - Confirmed shots are locked from editing
 * - Provides explicit lock/unlock workflow
 *
 * Workflow:
 * 1. User creates shots (unconfirmed by default)
 * 2. User confirms shot list (locks all shots)
 * 3. System allows storyboard generation
 * 4. User can unlock to make changes (disables generation)
 */
import { db } from '../db/connection.js';
import { ShotService } from './shot-service.js';
import type { DBShot, ServiceResult } from '../types/index.js';

export interface ConfirmationResult {
  success: boolean;
  confirmedCount: number;
  confirmedAt: string;
}

export interface UnlockResult {
  success: boolean;
  unlockedCount: number;
}

export interface ConfirmationStatus {
  sceneId: string;
  totalShots: number;
  confirmedShots: number;
  unconfirmedShots: number;
  isFullyConfirmed: boolean;
  isPartiallyConfirmed: boolean;
  hasUnconfirmedChanges: boolean;
  canGenerate: boolean;
  lastConfirmedAt: string | null;
}

export class ConfirmationService {
  // =========================================================================
  // Core Operations
  // =========================================================================

  /**
   * Confirm all shots in a scene
   * PARADIGM GATE: This enables storyboard generation
   * CRITICAL: Cannot confirm empty shot list
   */
  static confirmShotList(sceneId: string): ServiceResult<ConfirmationResult> {
    const stats = ShotService.getConfirmationStats(sceneId);

    // PARADIGM ENFORCEMENT: Cannot confirm empty shot list
    if (stats.total === 0) {
      return {
        success: false,
        error: 'Cannot confirm empty shot list. Add at least one shot before confirming.'
      };
    }

    // Already fully confirmed - idempotent success
    if (stats.isFullyConfirmed) {
      const shots = ShotService.getConfirmedByScene(sceneId);
      const lastConfirmedAt = shots.reduce((latest: string | null, shot) => {
        if (!shot.confirmed_at) return latest;
        if (!latest || shot.confirmed_at > latest) return shot.confirmed_at;
        return latest;
      }, null);

      return {
        success: true,
        data: {
          success: true,
          confirmedCount: stats.confirmed,
          confirmedAt: lastConfirmedAt || new Date().toISOString(),
        }
      };
    }

    const now = new Date().toISOString();

    // Update all unconfirmed shots to confirmed
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
      data: {
        success: true,
        confirmedCount: result.changes,
        confirmedAt: now,
      }
    };
  }

  /**
   * Unlock a confirmed shot list for editing
   * This disables storyboard generation and allows shot modifications
   */
  static unlockShotList(sceneId: string): ServiceResult<UnlockResult> {
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
      data: {
        success: true,
        unlockedCount: result.changes,
      }
    };
  }

  // =========================================================================
  // Status & Queries
  // =========================================================================

  /**
   * Get comprehensive confirmation status for a scene
   */
  static getStatus(sceneId: string): ConfirmationStatus {
    const stats = ShotService.getConfirmationStats(sceneId);
    const confirmedShots = ShotService.getConfirmedByScene(sceneId);

    // Find the most recent confirmation timestamp
    const lastConfirmedAt = confirmedShots.reduce((latest: string | null, shot) => {
      if (!shot.confirmed_at) return latest;
      if (!latest || shot.confirmed_at > latest) return shot.confirmed_at;
      return latest;
    }, null);

    return {
      sceneId,
      totalShots: stats.total,
      confirmedShots: stats.confirmed,
      unconfirmedShots: stats.unconfirmed,
      isFullyConfirmed: stats.isFullyConfirmed,
      isPartiallyConfirmed: stats.confirmed > 0 && stats.unconfirmed > 0,
      hasUnconfirmedChanges: stats.total > 0 && stats.confirmed < stats.total,
      canGenerate: stats.isFullyConfirmed,
      lastConfirmedAt,
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
    totalShotCount: number;
  } {
    const stats = ShotService.getConfirmationStats(sceneId);

    if (stats.total === 0) {
      return {
        allowed: false,
        reason: 'No shots exist for this scene. Create and confirm shots first.',
        confirmedShotCount: 0,
        totalShotCount: 0,
      };
    }

    if (stats.confirmed === 0) {
      return {
        allowed: false,
        reason: 'No confirmed shots. Confirm the shot list first.',
        confirmedShotCount: 0,
        totalShotCount: stats.total,
      };
    }

    if (stats.unconfirmed > 0) {
      return {
        allowed: false,
        reason: `${stats.unconfirmed} shot(s) are unconfirmed. Confirm all shots first.`,
        confirmedShotCount: stats.confirmed,
        totalShotCount: stats.total,
      };
    }

    return {
      allowed: true,
      confirmedShotCount: stats.confirmed,
      totalShotCount: stats.total,
    };
  }

  /**
   * Get all confirmed shots for storyboard generation
   * Only returns shots if the scene is fully confirmed
   * PARADIGM GATE: Returns error if not fully confirmed
   */
  static getConfirmedShotsForGeneration(sceneId: string): ServiceResult<DBShot[]> {
    const canGenerate = this.canGenerateStoryboards(sceneId);
    if (!canGenerate.allowed) {
      return { success: false, error: canGenerate.reason! };
    }

    const shots = ShotService.getConfirmedByScene(sceneId);
    return { success: true, data: shots };
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Check if a scene has any shots
   */
  static hasShots(sceneId: string): boolean {
    const stats = ShotService.getConfirmationStats(sceneId);
    return stats.total > 0;
  }

  /**
   * Check if a scene is confirmed (all shots locked)
   */
  static isConfirmed(sceneId: string): boolean {
    const stats = ShotService.getConfirmationStats(sceneId);
    return stats.isFullyConfirmed;
  }

  /**
   * Check if a scene can be unlocked (has confirmed shots)
   */
  static canUnlock(sceneId: string): boolean {
    const stats = ShotService.getConfirmationStats(sceneId);
    return stats.confirmed > 0;
  }
}
