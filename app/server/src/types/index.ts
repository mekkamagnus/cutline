/**
 * Cutline Server - Shared Type Definitions
 *
 * These types are shared between server and client (via API contracts).
 * They mirror the client types but are defined here for server validation.
 */

// ============================================================================
// Shot Types
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
// API Types (Database Records)
// ============================================================================

export interface DBProject {
  id: string;
  name: string;
  visual_style: string;
  color_palette: string; // JSON array
  tone: string;
  created_at: string;
  updated_at: string;
}

export interface DBScript {
  id: string;
  project_id: string;
  fountain_text: string;
  format: 'fountain' | 'av-two-column';
  created_at: string;
  updated_at: string;
}

export interface DBScene {
  id: string;
  script_id: string;
  heading: string;
  location: string;
  interior: number; // SQLite boolean as 0/1
  time_of_day: TimeOfDay;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DBShot {
  id: string;
  scene_id: string;
  shot_number: number;
  type: ShotType;
  angle: CameraAngle;
  movement: CameraMovement;
  characters_in_frame: string; // JSON array
  action_description: string;
  duration: number;
  notes: string | null;
  confirmed: number; // SQLite boolean as 0/1 - CRITICAL for paradigm
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  version: number; // For conflict detection
}

export interface DBStoryboard {
  id: string;
  shot_id: string;
  image_url: string;
  generated_at: string;
  generation_params: string; // JSON
  api_provider: 'sdxl' | 'wanxiang';
  cost: number;
  style: string;
  version: number;
  previous_versions: string; // JSON array
  refinement_prompt: string | null;
}

export interface DBCharacter {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  color: string;
  avatar_url: string | null;
  created_at: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateProjectRequest {
  name: string;
  visualStyle?: string;
  colorPalette?: string[];
  tone?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  visualStyle?: string;
  colorPalette?: string[];
  tone?: string;
}

export interface CreateShotRequest {
  type: ShotType;
  angle: CameraAngle;
  movement: CameraMovement;
  charactersInFrame: string[];
  actionDescription: string;
  duration: number;
  notes?: string;
}

export interface UpdateShotRequest {
  type?: ShotType;
  angle?: CameraAngle;
  movement?: CameraMovement;
  charactersInFrame?: string[];
  actionDescription?: string;
  duration?: number;
  notes?: string;
}

export interface SyncPullRequest {
  lastSyncAt?: string;
  entities: {
    projects?: string[];
    scripts?: string[];
    scenes?: string[];
    shots?: string[];
    storyboards?: string[];
  };
}

export interface SyncPullResponse {
  pulledAt: string;
  changes: {
    projects: DBProject[];
    scripts: DBScript[];
    scenes: DBScene[];
    shots: DBShot[];
    storyboards: DBStoryboard[];
  };
  deleted: {
    projectIds: string[];
    scriptIds: string[];
    sceneIds: string[];
    shotIds: string[];
    storyboardIds: string[];
  };
}

export interface SyncPushRequest {
  changes: {
    projects?: Partial<DBProject>[];
    scripts?: Partial<DBScript>[];
    scenes?: Partial<DBScene>[];
    shots?: Partial<DBShot>[];
    storyboards?: Partial<DBStoryboard>[];
  };
  deleted: {
    projectIds?: string[];
    scriptIds?: string[];
    sceneIds?: string[];
    shotIds?: string[];
    storyboardIds?: string[];
  };
}

// ============================================================================
// Error Types
// ============================================================================

export type ApiErrorKind =
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'unauthorized'
  | 'internal';

export interface ApiError {
  kind: ApiErrorKind;
  message: string;
  details?: Record<string, unknown>;
}
