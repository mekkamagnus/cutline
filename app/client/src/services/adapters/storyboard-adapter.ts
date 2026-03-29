/**
 * Storyboard Adapter - Domain <-> DB Type Transformations
 *
 * Handles conversions between domain types (Date objects) and
 * database types (ISO strings) for Storyboard entities.
 */
import type {
  StoryboardPanel,
  DBStoryboard,
  StoryboardData,
  StoryboardPanelVersion,
  DBStoryboardPanelVersion,
} from '@/types';

/**
 * Transform a database storyboard panel version to domain
 */
function versionToDomain(dbVersion: DBStoryboardPanelVersion): StoryboardPanelVersion {
  return {
    version: dbVersion.version,
    imageUrl: dbVersion.imageUrl,
    generatedAt: new Date(dbVersion.generatedAt),
    refinementPrompt: dbVersion.refinementPrompt,
  };
}

/**
 * Transform a domain storyboard panel version to database
 */
function versionToDB(version: StoryboardPanelVersion): DBStoryboardPanelVersion {
  return {
    version: version.version,
    imageUrl: version.imageUrl,
    generatedAt: version.generatedAt.toISOString(),
    refinementPrompt: version.refinementPrompt,
  };
}

/**
 * Transform a database storyboard to a domain storyboard
 */
export function toDomain(dbStoryboard: DBStoryboard): StoryboardPanel {
  return {
    id: dbStoryboard.id,
    shotId: dbStoryboard.shotId,
    imageUrl: dbStoryboard.imageUrl,
    generatedAt: new Date(dbStoryboard.generatedAt),
    generationParams: dbStoryboard.generationParams,
    apiProvider: dbStoryboard.apiProvider,
    cost: dbStoryboard.cost,
    style: dbStoryboard.style,
    version: dbStoryboard.version,
    previousVersions: dbStoryboard.previousVersions.map(versionToDomain),
    refinementPrompt: dbStoryboard.refinementPrompt,
  };
}

/**
 * Transform a domain storyboard to a database storyboard
 */
export function toDB(storyboard: StoryboardPanel): DBStoryboard {
  return {
    id: storyboard.id,
    shotId: storyboard.shotId,
    imageUrl: storyboard.imageUrl,
    generatedAt: storyboard.generatedAt.toISOString(),
    generationParams: storyboard.generationParams,
    apiProvider: storyboard.apiProvider,
    cost: storyboard.cost,
    style: storyboard.style,
    version: storyboard.version,
    previousVersions: storyboard.previousVersions.map(versionToDB),
    refinementPrompt: storyboard.refinementPrompt,
  };
}

/**
 * Create a DBStoryboard from storyboard data for insertion
 */
export function createDBStoryboard(id: string, shotId: string, data: StoryboardData): DBStoryboard {
  const now = new Date().toISOString();
  return {
    id,
    shotId,
    imageUrl: data.imageUrl,
    generatedAt: now,
    generationParams: data.generationParams,
    apiProvider: data.apiProvider,
    cost: data.cost,
    style: data.style,
    version: 1,
    previousVersions: [],
    refinementPrompt: data.refinementPrompt,
  };
}

/**
 * Transform an array of database storyboards to domain storyboards
 */
export function toDomainArray(dbStoryboards: DBStoryboard[]): StoryboardPanel[] {
  return dbStoryboards.map(toDomain);
}
