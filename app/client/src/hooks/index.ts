/**
 * Hooks Barrel Export
 *
 * Re-exports all TanStack Query hooks for use throughout the application.
 */

// Utility hooks
export { useBreakpoint, type BreakpointState } from './use-breakpoint';

// Project hooks
export {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useProjectCount,
  projectKeys,
} from './use-projects';

// Scene hooks
export {
  useScenes,
  useScene,
  useCreateScene,
  useUpdateScene,
  useDeleteScene,
  useReorderScenes,
  useSceneCount,
  sceneKeys,
} from './use-scenes';

// Shot hooks
export {
  useShots,
  useShot,
  useCreateShot,
  useUpdateShot,
  useDeleteShot,
  useConfirmShotList,
  useUnlockShotList,
  useShotListConfirmationStatus,
  useShotCount,
  shotKeys,
} from './use-shots';

// Storyboard hooks
export {
  useStoryboardForShot,
  useStoryboard,
  useCreateStoryboard,
  useUpdateStoryboard,
  useDeleteStoryboard,
  useAddStoryboardVersion,
  useGenerateStoryboards,
  useSceneStoryboardCost,
  storyboardKeys,
  type GenerationStatus,
} from './use-storyboards';
