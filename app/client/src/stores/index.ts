/**
 * Stores Index
 *
 * Export all Zustand stores from a single entry point.
 */
export { useUIStore, useCurrentProjectId, useCurrentSceneId, useCurrentShotId, useViewMode, useHasUnconfirmedChanges } from './ui-store';
export { useProjectStore } from './project-store';
export { useConfirmationStore } from './confirmation-store';
export { useSettingsStore } from './settings-store';
