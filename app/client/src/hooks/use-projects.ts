/**
 * TanStack Query Hooks for Projects
 *
 * Provides hooks for CRUD operations on projects using TanStack Query
 * for caching, optimistic updates, and automatic refetching.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectRepository } from '@/services/repositories/project-repository';
import { CutlineDB } from '@/services/db';
import { Result } from '@/lib/fp';
import type { Project, ProjectData } from '@/types';

// Singleton DB instance
let dbInstance: CutlineDB | null = null;

function getDB(): CutlineDB {
  if (!dbInstance) {
    dbInstance = new CutlineDB();
  }
  return dbInstance;
}

function getProjectRepo(): ProjectRepository {
  return new ProjectRepository(getDB());
}

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

/**
 * Hook to fetch all projects
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async (): Promise<Project[]> => {
      const repo = getProjectRepo();
      const result = await repo.findAll().run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
  });
}

/**
 * Hook to fetch a single project by ID
 */
export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id ?? ''),
    queryFn: async (): Promise<Project | null> => {
      if (!id) return null;
      const repo = getProjectRepo();
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
 * Hook to create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProjectData): Promise<Project> => {
      const repo = getProjectRepo();
      const result = await repo.create(data).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    onSuccess: (newProject) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // Set the new project in cache
      queryClient.setQueryData(projectKeys.detail(newProject.id), newProject);
    },
  });
}

/**
 * Hook to update an existing project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectData> }): Promise<Project> => {
      const repo = getProjectRepo();
      const result = await repo.update(id, data).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
    onSuccess: (updatedProject) => {
      // Update the project in cache
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const repo = getProjectRepo();
      const result = await repo.delete(id).run();
      if (Result.isErr(result)) {
        throw result.left;
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Hook to count projects
 */
export function useProjectCount() {
  return useQuery({
    queryKey: [...projectKeys.all, 'count'],
    queryFn: async (): Promise<number> => {
      const repo = getProjectRepo();
      const result = await repo.count().run();
      if (Result.isErr(result)) {
        throw result.left;
      }
      return result.right;
    },
  });
}
