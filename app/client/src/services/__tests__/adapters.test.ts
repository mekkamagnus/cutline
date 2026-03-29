/**
 * Tests for Adapters - Domain <-> DB Type Transformations
 *
 * Tests verify:
 * 1. toDomain/toDB round-trips preserve data
 * 2. Date serialization (Date objects ↔ ISO strings)
 * 3. Optional fields handling
 * 4. Array transformations
 */
import { describe, it, expect } from 'vitest';
import {
  toDomain as projectToDomain,
  toDB as projectToDB,
  createDBProject,
  toDomainArray as projectToDomainArray,
} from '../adapters/project-adapter';
import {
  toDomain as scriptToDomain,
  toDB as scriptToDB,
  createDBScript,
  toDomainArray as scriptToDomainArray,
} from '../adapters/script-adapter';
import {
  toDomain as sceneToDomain,
  toDB as sceneToDB,
  createDBScene,
  toDomainArray as sceneToDomainArray,
} from '../adapters/scene-adapter';
import {
  toDomain as shotToDomain,
  toDB as shotToDB,
  createDBShot,
  toDomainArray as shotToDomainArray,
} from '../adapters/shot-adapter';
import {
  toDomain as storyboardToDomain,
  toDB as storyboardToDB,
  createDBStoryboard,
  toDomainArray as storyboardToDomainArray,
} from '../adapters/storyboard-adapter';
import {
  toDomain as characterToDomain,
  toDB as characterToDB,
  createDBCharacter,
  toDomainArray as characterToDomainArray,
} from '../adapters/character-adapter';
import {
  toDomain as commentToDomain,
  toDB as commentToDB,
  createDBComment,
  toDomainArray as commentToDomainArray,
} from '../adapters/comment-adapter';
import {
  toDomain as versionToDomain,
  toDB as versionToDB,
  createDBVersion,
  toDomainArray as versionToDomainArray,
} from '../adapters/version-adapter';
import type {
  Project,
  DBProject,
  ProjectData,
  ScriptData,
  DBShot,
  ShotData,
  DBStoryboard,
  StoryboardData,
  DBCharacter,
  CharacterData,
  DBComment,
  CommentData,
  DBVersion,
  VersionData,
} from '@/types';

describe('Project Adapter', () => {
  const testProjectData: ProjectData = {
    name: 'Test Film',
    visualStyle: 'cinematic',
    colorPalette: ['#ff0000', '#00ff00'],
    tone: 'dramatic',
  };

  it('creates a DBProject from ProjectData', () => {
    const id = crypto.randomUUID();
    const dbProject = createDBProject(id, testProjectData);

    expect(dbProject.id).toBe(id);
    expect(dbProject.name).toBe('Test Film');
    expect(dbProject.visualStyle).toBe('cinematic');
    expect(dbProject.colorPalette).toEqual(['#ff0000', '#00ff00']);
    expect(dbProject.tone).toBe('dramatic');
    expect(dbProject.syncStatus).toBe('pending');
    expect(dbProject.createdAt).toBeDefined();
    expect(dbProject.updatedAt).toBeDefined();
  });

  it('transforms DBProject to Project with Date objects', () => {
    const dbProject: DBProject = {
      id: 'test-id',
      name: 'Test',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T12:00:00.000Z',
      visualStyle: 'noir',
      colorPalette: [],
      tone: 'dark',
      syncStatus: 'synced',
      lastSyncedAt: '2024-01-15T11:00:00.000Z',
    };

    const project = projectToDomain(dbProject);

    expect(project.id).toBe('test-id');
    expect(project.name).toBe('Test');
    expect(project.createdAt).toBeInstanceOf(Date);
    expect(project.createdAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    expect(project.updatedAt.toISOString()).toBe('2024-01-15T12:00:00.000Z');
    expect(project.lastSyncedAt).toBeInstanceOf(Date);
    expect(project.lastSyncedAt?.toISOString()).toBe('2024-01-15T11:00:00.000Z');
  });

  it('transforms Project to DBProject with ISO strings', () => {
    const project: Project = {
      id: 'test-id',
      name: 'Test',
      createdAt: new Date('2024-01-15T10:30:00.000Z'),
      updatedAt: new Date('2024-01-15T12:00:00.000Z'),
      visualStyle: 'noir',
      colorPalette: [],
      tone: 'dark',
      syncStatus: 'synced',
      lastSyncedAt: new Date('2024-01-15T11:00:00.000Z'),
    };

    const dbProject = projectToDB(project);

    expect(dbProject.createdAt).toBe('2024-01-15T10:30:00.000Z');
    expect(dbProject.updatedAt).toBe('2024-01-15T12:00:00.000Z');
    expect(dbProject.lastSyncedAt).toBe('2024-01-15T11:00:00.000Z');
  });

  it('round-trips Project data correctly', () => {
    const id = crypto.randomUUID();
    const dbProject = createDBProject(id, testProjectData);
    const domain = projectToDomain(dbProject);
    const backToDB = projectToDB(domain);

    expect(backToDB.id).toBe(dbProject.id);
    expect(backToDB.name).toBe(dbProject.name);
    expect(backToDB.visualStyle).toBe(dbProject.visualStyle);
    expect(backToDB.colorPalette).toEqual(dbProject.colorPalette);
    expect(backToDB.tone).toBe(dbProject.tone);
    expect(backToDB.syncStatus).toBe(dbProject.syncStatus);
  });

  it('handles optional lastSyncedAt as undefined', () => {
    const dbProject: DBProject = {
      id: 'test-id',
      name: 'Test',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T12:00:00.000Z',
      visualStyle: 'noir',
      colorPalette: [],
      tone: 'dark',
      syncStatus: 'pending',
    };

    const project = projectToDomain(dbProject);
    expect(project.lastSyncedAt).toBeUndefined();
  });

  it('transforms array of DBProjects', () => {
    const dbProjects: DBProject[] = [
      createDBProject(crypto.randomUUID(), testProjectData),
      createDBProject(crypto.randomUUID(), { ...testProjectData, name: 'Film 2' }),
    ];

    const projects = projectToDomainArray(dbProjects);
    expect(projects).toHaveLength(2);
    expect(projects[0]).toHaveProperty('createdAt');
    expect(projects[0].createdAt).toBeInstanceOf(Date);
    expect(projects[1]!.name).toBe('Film 2');
  });
});

describe('Script Adapter', () => {
  const testScriptData: ScriptData = {
    fountainText: 'INT. OFFICE - DAY\n\nAction line.',
    format: 'fountain',
  };

  it('creates a DBScript from ScriptData', () => {
    const id = crypto.randomUUID();
    const projectId = crypto.randomUUID();
    const dbScript = createDBScript(id, projectId, testScriptData);

    expect(dbScript.id).toBe(id);
    expect(dbScript.projectId).toBe(projectId);
    expect(dbScript.fountainText).toBe(testScriptData.fountainText);
    expect(dbScript.format).toBe('fountain');
    expect(dbScript.createdAt).toBeDefined();
  });

  it('round-trips Script data correctly', () => {
    const id = crypto.randomUUID();
    const projectId = crypto.randomUUID();
    const dbScript = createDBScript(id, projectId, testScriptData);
    const domain = scriptToDomain(dbScript);
    const backToDB = scriptToDB(domain);

    expect(backToDB.id).toBe(dbScript.id);
    expect(backToDB.projectId).toBe(dbScript.projectId);
    expect(backToDB.fountainText).toBe(dbScript.fountainText);
    expect(backToDB.format).toBe(dbScript.format);
  });

  it('transforms array of DBScripts', () => {
    const scripts = [
      createDBScript(crypto.randomUUID(), crypto.randomUUID(), testScriptData),
      createDBScript(crypto.randomUUID(), crypto.randomUUID(), testScriptData),
    ];

    const domain = scriptToDomainArray(scripts);
    expect(domain).toHaveLength(2);
    expect(domain[0]!.createdAt).toBeInstanceOf(Date);
  });
});

describe('Scene Adapter', () => {
  const testSceneData: SceneData = {
    heading: 'INT. OFFICE - DAY',
    location: 'OFFICE',
    interior: true,
    timeOfDay: 'DAY',
  };

  it('creates a DBScene from SceneData', () => {
    const id = crypto.randomUUID();
    const scriptId = crypto.randomUUID();
    const order = 1;
    const dbScene = createDBScene(id, scriptId, order, testSceneData);

    expect(dbScene.id).toBe(id);
    expect(dbScene.scriptId).toBe(scriptId);
    expect(dbScene.order).toBe(1);
    expect(dbScene.heading).toBe('INT. OFFICE - DAY');
    expect(dbScene.interior).toBe(true);
    expect(dbScene.timeOfDay).toBe('DAY');
  });

  it('round-trips Scene data correctly', () => {
    const id = crypto.randomUUID();
    const scriptId = crypto.randomUUID();
    const dbScene = createDBScene(id, scriptId, 1, testSceneData);
    const domain = sceneToDomain(dbScene);
    const backToDB = sceneToDB(domain);

    expect(backToDB.id).toBe(dbScene.id);
    expect(backToDB.scriptId).toBe(dbScene.scriptId);
    expect(backToDB.order).toBe(dbScene.order);
    expect(backToDB.heading).toBe(dbScene.heading);
    expect(backToDB.location).toBe(dbScene.location);
    expect(backToDB.interior).toBe(dbScene.interior);
    expect(backToDB.timeOfDay).toBe(dbScene.timeOfDay);
  });

  it('transforms array of DBScenes', () => {
    const scenes = [
      createDBScene(crypto.randomUUID(), crypto.randomUUID(), 1, testSceneData),
      createDBScene(crypto.randomUUID(), crypto.randomUUID(), 2, { ...testSceneData, timeOfDay: 'NIGHT' }),
    ];

    const domain = sceneToDomainArray(scenes);
    expect(domain).toHaveLength(2);
    expect(domain[0]!.createdAt).toBeInstanceOf(Date);
    expect(domain[1]!.timeOfDay).toBe('NIGHT');
  });
});

describe('Shot Adapter', () => {
  const testShotData: ShotData = {
    type: 'close-up',
    angle: 'high-angle',
    movement: 'pan',
    charactersInFrame: ['JOHN', 'SARAH'],
    actionDescription: 'John looks at Sarah',
    duration: 10,
    notes: 'Important emotional beat',
  };

  it('creates a DBShot from ShotData', () => {
    const id = crypto.randomUUID();
    const sceneId = crypto.randomUUID();
    const shotNumber = 1;
    const dbShot = createDBShot(id, sceneId, shotNumber, testShotData);

    expect(dbShot.id).toBe(id);
    expect(dbShot.sceneId).toBe(sceneId);
    expect(dbShot.shotNumber).toBe(1);
    expect(dbShot.type).toBe('close-up');
    expect(dbShot.angle).toBe('high-angle');
    expect(dbShot.movement).toBe('pan');
    expect(dbShot.charactersInFrame).toEqual(['JOHN', 'SARAH']);
    expect(dbShot.confirmed).toBe(false); // CRITICAL: always false on creation
    expect(dbShot.confirmedAt).toBeUndefined();
  });

  it('round-trips Shot data correctly', () => {
    const dbShot: DBShot = {
      id: crypto.randomUUID(),
      sceneId: crypto.randomUUID(),
      shotNumber: 1,
      type: 'medium',
      angle: 'eye-level',
      movement: 'static',
      charactersInFrame: ['JOHN'],
      actionDescription: 'Test action',
      duration: 5,
      notes: 'Test note',
      confirmed: true,
      confirmedAt: '2024-01-15T10:00:00.000Z',
      createdAt: '2024-01-15T09:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z',
    };

    const domain = shotToDomain(dbShot);
    const backToDB = shotToDB(domain);

    expect(backToDB.id).toBe(dbShot.id);
    expect(backToDB.sceneId).toBe(dbShot.sceneId);
    expect(backToDB.shotNumber).toBe(dbShot.shotNumber);
    expect(backToDB.type).toBe(dbShot.type);
    expect(backToDB.confirmed).toBe(dbShot.confirmed);
    expect(backToDB.confirmedAt).toBe(dbShot.confirmedAt);
  });

  it('handles optional fields (notes, confirmedAt)', () => {
    const dbShot: DBShot = {
      id: crypto.randomUUID(),
      sceneId: crypto.randomUUID(),
      shotNumber: 1,
      type: 'wide',
      angle: 'eye-level',
      movement: 'static',
      charactersInFrame: [],
      actionDescription: 'Test',
      duration: 5,
      confirmed: false,
      createdAt: '2024-01-15T09:00:00.000Z',
      updatedAt: '2024-01-15T09:00:00.000Z',
    };

    const domain = shotToDomain(dbShot);
    expect(domain.notes).toBeUndefined();
    expect(domain.confirmedAt).toBeUndefined();
  });

  it('transforms confirmedAt Date correctly', () => {
    const dbShot: DBShot = {
      id: crypto.randomUUID(),
      sceneId: crypto.randomUUID(),
      shotNumber: 1,
      type: 'wide',
      angle: 'eye-level',
      movement: 'static',
      charactersInFrame: [],
      actionDescription: 'Test',
      duration: 5,
      confirmed: true,
      confirmedAt: '2024-01-15T10:30:00.000Z',
      createdAt: '2024-01-15T09:00:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    };

    const domain = shotToDomain(dbShot);
    expect(domain.confirmedAt).toBeInstanceOf(Date);
    expect(domain.confirmedAt?.toISOString()).toBe('2024-01-15T10:30:00.000Z');
  });

  it('transforms array of DBShots', () => {
    const shots = [
      createDBShot(crypto.randomUUID(), crypto.randomUUID(), 1, testShotData),
      createDBShot(crypto.randomUUID(), crypto.randomUUID(), 2, testShotData),
    ];

    const domain = shotToDomainArray(shots);
    expect(domain).toHaveLength(2);
    expect(domain[0]!.createdAt).toBeInstanceOf(Date);
  });
});

describe('Storyboard Adapter', () => {
  const testStoryboardData: StoryboardData = {
    imageUrl: 'https://example.com/image.png',
    generationParams: {
      prompt: 'A dramatic scene',
      width: 1024,
      height: 768,
      seed: 12345,
    },
    apiProvider: 'sdxl',
    cost: 0.002,
    style: 'pencil-sketch',
    refinementPrompt: 'Make it darker',
  };

  it('creates a DBStoryboard from StoryboardData', () => {
    const id = crypto.randomUUID();
    const shotId = crypto.randomUUID();
    const dbStoryboard = createDBStoryboard(id, shotId, testStoryboardData);

    expect(dbStoryboard.id).toBe(id);
    expect(dbStoryboard.shotId).toBe(shotId);
    expect(dbStoryboard.imageUrl).toBe('https://example.com/image.png');
    expect(dbStoryboard.version).toBe(1);
    expect(dbStoryboard.previousVersions).toEqual([]);
    expect(dbStoryboard.generationParams.prompt).toBe('A dramatic scene');
  });

  it('round-trips Storyboard data correctly', () => {
    const dbStoryboard: DBStoryboard = {
      id: crypto.randomUUID(),
      shotId: crypto.randomUUID(),
      imageUrl: 'https://example.com/test.png',
      generatedAt: '2024-01-15T10:00:00.000Z',
      generationParams: {
        prompt: 'Test prompt',
        width: 512,
        height: 512,
      },
      apiProvider: 'wanxiang',
      cost: 0.001,
      style: 'ink-drawing',
      version: 2,
      previousVersions: [
        {
          version: 1,
          imageUrl: 'https://example.com/old.png',
          generatedAt: '2024-01-14T10:00:00.000Z',
        },
      ],
      refinementPrompt: 'Updated prompt',
    };

    const domain = storyboardToDomain(dbStoryboard);
    const backToDB = storyboardToDB(domain);

    expect(backToDB.id).toBe(dbStoryboard.id);
    expect(backToDB.shotId).toBe(dbStoryboard.shotId);
    expect(backToDB.version).toBe(dbStoryboard.version);
    expect(backToDB.previousVersions).toHaveLength(1);
    expect(backToDB.previousVersions[0]!.version).toBe(1);
  });

  it('transforms previousVersions dates correctly', () => {
    const dbStoryboard: DBStoryboard = {
      id: crypto.randomUUID(),
      shotId: crypto.randomUUID(),
      imageUrl: 'https://example.com/test.png',
      generatedAt: '2024-01-15T10:00:00.000Z',
      generationParams: { prompt: 'Test', width: 512, height: 512 },
      apiProvider: 'sdxl',
      cost: 0.001,
      style: 'pencil-sketch',
      version: 2,
      previousVersions: [
        {
          version: 1,
          imageUrl: 'https://example.com/old.png',
          generatedAt: '2024-01-14T10:00:00.000Z',
          refinementPrompt: 'First version',
        },
      ],
    };

    const domain = storyboardToDomain(dbStoryboard);
    expect(domain.generatedAt).toBeInstanceOf(Date);
    expect(domain.previousVersions[0]!.generatedAt).toBeInstanceOf(Date);
  });

  it('transforms array of DBStoryboards', () => {
    const storyboards = [
      createDBStoryboard(crypto.randomUUID(), crypto.randomUUID(), testStoryboardData),
      createDBStoryboard(crypto.randomUUID(), crypto.randomUUID(), testStoryboardData),
    ];

    const domain = storyboardToDomainArray(storyboards);
    expect(domain).toHaveLength(2);
    expect(domain[0]!.generatedAt).toBeInstanceOf(Date);
  });
});

describe('Character Adapter', () => {
  const testCharacterData: CharacterData = {
    name: 'JOHN',
    description: 'The protagonist',
    color: '#ff6b6b',
    avatarUrl: 'https://example.com/john.png',
  };

  it('creates a DBCharacter from CharacterData', () => {
    const id = crypto.randomUUID();
    const projectId = crypto.randomUUID();
    const dbCharacter = createDBCharacter(id, projectId, testCharacterData);

    expect(dbCharacter.id).toBe(id);
    expect(dbCharacter.projectId).toBe(projectId);
    expect(dbCharacter.name).toBe('JOHN');
    expect(dbCharacter.description).toBe('The protagonist');
    expect(dbCharacter.color).toBe('#ff6b6b');
    expect(dbCharacter.avatarUrl).toBe('https://example.com/john.png');
  });

  it('round-trips Character data correctly', () => {
    const dbCharacter: DBCharacter = {
      id: crypto.randomUUID(),
      projectId: crypto.randomUUID(),
      name: 'SARAH',
      description: 'The love interest',
      color: '#4ecdc4',
      avatarUrl: 'https://example.com/sarah.png',
      createdAt: '2024-01-15T10:00:00.000Z',
    };

    const domain = characterToDomain(dbCharacter);
    const backToDB = characterToDB(domain);

    expect(backToDB.id).toBe(dbCharacter.id);
    expect(backToDB.projectId).toBe(dbCharacter.projectId);
    expect(backToDB.name).toBe(dbCharacter.name);
    expect(backToDB.description).toBe(dbCharacter.description);
    expect(backToDB.color).toBe(dbCharacter.color);
  });

  it('handles optional fields (description, avatarUrl)', () => {
    const dbCharacter: DBCharacter = {
      id: crypto.randomUUID(),
      projectId: crypto.randomUUID(),
      name: 'BOB',
      color: '#95e1d3',
      createdAt: '2024-01-15T10:00:00.000Z',
    };

    const domain = characterToDomain(dbCharacter);
    expect(domain.description).toBeUndefined();
    expect(domain.avatarUrl).toBeUndefined();
  });

  it('transforms array of DBCharacters', () => {
    const characters = [
      createDBCharacter(crypto.randomUUID(), crypto.randomUUID(), testCharacterData),
      createDBCharacter(crypto.randomUUID(), crypto.randomUUID(), { ...testCharacterData, name: 'SARAH' }),
    ];

    const domain = characterToDomainArray(characters);
    expect(domain).toHaveLength(2);
    expect(domain[0]!.createdAt).toBeInstanceOf(Date);
  });
});

describe('Comment Adapter', () => {
  const testCommentData: CommentData = {
    entityType: 'shot',
    entityId: crypto.randomUUID(),
    content: 'Great composition!',
    author: 'Director',
  };

  it('creates a DBComment from CommentData', () => {
    const id = crypto.randomUUID();
    const dbComment = createDBComment(id, testCommentData);

    expect(dbComment.id).toBe(id);
    expect(dbComment.entityType).toBe('shot');
    expect(dbComment.entityId).toBe(testCommentData.entityId);
    expect(dbComment.content).toBe('Great composition!');
    expect(dbComment.author).toBe('Director');
  });

  it('round-trips Comment data correctly', () => {
    const dbComment: DBComment = {
      id: crypto.randomUUID(),
      entityType: 'scene',
      entityId: crypto.randomUUID(),
      content: 'Need more tension here',
      author: 'Producer',
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T12:00:00.000Z',
    };

    const domain = commentToDomain(dbComment);
    const backToDB = commentToDB(domain);

    expect(backToDB.id).toBe(dbComment.id);
    expect(backToDB.entityType).toBe(dbComment.entityType);
    expect(backToDB.entityId).toBe(dbComment.entityId);
    expect(backToDB.content).toBe(dbComment.content);
    expect(backToDB.author).toBe(dbComment.author);
  });

  it('supports all entity types', () => {
    const entityTypes: Array<'project' | 'scene' | 'shot' | 'storyboard'> = [
      'project',
      'scene',
      'shot',
      'storyboard',
    ];

    entityTypes.forEach((entityType) => {
      const dbComment: DBComment = {
        id: crypto.randomUUID(),
        entityType,
        entityId: crypto.randomUUID(),
        content: `Comment on ${entityType}`,
        author: 'Test',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      };

      const domain = commentToDomain(dbComment);
      expect(domain.entityType).toBe(entityType);
    });
  });

  it('transforms array of DBComments', () => {
    const comments = [
      createDBComment(crypto.randomUUID(), testCommentData),
      createDBComment(crypto.randomUUID(), { ...testCommentData, content: 'Another comment' }),
    ];

    const domain = commentToDomainArray(comments);
    expect(domain).toHaveLength(2);
    expect(domain[0]!.createdAt).toBeInstanceOf(Date);
  });
});

describe('Version Adapter', () => {
  const testVersionData: VersionData = {
    entityType: 'shot-list',
    entityId: crypto.randomUUID(),
    snapshot: JSON.stringify({ shots: [] }),
  };

  it('creates a DBVersion from VersionData', () => {
    const id = crypto.randomUUID();
    const projectId = crypto.randomUUID();
    const dbVersion = createDBVersion(id, projectId, testVersionData);

    expect(dbVersion.id).toBe(id);
    expect(dbVersion.projectId).toBe(projectId);
    expect(dbVersion.entityType).toBe('shot-list');
    expect(dbVersion.snapshot).toBe(testVersionData.snapshot);
  });

  it('round-trips Version data correctly', () => {
    const dbVersion: DBVersion = {
      id: crypto.randomUUID(),
      projectId: crypto.randomUUID(),
      entityType: 'script',
      entityId: crypto.randomUUID(),
      snapshot: JSON.stringify({ fountainText: 'INT. TEST' }),
      createdAt: '2024-01-15T10:00:00.000Z',
    };

    const domain = versionToDomain(dbVersion);
    const backToDB = versionToDB(domain);

    expect(backToDB.id).toBe(dbVersion.id);
    expect(backToDB.projectId).toBe(dbVersion.projectId);
    expect(backToDB.entityType).toBe(dbVersion.entityType);
    expect(backToDB.snapshot).toBe(dbVersion.snapshot);
  });

  it('supports both entity types', () => {
    const entityTypes: Array<'script' | 'shot-list'> = ['script', 'shot-list'];

    entityTypes.forEach((entityType) => {
      const dbVersion: DBVersion = {
        id: crypto.randomUUID(),
        projectId: crypto.randomUUID(),
        entityType,
        entityId: crypto.randomUUID(),
        snapshot: '{}',
        createdAt: '2024-01-15T10:00:00.000Z',
      };

      const domain = versionToDomain(dbVersion);
      expect(domain.entityType).toBe(entityType);
      expect(domain.createdAt).toBeInstanceOf(Date);
    });
  });

  it('transforms array of DBVersions', () => {
    const versions = [
      createDBVersion(crypto.randomUUID(), crypto.randomUUID(), testVersionData),
      createDBVersion(crypto.randomUUID(), crypto.randomUUID(), { ...testVersionData, entityType: 'script' }),
    ];

    const domain = versionToDomainArray(versions);
    expect(domain).toHaveLength(2);
    expect(domain[0]!.createdAt).toBeInstanceOf(Date);
  });
});
