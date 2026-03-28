-- Cutline SQLite Schema
-- Phase 1 MVP - Shot-List-First Paradigm

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  visual_style TEXT DEFAULT 'cinematic',
  color_palette TEXT DEFAULT '[]',
  tone TEXT DEFAULT 'neutral',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Scripts table
CREATE TABLE IF NOT EXISTS scripts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  fountain_text TEXT DEFAULT '',
  format TEXT DEFAULT 'fountain' CHECK(format IN ('fountain', 'av-two-column')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  script_id TEXT NOT NULL,
  heading TEXT NOT NULL,
  location TEXT NOT NULL,
  interior INTEGER DEFAULT 1,
  time_of_day TEXT DEFAULT 'DAY',
  order_index INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE
);

-- Shots table (CRITICAL - confirmation paradigm)
CREATE TABLE IF NOT EXISTS shots (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  shot_number INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('wide', 'medium', 'close-up', 'extreme-cu', 'two-shot', 'over-the-shoulder', 'establishing', 'insert')),
  angle TEXT NOT NULL CHECK(angle IN ('eye-level', 'high-angle', 'low-angle', 'dutch-angle', 'birds-eye', 'worms-eye')),
  movement TEXT NOT NULL CHECK(movement IN ('static', 'pan', 'tilt', 'dolly', 'truck', 'pedestal', 'arc', 'handheld', 'steadicam')),
  characters_in_frame TEXT DEFAULT '[]',
  action_description TEXT DEFAULT '',
  duration INTEGER DEFAULT 5,
  notes TEXT,
  confirmed INTEGER DEFAULT 0,
  confirmed_at TEXT,
  version INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

-- Indexes for shots (CRITICAL for paradigm enforcement)
CREATE INDEX IF NOT EXISTS idx_shots_scene ON shots(scene_id);
CREATE INDEX IF NOT EXISTS idx_shots_confirmed ON shots(confirmed);
CREATE INDEX IF NOT EXISTS idx_shots_scene_confirmed ON shots(scene_id, confirmed);

-- Storyboards table
CREATE TABLE IF NOT EXISTS storyboards (
  id TEXT PRIMARY KEY,
  shot_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  generated_at TEXT DEFAULT (datetime('now')),
  generation_params TEXT DEFAULT '{}',
  api_provider TEXT DEFAULT 'sdxl' CHECK(api_provider IN ('sdxl', 'wanxiang')),
  cost REAL DEFAULT 0,
  style TEXT DEFAULT 'pencil-sketch',
  version INTEGER DEFAULT 1,
  previous_versions TEXT DEFAULT '[]',
  refinement_prompt TEXT,
  FOREIGN KEY (shot_id) REFERENCES shots(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_storyboards_shot ON storyboards(shot_id);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);

-- Sync metadata table (for tracking sync state)
CREATE TABLE IF NOT EXISTS sync_metadata (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  last_sync_at TEXT DEFAULT (datetime('now')),
  sync_version INTEGER DEFAULT 1,
  PRIMARY KEY (entity_type, entity_id)
);
