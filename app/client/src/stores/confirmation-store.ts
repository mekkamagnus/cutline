/**
 * Confirmation State Store
 *
 * Manages the shot-list-first paradigm state.
 * CRITICAL: This tracks confirmation state for the entire workflow.
 */
import { create } from 'zustand';
import type { Shot } from '@/types';

interface ConfirmationState {
  // Per-scene confirmation tracking
  sceneConfirmationStatus: Map<string, {
    isConfirmed: boolean;
    confirmedAt: Date | null;
    shotCount: number;
    confirmedShotCount: number;
  }>;

  // Global paradigm state
  hasUnconfirmedChanges: boolean;
  isConfirming: boolean;
  isUnlocking: boolean;

  // Cost estimation
  estimatedCost: number;
  costPerImage: number;

  // Actions
  updateSceneStatus: (sceneId: string, shots: Shot[]) => void;
  confirmShotList: (sceneId: string) => Promise<void>;
  unlockShotList: (sceneId: string) => Promise<void>;
  setHasUnconfirmedChanges: (value: boolean) => void;
  getSceneStatus: (sceneId: string) => {
    isConfirmed: boolean;
    confirmedAt: Date | null;
    shotCount: number;
    confirmedShotCount: number;
  };
  canGenerateStoryboards: (sceneId: string) => boolean;
}

// Cost constants (from architecture.md lines 989-995)
const SDXL_COST_PER_IMAGE = 0.002;
const WANXIANG_COST_PER_IMAGE = 0.028;

export const useConfirmationStore = create<ConfirmationState>()((set, get) => ({
  sceneConfirmationStatus: new Map(),
  hasUnconfirmedChanges: false,
  isConfirming: false,
  isUnlocking: false,
  estimatedCost: 0,
  costPerImage: SDXL_COST_PER_IMAGE,

  updateSceneStatus: (sceneId: string, shots: Shot[]) => {
    const confirmedShots = shots.filter((s) => s.confirmed);
    const allConfirmed = shots.length > 0 && confirmedShots.length === shots.length;
    const anyConfirmed = confirmedShots.length > 0;

    set((state) => {
      const newStatus = new Map(state.sceneConfirmationStatus);
      newStatus.set(sceneId, {
        isConfirmed: allConfirmed,
        confirmedAt: confirmedShots[0]?.confirmedAt || null,
        shotCount: shots.length,
        confirmedShotCount: confirmedShots.length,
      });

      return {
        sceneConfirmationStatus: newStatus,
        estimatedCost: confirmedShots.length * state.costPerImage,
        hasUnconfirmedChanges: anyConfirmed && !allConfirmed,
      };
    });
  },

  confirmShotList: async (sceneId: string) => {
    set({ isConfirming: true });

    try {
      // Import service dynamically to avoid circular deps
      const { ShotService } = await import('@/services/shot-service');

      // Get all shots for scene
      const shotsResult = await ShotService.findByScene(sceneId);

      if (shotsResult.isErr()) {
        throw shotsResult.unwrapError();
      }

      const shots = shotsResult.unwrap();

      if (shots.length === 0) {
        throw new Error('Cannot confirm empty shot list');
      }

      // Confirm all shots
      const confirmResult = await ShotService.confirmAll(sceneId);

      if (confirmResult.isErr()) {
        throw confirmResult.unwrapError();
      }

      // Update status
      get().updateSceneStatus(sceneId, confirmResult.unwrap());
    } finally {
      set({ isConfirming: false });
    }
  },

  unlockShotList: async (sceneId: string) => {
    set({ isUnlocking: true });

    try {
      const { ShotService } = await import('@/services/shot-service');

      const result = await ShotService.unlockAll(sceneId);

      if (result.isErr()) {
        throw result.unwrapError();
      }

      // Get updated shots
      const shotsResult = await ShotService.findByScene(sceneId);

      if (shotsResult.isOk()) {
        get().updateSceneStatus(sceneId, shotsResult.unwrap());
      }

      set({ hasUnconfirmedChanges: true });
    } finally {
      set({ isUnlocking: false });
    }
  },

  setHasUnconfirmedChanges: (value) => set({ hasUnconfirmedChanges: value }),

  getSceneStatus: (sceneId) => {
    const status = get().sceneConfirmationStatus.get(sceneId);
    return status || {
      isConfirmed: false,
      confirmedAt: null,
      shotCount: 0,
      confirmedShotCount: 0,
    };
  },

  canGenerateStoryboards: (sceneId) => {
    const status = get().sceneConfirmationStatus.get(sceneId);
    return status?.isConfirmed === true && status.shotCount > 0;
  },
}));
