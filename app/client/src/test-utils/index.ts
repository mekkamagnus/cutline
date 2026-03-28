/**
 * Test Utilities
 *
 * Helper functions for creating test data and mock objects.
 */
import type {
  Project,
  Script,
  Scene,
  Shot,
  ShotData,
  StoryboardPanel,
  Character,
  DBProject,
  DBScript,
  DBScene,
  DBShot,
  DBStoryboard,
  DBCharacter,
} from '@/types';

/**
 * Generate a random UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Create a test project
 */
export function createTestProject(overrides: Partial<Project> = {}): Project {
  const now = new Date();
  return {
    id: generateId(),
    name: 'Test Project',
    createdAt: now,
    updatedAt: now,
    visualStyle: 'cinematic',
    colorPalette: [],
    tone: 'neutral',
    syncStatus: 'synced',
    ...overrides,
  };
}

/**
 * Create a test project for DB
 */
export function createTestDBProject(overrides: Partial<DBProject> = {}): DBProject {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: 'Test Project',
    createdAt: now,
    updatedAt: now,
    visualStyle: 'cinematic',
    colorPalette: [],
    tone: 'neutral',
    syncStatus: 'synced',
    ...overrides,
  };
}

/**
 * Create a test script
 */
export function createTestScript(
  projectId: string,
  overrides: Partial<Script> = {}
): Script {
  const now = new Date();
  return {
    id: generateId(),
    projectId,
    fountainText: '',
    format: 'fountain',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test script for DB
 */
export function createTestDBScript(
  projectId: string,
  overrides: Partial<DBScript> = {}
): DBScript {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    projectId,
    fountainText: '',
    format: 'fountain',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test scene
 */
export function createTestScene(
  scriptId: string,
  order: number,
  overrides: Partial<Scene> = {}
): Scene {
  const now = new Date();
  return {
    id: generateId(),
    scriptId,
    heading: `INT. LOCATION - DAY`,
    location: 'LOCATION',
    interior: true,
    timeOfDay: 'DAY',
    order,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test scene for DB
 */
export function createTestDBScene(
  scriptId: string,
  order: number,
  overrides: Partial<DBScene> = {}
): DBScene {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    scriptId,
    heading: `INT. LOCATION - DAY`,
    location: 'LOCATION',
    interior: true,
    timeOfDay: 'DAY',
    order,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test shot (unconfirmed by default)
 */
export function createTestShot(
  sceneId: string,
  shotNumber: number,
  overrides: Partial<Shot> = {}
): Shot {
  const now = new Date();
  return {
    id: generateId(),
    sceneId,
    shotNumber,
    type: 'wide',
    angle: 'eye-level',
    movement: 'static',
    charactersInFrame: [],
    actionDescription: `Shot ${shotNumber}`,
    duration: 5,
    confirmed: false, // CRITICAL: always unconfirmed on creation
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test shot for DB
 */
export function createTestDBShot(
  sceneId: string,
  shotNumber: number,
  overrides: Partial<DBShot> = {}
): DBShot {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    sceneId,
    shotNumber,
    type: 'wide',
    angle: 'eye-level',
    movement: 'static',
    charactersInFrame: [],
    actionDescription: `Shot ${shotNumber}`,
    duration: 5,
    confirmed: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create test shot data for creation
 */
export function createTestShotData(overrides: Partial<ShotData> = {}): ShotData {
  return {
    type: 'wide',
    angle: 'eye-level',
    movement: 'static',
    charactersInFrame: [],
    actionDescription: 'Test action',
    duration: 5,
    ...overrides,
  };
}

/**
 * Create multiple test shots for a scene
 */
export function createTestShotsForScene(
  sceneId: string,
  count: number,
  confirmed = false
): Shot[] {
  const shots: Shot[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    shots.push({
      id: generateId(),
      sceneId,
      shotNumber: i + 1,
      type: 'wide',
      angle: 'eye-level',
      movement: 'static',
      charactersInFrame: [],
      actionDescription: `Shot ${i + 1}`,
      duration: 5,
      confirmed,
      confirmedAt: confirmed ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });
  }

  return shots;
}

/**
 * Create a confirmed shot
 */
export function createConfirmedShot(
  sceneId: string,
  shotNumber: number,
  overrides: Partial<Shot> = {}
): Shot {
  const now = new Date();
  return createTestShot(sceneId, shotNumber, {
    confirmed: true,
    confirmedAt: now,
    ...overrides,
  });
}

/**
 * Create a test storyboard panel
 */
export function createTestStoryboard(
  shotId: string,
  overrides: Partial<StoryboardPanel> = {}
): StoryboardPanel {
  return {
    id: generateId(),
    shotId,
    imageUrl: 'https://example.com/image.png',
    generatedAt: new Date(),
    generationParams: {
      prompt: 'Test prompt',
      width: 1024,
      height: 768,
    },
    apiProvider: 'sdxl',
    cost: 0.002,
    style: 'pencil-sketch',
    version: 1,
    previousVersions: [],
    ...overrides,
  };
}

/**
 * Create a test storyboard for DB
 */
export function createTestDBStoryboard(
  shotId: string,
  overrides: Partial<DBStoryboard> = {}
): DBStoryboard {
  return {
    id: generateId(),
    shotId,
    imageUrl: 'https://example.com/image.png',
    generatedAt: new Date().toISOString(),
    generationParams: {
      prompt: 'Test prompt',
      width: 1024,
      height: 768,
    },
    apiProvider: 'sdxl',
    cost: 0.002,
    style: 'pencil-sketch',
    version: 1,
    previousVersions: [],
    ...overrides,
  };
}

/**
 * Create a test character
 */
export function createTestCharacter(
  projectId: string,
  name: string,
  overrides: Partial<Character> = {}
): Character {
  return {
    id: generateId(),
    projectId,
    name,
    color: '#6366f1',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a test character for DB
 */
export function createTestDBCharacter(
  projectId: string,
  name: string,
  overrides: Partial<DBCharacter> = {}
): DBCharacter {
  return {
    id: generateId(),
    projectId,
    name,
    color: '#6366f1',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Sample Fountain script for testing
 */
export const SAMPLE_FOUNTAIN_SCRIPT = `
INT. OFFICE - DAY

A cluttered writer's room. Coffee cups everywhere.

JOHN
(hungry)
I need to finish this script.

SARAH enters, carrying a bag of food.

SARAH
Take a break. You've been at it for hours.

John looks up, torn between the screen and the food.

JOHN
Just one more scene...

EXT. PARK - SUNSET

John and Sarah sit on a bench, watching the sunset.

SARAH
Sometimes the best ideas come when you stop trying.

John nods, finally at peace.
`.trim();

/**
 * Wait for a condition in tests
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const start = Date.now();

  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
