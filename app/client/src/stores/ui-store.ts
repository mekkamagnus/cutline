/**
 * UI State Store
 *
 * Manages UI state including selections, view modes, and paradigm tracking.
 * Reference: architecture.md lines 988-1011
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewMode } from '@/types';

interface UIState {
  // Selection state
  currentProjectId: string | null;
  currentSceneId: string | null;
  currentShotId: string | null;
  selectedPanelId: string | null;

  // View state
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  viewMode: ViewMode;
  focusMode: boolean;

  // Paradigm tracking - CRITICAL for shot-list-first workflow
  hasUnconfirmedChanges: boolean;

  // Actions - Selection
  selectProject: (id: string | null) => void;
  selectScene: (id: string | null) => void;
  selectShot: (id: string | null) => void;
  selectPanel: (id: string | null) => void;

  // Actions - View
  setViewMode: (mode: ViewMode) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleFocusMode: () => void;

  // Actions - Paradigm
  setHasUnconfirmedChanges: (value: boolean) => void;
  resetSelections: () => void;
}

const initialState = {
  currentProjectId: null,
  currentSceneId: null,
  currentShotId: null,
  selectedPanelId: null,
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  viewMode: 'split' as ViewMode,
  focusMode: false,
  hasUnconfirmedChanges: false,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...initialState,

      // Selection actions
      selectProject: (id) =>
        set({
          currentProjectId: id,
          // Reset child selections when project changes
          currentSceneId: null,
          currentShotId: null,
          selectedPanelId: null,
        }),

      selectScene: (id) =>
        set({
          currentSceneId: id,
          // Reset child selections when scene changes
          currentShotId: null,
          selectedPanelId: null,
        }),

      selectShot: (id) =>
        set({
          currentShotId: id,
          selectedPanelId: null,
        }),

      selectPanel: (id) => set({ selectedPanelId: id }),

      // View actions
      setViewMode: (mode) => set({ viewMode: mode }),

      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),

      toggleRightSidebar: () =>
        set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

      toggleFocusMode: () =>
        set((state) => {
          const newFocusMode = !state.focusMode;
          return {
            focusMode: newFocusMode,
            // Hide sidebars in focus mode
            leftSidebarOpen: newFocusMode ? false : state.leftSidebarOpen,
            rightSidebarOpen: newFocusMode ? false : state.rightSidebarOpen,
          };
        }),

      // Paradigm actions
      setHasUnconfirmedChanges: (value) => set({ hasUnconfirmedChanges: value }),

      resetSelections: () => set(initialState),
    }),
    {
      name: 'cutline-ui-state',
      // Only persist view preferences, not selections
      partialize: (state) => ({
        leftSidebarOpen: state.leftSidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen,
        viewMode: state.viewMode,
      }),
    }
  )
);

// Selector hooks for performance
export const useCurrentProjectId = () => useUIStore((state) => state.currentProjectId);
export const useCurrentSceneId = () => useUIStore((state) => state.currentSceneId);
export const useCurrentShotId = () => useUIStore((state) => state.currentShotId);
export const useViewMode = () => useUIStore((state) => state.viewMode);
export const useHasUnconfirmedChanges = () => useUIStore((state) => state.hasUnconfirmedChanges);
