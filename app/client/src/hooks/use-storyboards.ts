/**
 * TanStack Query Hooks for Storyboards
 *
 * Provides hooks for CRUD operations on storyboards, including generation.
 * Uses backend API for AI generation with offline-first IndexedDB caching.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StoryboardRepository } from '@/services/repositories/storyboard-repository';
import { CutlineDB } from '@/services/db';
import { Result } from '@/lib/fp';
import { api, type GenerateStoryboardsResponse } from '@/lib/api-client';
import type { StoryboardPanel, StoryboardData } from '@/types';

// Singleton DB instance
let dbInstance: CutlineDB | null = null;

function getDB(): CutlineDB {
  if (!dbInstance) {
    dbInstance = new CutlineDB('cutline-db');
  }
  return dbInstance;
}

function getStoryboardRepo(): StoryboardRepository {
  return new StoryboardRepository(getDB());
}

// Query keys
export const storyboardKeys = {
  all: ['storyboards'] as const,
  lists: () => [...storyboardKeys.all, 'list'] as const,
  listByShot: (shotId: string) => [...storyboardKeys.lists(), { shotId }] as const,
  details: () => [...storyboardKeys.all, 'detail'] as const,
  detail: (id: string) => [...storyboardKeys.details(), id] as const,
};

/**
 * Hook to fetch storyboard for a shot (one-to-one)
 */
export function useStoryboardForShot(shotId: string | undefined) {
  return useQuery({
    queryKey: storyboardKeys.listByShot(shotId ?? ''),
    queryFn: async (): Promise<StoryboardPanel | null> => {
      if (!shotId) return null;
      const repo = getStoryboardRepo();
      const result = await repo.findByShotId(shotId).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    enabled: !!shotId,
  });
}

/**
 * Hook to fetch a single storyboard by ID
 */
export function useStoryboard(id: string | undefined) {
  return useQuery({
    queryKey: storyboardKeys.detail(id ?? ''),
    queryFn: async (): Promise<StoryboardPanel | null> => {
      if (!id) return null;
      const repo = getStoryboardRepo();
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
 * Hook to create a new storyboard
 */
export function useCreateStoryboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shotId,
      data,
    }: {
      shotId: string;
      data: StoryboardData;
    }): Promise<StoryboardPanel> => {
      const repo = getStoryboardRepo();
      const result = await repo.create(shotId, data).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    onSuccess: (newStoryboard) => {
      // Set the new storyboard in cache
      queryClient.setQueryData(storyboardKeys.detail(newStoryboard.id), newStoryboard);
      queryClient.setQueryData(storyboardKeys.listByShot(newStoryboard.shotId), newStoryboard);
    },
  });
}

/**
 * Hook to update an existing storyboard
 */
export function useUpdateStoryboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<StoryboardData>;
    }): Promise<StoryboardPanel> => {
      const repo = getStoryboardRepo();
      const result = await repo.update(id, data).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    onSuccess: (updatedStoryboard) => {
      // Update the storyboard in cache
      queryClient.setQueryData(storyboardKeys.detail(updatedStoryboard.id), updatedStoryboard);
      queryClient.setQueryData(storyboardKeys.listByShot(updatedStoryboard.shotId), updatedStoryboard);
    },
  });
}

/**
 * Hook to delete a storyboard
 */
export function useDeleteStoryboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; shotId: string }): Promise<void> => {
      const repo = getStoryboardRepo();
      const result = await repo.delete(id).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
    },
    onSuccess: (_, { id, shotId }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: storyboardKeys.detail(id) });
      queryClient.removeQueries({ queryKey: storyboardKeys.listByShot(shotId) });
    },
  });
}

/**
 * Hook to add a new version to a storyboard (refinement)
 */
export function useAddStoryboardVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      newVersion,
    }: {
      id: string;
      newVersion: StoryboardData;
    }): Promise<StoryboardPanel> => {
      const repo = getStoryboardRepo();
      const result = await repo.addVersion(id, newVersion).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    onSuccess: (updatedStoryboard) => {
      // Update the storyboard in cache
      queryClient.setQueryData(storyboardKeys.detail(updatedStoryboard.id), updatedStoryboard);
      queryClient.setQueryData(storyboardKeys.listByShot(updatedStoryboard.shotId), updatedStoryboard);
    },
  });
}

/**
 * Generation status type
 */
export interface GenerationStatus {
  isGenerating: boolean;
  progress: number; // 0-100
  currentShot: number;
  totalShots: number;
  error?: string;
}

/**
 * Check if we're online
 */
function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Hook to generate storyboards for confirmed shots
 *
 * Calls backend API for AI generation when online.
 * Falls back to placeholder generation when offline.
 */
export function useGenerateStoryboards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shotIds,
      style,
      provider = 'sdxl',
      onProgress,
    }: {
      shotIds: string[];
      style: string;
      provider?: 'sdxl' | 'wanxiang';
      onProgress?: (status: GenerationStatus) => void;
    }): Promise<StoryboardPanel[]> => {
      const repo = getStoryboardRepo();
      const storyboards: StoryboardPanel[] = [];

      if (isOnline()) {
        // Online: Use backend API for real generation
        onProgress?.({
          isGenerating: true,
          progress: 0,
          currentShot: 0,
          totalShots: shotIds.length,
        });

        const response = await api.post<GenerateStoryboardsResponse>('/api/ai/generate/storyboards', {
          shotIds,
          style,
          provider,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to generate storyboards');
        }

        // Store results in local DB for offline access
        for (let i = 0; i < response.data.storyboards.length; i++) {
          const sb = response.data.storyboards[i];
          if (!sb) continue;

          onProgress?.({
            isGenerating: true,
            progress: Math.round(((i + 1) / shotIds.length) * 100),
            currentShot: i + 1,
            totalShots: shotIds.length,
          });

          const storyboardData: StoryboardData = {
            imageUrl: sb.imageUrl,
            generationParams: {
              prompt: `Storyboard in ${style} style`,
              width: 1024,
              height: 576,
            },
            apiProvider: sb.provider as StoryboardData['apiProvider'],
            cost: sb.cost,
            style: style as StoryboardData['style'],
          };

          const result = await repo.create(sb.shotId, storyboardData).run();
          if (Result.isOk(result)) {
            storyboards.push(result.right);
          }
        }

        onProgress?.({
          isGenerating: false,
          progress: 100,
          currentShot: shotIds.length,
          totalShots: shotIds.length,
        });
      } else {
        // Offline: Generate placeholder storyboards
        for (let i = 0; i < shotIds.length; i++) {
          const shotId = shotIds[i];
          if (!shotId) continue;

          onProgress?.({
            isGenerating: true,
            progress: Math.round((i / shotIds.length) * 100),
            currentShot: i + 1,
            totalShots: shotIds.length,
          });

          // Placeholder for offline generation
          const placeholderData: StoryboardData = {
            imageUrl: `https://picsum.photos/seed/${Date.now() + i}/1024/576`,
            generationParams: {
              prompt: `Storyboard in ${style} style`,
              width: 1024,
              height: 576,
            },
            apiProvider: provider,
            cost: 0.002,
            style: style as StoryboardData['style'],
          };

          const result = await repo.create(shotId, placeholderData).run();
          if (Result.isOk(result)) {
            storyboards.push(result.right);
          }
        }

        onProgress?.({
          isGenerating: false,
          progress: 100,
          currentShot: shotIds.length,
          totalShots: shotIds.length,
        });
      }

      return storyboards;
    },
    onSuccess: (storyboards) => {
      // Invalidate all relevant caches
      const shotIds = new Set(storyboards.map((s) => s.shotId));
      shotIds.forEach((shotId) => {
        queryClient.invalidateQueries({
          queryKey: storyboardKeys.listByShot(shotId),
        });
      });
    },
  });
}

/**
 * Hook to get total cost for a scene
 */
export function useSceneStoryboardCost(sceneId: string | undefined) {
  return useQuery({
    queryKey: ['scenes', sceneId, 'storyboardCost'],
    queryFn: async (): Promise<number> => {
      if (!sceneId) return 0;
      const repo = getStoryboardRepo();
      const result = await repo.getTotalCostByScene(sceneId).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    enabled: !!sceneId,
  });
}
