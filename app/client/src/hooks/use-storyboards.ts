/**
 * TanStack Query Hooks for Storyboards
 *
 * Provides hooks for CRUD operations on storyboards, including generation.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StoryboardRepository } from '@/services/repositories/storyboard-repository';
import { CutlineDB } from '@/services/db';
import { Result } from '@/lib/fp';
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
 * Hook to generate storyboards for confirmed shots
 *
 * NOTE: This hook provides the structure for storyboard generation.
 * The actual AI API integration will be implemented in Phase 6.
 */
export function useGenerateStoryboards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shotIds,
      style,
      onProgress,
    }: {
      shotIds: string[];
      style: string;
      onProgress?: (status: GenerationStatus) => void;
    }): Promise<StoryboardPanel[]> => {
      const repo = getStoryboardRepo();
      const storyboards: StoryboardPanel[] = [];

      for (let i = 0; i < shotIds.length; i++) {
        const shotId = shotIds[i];
        if (!shotId) continue;

        onProgress?.({
          isGenerating: true,
          progress: Math.round((i / shotIds.length) * 100),
          currentShot: i + 1,
          totalShots: shotIds.length,
        });

        // Placeholder for actual generation
        // In Phase 6, this will call the AI API
        const placeholderData: StoryboardData = {
          imageUrl: `https://placeholder.com/storyboard-${i}.png`,
          generationParams: {
            prompt: `Storyboard in ${style} style`,
            width: 1024,
            height: 768,
          },
          apiProvider: 'sdxl',
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
