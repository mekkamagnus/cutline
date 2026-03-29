/**
 * Project Data Store
 *
 * Manages project data with offline-first IndexedDB storage.
 * Syncs with backend when online.
 */
import { create } from 'zustand';
import type { Project } from '@/types';
import { getDB } from '@/services/db';

interface ProjectState {
  // Data
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Sync state
  isOnline: boolean;
  lastSyncAt: Date | null;
  pendingChanges: number;

  // Actions
  loadProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  syncWithServer: () => Promise<void>;
  setOnline: (online: boolean) => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  isOnline: navigator.onLine,
  lastSyncAt: null,
  pendingChanges: 0,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      const projects = await db.projects.toArray();

      // Transform DB types to domain types
      const domainProjects: Project[] = projects.map((p) => ({
        id: p.id,
        name: p.name,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        visualStyle: p.visualStyle,
        colorPalette: p.colorPalette,
        tone: p.tone,
        lastSyncedAt: p.lastSyncedAt ? new Date(p.lastSyncedAt) : undefined,
        syncStatus: p.syncStatus,
      }));

      set({ projects: domainProjects, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load projects',
        isLoading: false,
      });
    }
  },

  loadProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDB();
      const project = await db.projects.get(id);

      if (!project) {
        set({ currentProject: null, isLoading: false });
        return;
      }

      const domainProject: Project = {
        id: project.id,
        name: project.name,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        visualStyle: project.visualStyle,
        colorPalette: project.colorPalette,
        tone: project.tone,
        lastSyncedAt: project.lastSyncedAt ? new Date(project.lastSyncedAt) : undefined,
        syncStatus: project.syncStatus,
      };

      set({ currentProject: domainProject, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load project',
        isLoading: false,
      });
    }
  },

  createProject: async (data: Partial<Project>) => {
    const db = getDB();
    const now = new Date();

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: data.name || 'Untitled Project',
      createdAt: now,
      updatedAt: now,
      visualStyle: data.visualStyle || 'cinematic',
      colorPalette: data.colorPalette || [],
      tone: data.tone || 'neutral',
      syncStatus: 'pending',
    };

    // Store in IndexedDB
    await db.projects.add({
      id: newProject.id,
      name: newProject.name,
      createdAt: newProject.createdAt.toISOString(),
      updatedAt: newProject.updatedAt.toISOString(),
      visualStyle: newProject.visualStyle,
      colorPalette: newProject.colorPalette,
      tone: newProject.tone,
      syncStatus: newProject.syncStatus,
    });

    set((state) => ({
      projects: [...state.projects, newProject],
      pendingChanges: state.pendingChanges + 1,
    }));

    return newProject;
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    const db = getDB();
    const now = new Date();

    await db.projects.update(id, {
      ...data,
      updatedAt: now.toISOString(),
      syncStatus: 'pending',
    });

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, ...data, updatedAt: now, syncStatus: 'pending' }
          : p
      ),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...data, updatedAt: now, syncStatus: 'pending' }
          : state.currentProject,
      pendingChanges: state.pendingChanges + 1,
    }));
  },

  deleteProject: async (id: string) => {
    const db = getDB();

    // Cascade delete handled by DB schema
    await db.projects.delete(id);

    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  syncWithServer: async () => {
    const { isOnline } = get();
    if (!isOnline) return;

    // TODO: Implement sync with backend
    // 1. Get pending changes from IndexedDB
    // 2. POST to /api/sync/push
    // 3. GET from /api/sync/pull
    // 4. Resolve conflicts
    // 5. Update local state

    set({ lastSyncAt: new Date(), pendingChanges: 0 });
  },

  setOnline: (online) => {
    set({ isOnline: online });
    if (online) {
      // Auto-sync when coming back online
      get().syncWithServer();
    }
  },
}));

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useProjectStore.getState().setOnline(true));
  window.addEventListener('offline', () => useProjectStore.getState().setOnline(false));
}
