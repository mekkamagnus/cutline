# Chore: Phase 2 - Data Layer Implementation

## Chore Description

Implement the Type System & Data Layer for Cutline according to `prd.json` acceptance criteria. This phase focuses on completing the repository pattern for all entities and ensuring proper DB ↔ Domain type transformations.

## Acceptance Criteria (from prd.json)

```yaml
phase2_dataLayer:
  2.1: Dexie database schema with all tables
  2.2: Shots indexed by sceneId and confirmed state
  2.3: Repository pattern for all entities
  2.4: ShotRepository with confirmation state management
  2.5: DB ↔ Domain type transformations
```

## Current Status

| Criteria | Status | Evidence |
|----------|--------|----------|
| 2.1 Dexie database schema | ✅ COMPLETE | `db.ts` has all 8 tables |
| 2.2 Shots indexed by sceneId/confirmed | ✅ COMPLETE | `db.ts` line 51: `'id, sceneId, shotNumber, confirmed, [sceneId+shotNumber]'` |
| 2.3 Repository pattern for all entities | ⏳ PARTIAL | Only ShotRepository exists |
| 2.4 ShotRepository with confirmation | ✅ COMPLETE | `shot-repository.ts` has confirmAll/unlockAll |
| 2.5 DB ↔ Domain transformations | ⏳ PARTIAL | Only shot-adapter.ts exists |

## Relevant Files

### Existing Files
- `app/client/src/services/db.ts` - Dexie database schema (complete)
- `app/client/src/services/repositories/shot-repository.ts` - Shot repository (complete)
- `app/client/src/services/adapters/shot-adapter.ts` - Shot transformations (complete)
- `app/client/src/services/shot-service.ts` - Shot domain service (complete)
- `app/client/src/services/confirmation-service.ts` - Confirmation workflow (complete)
- `app/client/src/types/index.ts` - Domain and DB types (complete)
- `app/client/src/test-utils/index.ts` - Test helpers (complete)

### New Files to Create
- `app/client/src/services/repositories/project-repository.ts`
- `app/client/src/services/repositories/script-repository.ts`
- `app/client/src/services/repositories/scene-repository.ts`
- `app/client/src/services/repositories/storyboard-repository.ts`
- `app/client/src/services/repositories/character-repository.ts`
- `app/client/src/services/repositories/comment-repository.ts`
- `app/client/src/services/repositories/version-repository.ts`
- `app/client/src/services/repositories/index.ts` (barrel export)
- `app/client/src/services/adapters/project-adapter.ts`
- `app/client/src/services/adapters/script-adapter.ts`
- `app/client/src/services/adapters/scene-adapter.ts`
- `app/client/src/services/adapters/storyboard-adapter.ts`
- `app/client/src/services/adapters/character-adapter.ts`
- `app/client/src/services/adapters/comment-adapter.ts`
- `app/client/src/services/adapters/version-adapter.ts`
- `app/client/src/services/adapters/index.ts` (barrel export)
- `app/client/src/services/__tests__/repositories.test.ts`
- `app/client/src/services/__tests__/adapters.test.ts`

## Step by Step Tasks

### Step 1: Create Adapters for All Entities

Create DB ↔ Domain transformation adapters following the pattern established in `shot-adapter.ts`.

#### 1.1 Create `adapters/project-adapter.ts`
- [ ] `toDomain(dbProject: DBProject): Project`
- [ ] `toDB(project: Project): DBProject`
- [ ] `createDBProject(id: string, data: ProjectData): DBProject`
- [ ] `toDomainArray(dbProjects: DBProject[]): Project[]`

#### 1.2 Create `adapters/script-adapter.ts`
- [ ] `toDomain(dbScript: DBScript): Script`
- [ ] `toDB(script: Script): DBScript`
- [ ] `createDBScript(id: string, projectId: string, data: ScriptData): DBScript`
- [ ] `toDomainArray(dbScripts: DBScript[]): Script[]`

#### 1.3 Create `adapters/scene-adapter.ts`
- [ ] `toDomain(dbScene: DBScene): Scene`
- [ ] `toDB(scene: Scene): DBScene`
- [ ] `createDBScene(id: string, scriptId: string, order: number, data: SceneData): DBScene`
- [ ] `toDomainArray(dbScenes: DBScene[]): Scene[]`

#### 1.4 Create `adapters/storyboard-adapter.ts`
- [ ] `toDomain(dbStoryboard: DBStoryboard): StoryboardPanel`
- [ ] `toDB(storyboard: StoryboardPanel): DBStoryboard`
- [ ] `createDBStoryboard(id: string, shotId: string, data: StoryboardData): DBStoryboard`
- [ ] `toDomainArray(dbStoryboards: DBStoryboard[]): StoryboardPanel[]`

#### 1.5 Create `adapters/character-adapter.ts`
- [ ] `toDomain(dbCharacter: DBCharacter): Character`
- [ ] `toDB(character: Character): DBCharacter`
- [ ] `createDBCharacter(id: string, projectId: string, name: string): DBCharacter`
- [ ] `toDomainArray(dbCharacters: DBCharacter[]): Character[]`

#### 1.6 Create `adapters/comment-adapter.ts`
- [ ] `toDomain(dbComment: DBComment): Comment`
- [ ] `toDB(comment: Comment): DBComment`
- [ ] `createDBComment(id: string, data: CommentData): DBComment`
- [ ] `toDomainArray(dbComments: DBComment[]): Comment[]`

#### 1.7 Create `adapters/version-adapter.ts`
- [ ] `toDomain(dbVersion: DBVersion): Version`
- [ ] `toDB(version: Version): DBVersion`
- [ ] `createDBVersion(id: string, data: VersionData): DBVersion`
- [ ] `toDomainArray(dbVersions: DBVersion[]): Version[]`

#### 1.8 Create `adapters/index.ts` barrel export
- [ ] Export all adapters

### Step 2: Create Repositories for All Entities

Create repository classes following the pattern established in `shot-repository.ts`.

#### 2.1 Create `repositories/project-repository.ts`
- [ ] `findById(id: string): AsyncResult<AppError, Project | null>`
- [ ] `findAll(): AsyncResult<AppError, Project[]>`
- [ ] `findByName(name: string): AsyncResult<AppError, Project | null>`
- [ ] `create(data: ProjectData): AsyncResult<AppError, Project>`
- [ ] `update(id: string, data: Partial<ProjectData>): AsyncResult<AppError, Project>`
- [ ] `delete(id: string): AsyncResult<AppError, void>`

#### 2.2 Create `repositories/script-repository.ts`
- [ ] `findById(id: string): AsyncResult<AppError, Script | null>`
- [ ] `findByProjectId(projectId: string): AsyncResult<AppError, Script | null>`
- [ ] `create(projectId: string, data: ScriptData): AsyncResult<AppError, Script>`
- [ ] `update(id: string, data: Partial<ScriptData>): AsyncResult<AppError, Script>`
- [ ] `delete(id: string): AsyncResult<AppError, void>`

#### 2.3 Create `repositories/scene-repository.ts`
- [ ] `findById(id: string): AsyncResult<AppError, Scene | null>`
- [ ] `findByScriptId(scriptId: string): AsyncResult<AppError, Scene[]>`
- [ ] `create(scriptId: string, data: SceneData): AsyncResult<AppError, Scene>`
- [ ] `update(id: string, data: Partial<SceneData>): AsyncResult<AppError, Scene>`
- [ ] `delete(id: string): AsyncResult<AppError, void>`
- [ ] `reorder(scriptId: string, sceneOrders: { id: string; order: number }[]): AsyncResult<AppError, void>`

#### 2.4 Create `repositories/storyboard-repository.ts`
- [ ] `findById(id: string): AsyncResult<AppError, StoryboardPanel | null>`
- [ ] `findByShotId(shotId: string): AsyncResult<AppError, StoryboardPanel | null>`
- [ ] `create(shotId: string, data: StoryboardData): AsyncResult<AppError, StoryboardPanel>`
- [ ] `update(id: string, data: Partial<StoryboardData>): AsyncResult<AppError, StoryboardPanel>`
- [ ] `delete(id: string): AsyncResult<AppError, void>`
- [ ] `addVersion(id: string, version: StoryboardPanelVersion): AsyncResult<AppError, void>`

#### 2.5 Create `repositories/character-repository.ts`
- [ ] `findById(id: string): AsyncResult<AppError, Character | null>`
- [ ] `findByProjectId(projectId: string): AsyncResult<AppError, Character[]>`
- [ ] `findByName(projectId: string, name: string): AsyncResult<AppError, Character | null>`
- [ ] `create(projectId: string, data: CharacterData): AsyncResult<AppError, Character>`
- [ ] `update(id: string, data: Partial<CharacterData>): AsyncResult<AppError, Character>`
- [ ] `delete(id: string): AsyncResult<AppError, void>`

#### 2.6 Create `repositories/comment-repository.ts`
- [ ] `findById(id: string): AsyncResult<AppError, Comment | null>`
- [ ] `findByEntity(entityType: string, entityId: string): AsyncResult<AppError, Comment[]>`
- [ ] `create(data: CommentData): AsyncResult<AppError, Comment>`
- [ ] `update(id: string, content: string): AsyncResult<AppError, Comment>`
- [ ] `delete(id: string): AsyncResult<AppError, void>`

#### 2.7 Create `repositories/version-repository.ts`
- [ ] `findById(id: string): AsyncResult<AppError, Version | null>`
- [ ] `findByProject(projectId: string): AsyncResult<AppError, Version[]>`
- [ ] `create(data: VersionData): AsyncResult<AppError, Version>`
- [ ] `delete(id: string): AsyncResult<AppError, void>`

#### 2.8 Create `repositories/index.ts` barrel export
- [ ] Export all repositories

### Step 3: Update Services Index

#### 3.1 Update `services/index.ts`
- [ ] Add exports for all new repositories
- [ ] Add exports for all adapters

### Step 4: Create Tests

#### 4.1 Create `__tests__/adapters.test.ts`
- [ ] Test toDomain/toDB round-trip for each entity type
- [ ] Test date serialization (Date ↔ ISO string)
- [ ] Test optional fields handling

#### 4.2 Create `__tests__/repositories.test.ts`
- [ ] Test CRUD operations for each repository
- [ ] Test indexed queries (findByProjectId, findByScriptId, etc.)
- [ ] Test error handling (not found, validation errors)

### Step 5: Add Missing Type Definitions

#### 5.1 Update `types/index.ts`
- [ ] Add `ProjectData` type (for creation)
- [ ] Add `ScriptData` type
- [ ] Add `SceneData` type
- [ ] Add `StoryboardData` type
- [ ] Add `CharacterData` type
- [ ] Add `CommentData` type
- [ ] Add `VersionData` type

## Validation Commands

```bash
# Type check
cd app/client && npm run type-check

# Run all tests
cd app/client && npm test -- --run

# Run specific test files
cd app/client && npm test -- --run src/services/__tests__/adapters.test.ts
cd app/client && npm test -- --run src/services/__tests__/repositories.test.ts
cd app/client && npm test -- --run src/services/__tests__/db.test.ts
cd app/client && npm test -- --run src/services/__tests__/confirmation-service.test.ts

# Verify test count (should be > 200)
cd app/client && npm test -- --run 2>&1 | grep "Tests"
```

## Notes

1. **FP Pattern**: All repositories must use `AsyncResult` from `@/lib/fp` for error handling
2. **Date Handling**: DB stores dates as ISO strings, domain uses Date objects
3. **Barrel Exports**: Use index.ts files for clean imports
4. **Test Coverage**: Target 80%+ coverage for new code
5. **Existing Pattern**: Follow `shot-repository.ts` and `shot-adapter.ts` as templates

## Progress Tracking

Mark items as complete by changing `[ ]` to `[x]` as they are implemented.
