/**
 * TanStack Query Hooks for Scenes
 *
 * Provides hooks for CRUD operations on scenes.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SceneRepository } from '@/services/repositories/scene-repository';
import { CutlineDB } from '@/services/db';
import { Result } from '@/lib/fp';
import type { Scene, SceneData } from '@/types';

// Singleton DB instance
let dbInstance: CutlineDB | null = null;

function getDB(): CutlineDB {
  if (!dbInstance) {
    dbInstance = new CutlineDB('cutline-db');
  }
  return dbInstance;
}

function getSceneRepo(): SceneRepository {
  return new SceneRepository(getDB());
}

// Query keys
export const sceneKeys = {
  all: ['scenes'] as const,
  lists: () => [...sceneKeys.all, 'list'] as const,
  listByScript: (scriptId: string) => [...sceneKeys.lists(), { scriptId }] as const,
  details: () => [...sceneKeys.all, 'detail'] as const,
  detail: (id: string) => [...sceneKeys.details(), id] as const,
};

/**
 * Hook to fetch all scenes for a script
 */
export function useScenes(scriptId: string | undefined) {
  return useQuery({
    queryKey: sceneKeys.listByScript(scriptId ?? ''),
    queryFn: async (): Promise<Scene[]> => {
      if (!scriptId) return [];
      const repo = getSceneRepo();
      const result = await repo.findByScriptId(scriptId).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    enabled: !!scriptId,
  });
}

/**
 * Hook to fetch a single scene by ID
 */
export function useScene(id: string | undefined) {
  return useQuery({
    queryKey: sceneKeys.detail(id ?? ''),
    queryFn: async (): Promise<Scene | null> => {
      if (!id) return null;
      const repo = getSceneRepo();
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
 * Hook to create a new scene
 */
export function useCreateScene() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scriptId,
      data,
    }: {
      scriptId: string;
      data: SceneData;
    }): Promise<Scene> => {
      const repo = getSceneRepo();
      const result = await repo.create(scriptId, data).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    onSuccess: (newScene) => {
      // Invalidate scenes list for the script
      queryClient.invalidateQueries({
        queryKey: sceneKeys.listByScript(newScene.scriptId),
      });
      // Set the new scene in cache
      queryClient.setQueryData(sceneKeys.detail(newScene.id), newScene);
    },
  });
}

/**
 * Hook to update an existing scene
 */
export function useUpdateScene() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<SceneData>;
    }): Promise<Scene> => {
      const repo = getSceneRepo();
      const result = await repo.update(id, data).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    onSuccess: (updatedScene) => {
      // Update the scene in cache
      queryClient.setQueryData(sceneKeys.detail(updatedScene.id), updatedScene);
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({
        queryKey: sceneKeys.listByScript(updatedScene.scriptId),
      });
    },
  });
}

/**
 * Hook to delete a scene
 */
export function useDeleteScene() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; scriptId: string }): Promise<void> => {
      const repo = getSceneRepo();
      const result = await repo.delete(id).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
    },
    onSuccess: (_, { id, scriptId }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: sceneKeys.detail(id) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: sceneKeys.listByScript(scriptId) });
    },
  });
}

/**
 * Hook to reorder scenes in a script
 */
export function useReorderScenes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scriptId: _scriptId,
      sceneOrders,
    }: {
      scriptId: string;
      sceneOrders: Array<{ id: string; order: number }>;
    }): Promise<Scene[]> => {
      const repo = getSceneRepo();
      const result = await repo.reorder(sceneOrders).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    onSuccess: (reorderedScenes) => {
      // Update all scenes in cache
      reorderedScenes.forEach((scene) => {
        queryClient.setQueryData(sceneKeys.detail(scene.id), scene);
      });
      // Invalidate the list
      if (reorderedScenes.length > 0 && reorderedScenes[0]) {
        queryClient.invalidateQueries({
          queryKey: sceneKeys.listByScript(reorderedScenes[0].scriptId),
        });
      }
    },
  });
}

/**
 * Hook to count scenes in a script
 */
export function useSceneCount(scriptId: string | undefined) {
  return useQuery({
    queryKey: [...sceneKeys.listByScript(scriptId ?? ''), 'count'],
    queryFn: async (): Promise<number> => {
      if (!scriptId) return 0;
      const repo = getSceneRepo();
      const result = await repo.countByScript(scriptId).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    enabled: !!scriptId,
  });
}
