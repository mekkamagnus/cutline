/**
 * Cutline Core Type Definitions
 *
 * These types define the domain model for the script-to-storyboard workflow.
 * The Shot type with confirmation state is CRITICAL for the shot-list-first paradigm.
 */

// ============================================================================
// Shot Types (CRITICAL - Core of paradigm)
// ============================================================================

export const SHOT_TYPES = [
  'wide',
  'medium',
  'close-up',
  'extreme-cu',
  'two-shot',
  'over-the-shoulder',
  'establishing',
  'insert',
] as const;

export type ShotType = (typeof SHOT_TYPES)[number];

export const CAMERA_ANGLES = [
  'eye-level',
  'high-angle',
  'low-angle',
  'dutch-angle',
  'birds-eye',
  'worms-eye',
] as const;

export type CameraAngle = (typeof CAMERA_ANGLES)[number];

export const CAMERA_MOVEMENTS = [
  'static',
  'pan',
  'tilt',
  'dolly',
  'truck',
  'pedestal',
  'arc',
  'handheld',
  'steadicam',
] as const;

export type CameraMovement = (typeof CAMERA_MOVEMENTS)[number];

// ============================================================================
// Time of Day
// ============================================================================

export const TIME_OF_DAY = [
  'DAY',
  'NIGHT',
  'DAWN',
  'DUSK',
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'MAGIC HOUR',
] as const;

export type TimeOfDay = (typeof TIME_OF_DAY)[number];

// ============================================================================
// Storyboard Styles
// ============================================================================

export const STORYBOARD_STYLES = [
  'pencil-sketch',
  'ink-drawing',
  'manga-comic',
  'watercolor',
] as const;

export type StoryboardStyle = (typeof STORYBOARD_STYLES)[number];

// ============================================================================
// API Providers
// ============================================================================

export const API_PROVIDERS = ['sdxl', 'wanxiang'] as const;

export type ApiProvider = (typeof API_PROVIDERS)[number];

// ============================================================================
// Entity Types
// ============================================================================

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  // Visual configuration
  visualStyle: string;
  colorPalette: string[];
  tone: string;

  // PWA sync
  lastSyncedAt?: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface Script {
  id: string;
  projectId: string;
  fountainText: string;
  format: 'fountain' | 'av-two-column';
  createdAt: Date;
  updatedAt: Date;
}

export interface ParsedScene {
  id: string;
  heading: string;
  location: string;
  interior: boolean;
  timeOfDay: TimeOfDay;

  // Configuration overrides
  locationDescription?: string;
  mood?: string;
  lightingStyle?: string;
  colorPaletteOverride?: string[];

  // Elements and relationships
  elements: ScriptElement[];
  characterAppearances: string[];
  order: number;
}

export interface ScriptElement {
  id: string;
  type:
    | 'action'
    | 'character'
    | 'dialogue'
    | 'parenthetical'
    | 'transition'
    | 'shot'
    | 'lyrics'
    | 'centered'
    | 'page-break';
  text: string;
  characterName?: string;
  lineNumber: number;
}

export interface ParsedScript {
  title?: string;
  author?: string;
  scenes: ParsedScene[];
  characters: Map<string, CharacterStats>;
  metadata: ScriptMetadata;
}

export interface CharacterStats {
  name: string;
  dialogueCount: number;
  sceneAppearances: string[];
}

export interface ScriptMetadata {
  pageCount: number;
  wordCount: number;
  estimatedDuration: number; // in minutes
}

// ============================================================================
// Scene (Stored in DB)
// ============================================================================

export interface Scene {
  id: string;
  scriptId: string;
  heading: string;
  location: string;
  interior: boolean;
  timeOfDay: TimeOfDay;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Shot (CRITICAL - Core of shot-list-first paradigm)
// ============================================================================

/**
 * Shot entity with confirmation state.
 *
 * CRITICAL: The `confirmed` and `confirmedAt` fields implement the
 * shot-list-first paradigm. No storyboard generation can occur without
 * a confirmed shot list.
 */
export interface Shot {
  id: string;
  sceneId: string;
  shotNumber: number;

  // Camera configuration
  type: ShotType;
  angle: CameraAngle;
  movement: CameraMovement;

  // Content
  charactersInFrame: string[];
  actionDescription: string;
  duration: number; // in seconds
  notes?: string;

  // CONFIRMATION STATE - Core of shot-list-first paradigm
  confirmed: boolean;
  confirmedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data for creating a new shot
 */
export interface ShotData {
  type: ShotType;
  angle: CameraAngle;
  movement: CameraMovement;
  charactersInFrame: string[];
  actionDescription: string;
  duration: number;
  notes?: string;
}

// ============================================================================
// Storyboard Panel
// ============================================================================

export interface StoryboardPanel {
  id: string;
  shotId: string;
  imageUrl: string;
  generatedAt: Date;
  generationParams: GenerationParams;
  apiProvider: ApiProvider;
  cost: number;
  style: StoryboardStyle;
  version: number;
  previousVersions: StoryboardPanelVersion[];
  refinementPrompt?: string;
}

export interface StoryboardPanelVersion {
  version: number;
  imageUrl: string;
  generatedAt: Date;
  refinementPrompt?: string;
}

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  seed?: number;
}

// ============================================================================
// Character
// ============================================================================

export interface Character {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  color: string;
  avatarUrl?: string;
  createdAt: Date;
}

// ============================================================================
// Comment
// ============================================================================

export interface Comment {
  id: string;
  entityType: 'project' | 'scene' | 'shot' | 'storyboard';
  entityId: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Version (for undo/redo)
// ============================================================================

export interface Version {
  id: string;
  projectId: string;
  entityType: 'script' | 'shot-list';
  entityId: string;
  snapshot: string; // JSON stringified
  createdAt: Date;
}

// ============================================================================
// UI Types
// ============================================================================

export type ViewMode = 'script' | 'split' | 'storyboard';

export interface UIState {
  // Selections
  currentProjectId: string | null;
  currentSceneId: string | null;
  currentShotId: string | null;
  selectedPanelId: string | null;

  // UI state
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  viewMode: ViewMode;
  focusMode: boolean;

  // Paradigm tracking
  hasUnconfirmedChanges: boolean;
}

// ============================================================================
// Script Breakdown
// ============================================================================

export interface ScriptBreakdown {
  scenes: SceneBreakdown[];
  characters: CharacterBreakdown[];
  locations: LocationBreakdown[];
  statistics: BreakdownStatistics;
}

export interface SceneBreakdown {
  sceneId: string;
  heading: string;
  order: number;
  characterCount: number;
  estimatedDuration: number;
  shotCount: number;
  hasStoryboard: boolean;
}

export interface CharacterBreakdown {
  name: string;
  sceneAppearances: string[];
  dialogueCount: number;
  color: string;
}

export interface LocationBreakdown {
  name: string;
  scenes: string[];
  interior: boolean;
}

export interface BreakdownStatistics {
  totalScenes: number;
  totalCharacters: number;
  totalLocations: number;
  estimatedDuration: number;
}

// ============================================================================
// AI Suggestion Types
// ============================================================================

export interface ShotSuggestion {
  type: ShotType;
  angle: CameraAngle;
  movement: CameraMovement;
  charactersInFrame: string[];
  actionDescription: string;
  reasoning: string;
  confidence: number; // 0-1
}

// ============================================================================
// DB Types (for Dexie - using ISO strings for dates)
// ============================================================================

export interface DBProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  visualStyle: string;
  colorPalette: string[];
  tone: string;
  lastSyncedAt?: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface DBScript {
  id: string;
  projectId: string;
  fountainText: string;
  format: 'fountain' | 'av-two-column';
  createdAt: string;
  updatedAt: string;
}

export interface DBScene {
  id: string;
  scriptId: string;
  heading: string;
  location: string;
  interior: boolean;
  timeOfDay: TimeOfDay;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DBShot {
  id: string;
  sceneId: string;
  shotNumber: number;
  type: ShotType;
  angle: CameraAngle;
  movement: CameraMovement;
  charactersInFrame: string[];
  actionDescription: string;
  duration: number;
  notes?: string;
  confirmed: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBStoryboard {
  id: string;
  shotId: string;
  imageUrl: string;
  generatedAt: string;
  generationParams: GenerationParams;
  apiProvider: ApiProvider;
  cost: number;
  style: StoryboardStyle;
  version: number;
  previousVersions: DBStoryboardPanelVersion[];
  refinementPrompt?: string;
}

export interface DBStoryboardPanelVersion {
  version: number;
  imageUrl: string;
  generatedAt: string;
  refinementPrompt?: string;
}

export interface DBCharacter {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  color: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface DBComment {
  id: string;
  entityType: 'project' | 'scene' | 'shot' | 'storyboard';
  entityId: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBVersion {
  id: string;
  projectId: string;
  entityType: 'script' | 'shot-list';
  entityId: string;
  snapshot: string;
  createdAt: string;
}

// ============================================================================
// Data Types (for creating entities)
// ============================================================================

export interface ProjectData {
  name: string;
  visualStyle: string;
  colorPalette: string[];
  tone: string;
}

export interface SceneData {
  heading: string;
  location: string;
  interior: boolean;
  timeOfDay: TimeOfDay;
}

export interface StoryboardData {
  imageUrl: string;
  generationParams: GenerationParams;
  apiProvider: ApiProvider;
  cost: number;
  style: StoryboardStyle;
  refinementPrompt?: string;
}

export interface ScriptData {
  fountainText: string;
  format?: 'fountain' | 'av-two-column';
}

export interface CharacterData {
  name: string;
  description?: string;
  color: string;
  avatarUrl?: string;
}

export interface CommentData {
  entityType: 'project' | 'scene' | 'shot' | 'storyboard';
  entityId: string;
  content: string;
  author: string;
}

export interface VersionData {
  entityType: 'script' | 'shot-list';
  entityId: string;
  snapshot: string;
}
