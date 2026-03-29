/**
 * Tests for Repositories - Data Access Layer
 *
 * Tests verify:
 * 1. CRUD operations for each repository
 * 2. Indexed queries (findByProjectId, findByScriptId, etc.)
 * 3. Error handling (not found, validation errors)
 * 4. AsyncResult patterns
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CutlineDB } from '../db';
import { ShotRepository } from '../repositories/shot-repository';
import { ProjectRepository } from '../repositories/project-repository';
import { SceneRepository } from '../repositories/scene-repository';
import { StoryboardRepository } from '../repositories/storyboard-repository';
import { ScriptRepository } from '../repositories/script-repository';
import { CharacterRepository } from '../repositories/character-repository';
import { CommentRepository } from '../repositories/comment-repository';
import { VersionRepository } from '../repositories/version-repository';
import { Result } from '@/lib/fp';
import type {
  ProjectData,
  SceneData,
  ShotData,
  StoryboardData,
  ScriptData,
  CharacterData,
  CommentData,
  VersionData,
} from '@/types';
import {
  createTestDBProject,
  createTestDBScript,
  createTestDBScene,
  createTestDBShot,
  createTestDBStoryboard,
} from '@/test-utils';

