/**
 * TanStack Query Hooks for Shots
 *
 * Provides hooks for CRUD operations on shots, including confirmation workflow.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShotRepository } from '@/services/repositories/shot-repository';
import { ConfirmationService } from '@/services/confirmation-service';
import { ShotService } from '@/services/shot-service';
import { CutlineDB } from '@/services/db';
import { Result } from '@/lib/fp';
import type { Shot, ShotData } from '@/types';

// Singleton DB instance
let dbInstance: CutlineDB | null = null;

function getDB(): CutlineDB {
  if (!dbInstance) {
    dbInstance = new CutlineDB();
  }
  return dbInstance;
}

function getShotRepo(): ShotRepository {
  return new ShotRepository(getDB());
}

function getConfirmationService(): ConfirmationService {
  const repo = getShotRepo();
  const shotService = new ShotService(repo);
  return new ConfirmationService(repo, shotService);
}

// Query keys
export const shotKeys = {
  all: ['shots'] as const,
  lists: () => [...shotKeys.all, 'list'] as const,
  listByScene: (sceneId: string) => [...shotKeys.lists(), { sceneId }] as const,
  details: () => [...shotKeys.all, 'detail'] as const,
  detail: (id: string) => [...shotKeys.details(), id] as const,
};

/**
 * Hook to fetch all shots for a scene
 */
export function useShots(sceneId: string | undefined) {
  return useQuery({
    queryKey: shotKeys.listByScene(sceneId ?? ''),
    queryFn: async (): Promise<Shot[]> => {
      if (!sceneId) return [];
      const repo = getShotRepo();
      const result = await repo.findByScene(sceneId).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    enabled: !!sceneId,
  });
}

/**
 * Hook to fetch a single shot by ID
 */
export function useShot(id: string | undefined) {
  return useQuery({
    queryKey: shotKeys.detail(id ?? ''),
    queryFn: async (): Promise<Shot | null> => {
      if (!id) return null;
      const repo = getShotRepo();
      const result = await repo.findById(id).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new shot
 */
export function useCreateShot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sceneId,
      data,
    }: {
      sceneId: string;
      data: ShotData;
    }): Promise<Shot> => {
      const repo = getShotRepo();
      const result = await repo.create(sceneId, data).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    onSuccess: (newShot) => {
      // Invalidate shots list for the scene
      queryClient.invalidateQueries({
        queryKey: shotKeys.listByScene(newShot.sceneId),
      });
      // Set the new shot in cache
      queryClient.setQueryData(shotKeys.detail(newShot.id), newShot);
    },
  });
}

/**
 * Hook to update an existing shot
 */
export function useUpdateShot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ShotData>;
    }): Promise<Shot> => {
      const repo = getShotRepo();
      const result = await repo.update(id, data).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    onSuccess: (updatedShot) => {
      // Update the shot in cache
      queryClient.setQueryData(shotKeys.detail(updatedShot.id), updatedShot);
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({
        queryKey: shotKeys.listByScene(updatedShot.sceneId),
      });
    },
  });
}

/**
 * Hook to delete a shot
 */
export function useDeleteShot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; sceneId: string }): Promise<void> => {
      const repo = getShotRepo();
      const result = await repo.delete(id).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
    },
    onSuccess: (_, { id, sceneId }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: shotKeys.detail(id) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: shotKeys.listByScene(sceneId) });
    },
  });
}

/**
 * Hook to confirm a shot list (locks editing)
 *
 * CRITICAL: This implements the shot-list-first paradigm gate.
 * Once confirmed, shots cannot be edited.
 */
export function useConfirmShotList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sceneId: string): Promise<Shot[]> => {
      const service = getConfirmationService();
      const result = await service.confirmShotList(sceneId).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    onSuccess: (confirmedShots, sceneId) => {
      // Update all shots in cache
      confirmedShots.forEach((shot: Shot) => {
        queryClient.setQueryData(shotKeys.detail(shot.id), shot);
      });
      // Invalidate the list
      queryClient.invalidateQueries({ queryKey: shotKeys.listByScene(sceneId) });
    },
  });
}

/**
 * Hook to unlock a shot list (allows editing)
 */
export function useUnlockShotList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sceneId: string): Promise<void> => {
      const service = getConfirmationService();
      const result = await service.unlockShotList(sceneId).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
    },
    onSuccess: (_, sceneId) => {
      // Invalidate the list to refetch with unlocked state
      queryClient.invalidateQueries({ queryKey: shotKeys.listByScene(sceneId) });
    },
  });
}

/**
 * Hook to check if a scene's shot list is confirmed
 */
export function useShotListConfirmationStatus(sceneId: string | undefined) {
  return useQuery({
    queryKey: [...shotKeys.listByScene(sceneId ?? ''), 'confirmationStatus'],
    queryFn: async (): Promise<{ isConfirmed: boolean; confirmedAt?: Date }> => {
      if (!sceneId) return { isConfirmed: false };

      const repo = getShotRepo();
      const result = await repo.findByScene(sceneId).run();
      if (Result.isErr(result)) {
        throw result.left;
      }

      const shots = result.right;
      if (shots.length === 0) {
        return { isConfirmed: false };
      }

      // All shots must be confirmed
      const allConfirmed = shots.every((shot: Shot) => shot.confirmed);
      const latestConfirmedAt = shots.reduce<Date | undefined>((latest: Date | undefined, shot: Shot) => {
        if (!shot.confirmedAt) return latest;
        if (!latest || shot.confirmedAt > latest) return shot.confirmedAt;
        return latest;
      }, undefined);

      return {
        isConfirmed: allConfirmed,
        confirmedAt: latestConfirmedAt,
      };
    },
    enabled: !!sceneId,
  });
}

/**
 * Hook to count shots in a scene
 */
export function useShotCount(sceneId: string | undefined) {
  return useQuery({
    queryKey: [...shotKeys.listByScene(sceneId ?? ''), 'count'],
    queryFn: async (): Promise<number> => {
      if (!sceneId) return 0;
      const repo = getShotRepo();
      const result = await repo.countByScene(sceneId).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    enabled: !!sceneId,
  });
}
