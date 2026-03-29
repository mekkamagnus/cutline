# Feature: Complete All MVP Phases

## Feature Description

Complete all remaining phases of the Cutline MVP to deliver a fully functional script-to-storyboard platform. This includes the data layer, state management, script editor, shot list editor, confirmation workflow, and AI storyboard generation - implementing the shot-list-first paradigm.

## User Story

As a filmmaker,
I want to transform my Fountain scripts into visual storyboards through a structured shot-list workflow,
So that I can plan my shots precisely and generate AI storyboards that match my creative vision.

## Problem Statement

Cutline currently has foundation infrastructure (Phase 1) but lacks the core functionality needed for the MVP workflow:
- Script parsing and editing is not implemented
- Shot list management is incomplete (missing UI)
- Storyboard generation is not connected to the confirmation workflow
- State management and data fetching are not set up

## Solution Statement

Complete all phases in sequence, building on the existing foundation to deliver the complete shot-list-first workflow: Script → Shot List → Confirmation → Storyboard Generation.

---

## Progress Tracking

**IMPORTANT**: As each task is completed, you MUST:

1. **Update `specs/progress.txt`** - Mark the task as complete with timestamp
2. **Update `prd.json`** - Change the corresponding criterion status from `pending` to `passed` with evidence
3. **Commit changes** - Make a git commit after each major milestone (at minimum, once per phase section)

### Progress File Format (`specs/progress.txt`)

```text
# Cutline MVP Progress Log

## Phase 2: Data Layer
- [x] 2.1 Project adapter and repository - 2024-XX-XX
- [x] 2.2 Scene adapter and repository - 2024-XX-XX
...

## Phase 3: State Management
- [ ] 3.1 Zustand stores - IN PROGRESS
...
```

### PRD Update Format

In `prd.json`, update `acceptanceCriteria` sections:
```json
{
  "id": "2.1",
  "item": "Dexie database schema with all tables",
  "status": "passed",
  "evidence": "db.ts has all 8 tables: projects, scripts, scenes, shots, storyboards, characters, comments, versions"
}
```

### Commit Strategy

Commit after each subsection (e.g., after 2.1, after 2.2, etc.) with format:
```
feat(phase2): complete project adapter and repository

- Add project-adapter.ts with toDomain, toDB transformations
- Add project-repository.ts with CRUD operations
- Add ProjectData type to types/index.ts
- Update prd.json: 2.1 -> passed
```

---

## Relevant Files

### Existing Files (Foundation - Complete)
- `app/client/src/types/index.ts` - Domain and DB types
- `app/client/src/lib/fp/*.ts` - FP facade (Option, Result, AsyncResult)
- `app/client/src/services/db.ts` - Dexie database schema
- `app/client/src/services/repositories/shot-repository.ts` - Shot data access
- `app/client/src/services/adapters/shot-adapter.ts` - Shot transformations
- `app/client/src/services/shot-service.ts` - Shot business logic
- `app/client/src/services/confirmation-service.ts` - Confirmation workflow
- `app/client/src/stores/*.ts` - Zustand stores (partial)
- `app/client/src/test-utils/index.ts` - Test helpers

### Progress Tracking Files
- `specs/progress.txt` - Detailed progress log (create if not exists)
- `prd.json` - Product requirements with acceptance criteria

### Existing Files (To Extend)
- `app/client/src/services/index.ts` - Services barrel export
- `app/client/src/App.tsx` - Main app routing
- `app/server/src/index.ts` - Backend server

### New Files to Create

#### Phase 2: Data Layer Completion
- `app/client/src/services/repositories/project-repository.ts`
- `app/client/src/services/repositories/script-repository.ts`
- `app/client/src/services/repositories/scene-repository.ts`
- `app/client/src/services/repositories/storyboard-repository.ts`
- `app/client/src/services/repositories/character-repository.ts`
- `app/client/src/services/repositories/comment-repository.ts`
- `app/client/src/services/repositories/version-repository.ts`
- `app/client/src/services/repositories/index.ts`
- `app/client/src/services/adapters/project-adapter.ts`
- `app/client/src/services/adapters/script-adapter.ts`
- `app/client/src/services/adapters/scene-adapter.ts`
- `app/client/src/services/adapters/storyboard-adapter.ts`
- `app/client/src/services/adapters/character-adapter.ts`
- `app/client/src/services/adapters/comment-adapter.ts`
- `app/client/src/services/adapters/version-adapter.ts`
- `app/client/src/services/adapters/index.ts`
- `app/client/src/services/__tests__/repositories.test.ts`
- `app/client/src/services/__tests__/adapters.test.ts`

#### Phase 3: State Management
- `app/client/src/hooks/use-projects.ts` - TanStack Query hooks for projects
- `app/client/src/hooks/use-scenes.ts` - TanStack Query hooks for scenes
- `app/client/src/hooks/use-shots.ts` - TanStack Query hooks for shots
- `app/client/src/hooks/use-storyboards.ts` - TanStack Query hooks for storyboards
- `app/client/src/hooks/index.ts`
- `app/client/src/lib/query-client.ts` (update)

#### Phase 4: Script Parsing & Editor
- `app/client/src/services/fountain-parser.ts` (complete)
- `app/client/src/components/script/ScriptEditor.tsx`
- `app/client/src/components/script/ScriptViewer.tsx`
- `app/client/src/components/script/ScriptToolbar.tsx`
- `app/client/src/components/script/FountainHighlight.tsx`
- `app/client/src/components/script/__tests__/ScriptEditor.test.tsx`

#### Phase 5: Shot List UI
- `app/client/src/components/shot-list/ShotListEditor.tsx`
- `app/client/src/components/shot-list/ShotRow.tsx`
- `app/client/src/components/shot-list/ShotForm.tsx`
- `app/client/src/components/shot-list/ShotTypeSelect.tsx`
- `app/client/src/components/shot-list/CameraAngleSelect.tsx`
- `app/client/src/components/shot-list/CameraMovementSelect.tsx`
- `app/client/src/components/shot-list/ConfirmationButton.tsx`
- `app/client/src/components/shot-list/ShotListStatus.tsx`
- `app/client/src/components/shot-list/__tests__/ShotListEditor.test.tsx`

#### Phase 6: Storyboard Components
- `app/client/src/components/storyboard/StoryboardPanel.tsx`
- `app/client/src/components/storyboard/StoryboardStrip.tsx`
- `app/client/src/components/storyboard/StoryboardDetail.tsx`
- `app/client/src/components/storyboard/StoryboardGenerator.tsx`
- `app/client/src/components/storyboard/RefinementPanel.tsx`
- `app/client/src/components/storyboard/__tests__/StoryboardPanel.test.tsx`

#### Phase 7: Scene Workspace
- `app/client/src/components/workspace/SceneWorkspace.tsx`
- `app/client/src/components/workspace/LeftSidebar.tsx`
- `app/client/src/components/workspace/RightPanel.tsx`
- `app/client/src/components/workspace/TopNavigation.tsx`
- `app/client/src/components/workspace/ViewModeToggle.tsx`

#### Phase 8: Backend API Services
- `app/server/src/services/ai-proxy.service.ts` (complete)
- `app/server/src/services/project-service.ts` (update)
- `app/server/src/services/shot-service.ts` (update)
- `app/server/src/services/scene-service.ts`
- `app/server/src/services/storyboard-service.ts`

---

## Step by Step Tasks

**REMINDER**: After completing each checkbox:
1. Update `specs/progress.txt` with completion timestamp
2. Update `prd.json` acceptance criteria status to `passed` with evidence
3. Commit changes with descriptive message

### Phase 2: Data Layer Completion

#### 2.1 Create Project Repository and Adapter
- [ ] Create `adapters/project-adapter.ts` with toDomain, toDB, createDBProject, toDomainArray
- [ ] Create `repositories/project-repository.ts` with CRUD operations
- [ ] Add ProjectData type to types/index.ts
- [ ] Write tests in `__tests__/adapters.test.ts`
- [ ] Update `prd.json`: Set 2.3 status to partial progress
- [ ] Commit: `feat(phase2): add project adapter and repository`

#### 2.2 Create Scene Repository and Adapter
- [ ] Create `adapters/scene-adapter.ts` with toDomain, toDB, createDBScene, toDomainArray
- [ ] Create `repositories/scene-repository.ts` with findByScriptId, reorder
- [ ] Add SceneData type to types/index.ts
- [ ] Write tests
- [ ] Update `prd.json`: Update 2.3 progress
- [ ] Commit: `feat(phase2): add scene adapter and repository`

#### 2.3 Create Storyboard Repository and Adapter
- [ ] Create `adapters/storyboard-adapter.ts` with toDomain, toDB, createDBStoryboard
- [ ] Create `repositories/storyboard-repository.ts` with findByShotId, addVersion
- [ ] Add StoryboardData type to types/index.ts
- [ ] Write tests
- [ ] Update `prd.json`: Update 2.3, 2.5 progress
- [ ] Commit: `feat(phase2): add storyboard adapter and repository`

#### 2.4 Create Remaining Repositories and Adapters
- [ ] Create `adapters/script-adapter.ts` and `repositories/script-repository.ts`
- [ ] Create `adapters/character-adapter.ts` and `repositories/character-repository.ts`
- [ ] Create `adapters/comment-adapter.ts` and `repositories/comment-repository.ts`
- [ ] Create `adapters/version-adapter.ts` and `repositories/version-repository.ts`
- [ ] Create barrel exports in `repositories/index.ts` and `adapters/index.ts`
- [ ] Update `services/index.ts` to export all new modules
- [ ] Update `prd.json`: Set 2.3, 2.5 to `passed`
- [ ] Commit: `feat(phase2): complete all repositories and adapters`

#### 2.5 Validate Phase 2
- [ ] Run `cd app/client && npm test -- --run`
- [ ] Verify all repository and adapter tests pass
- [ ] Run `cd app/client && npm run type-check`
- [ ] Update `prd.json`: Set phase2_dataLayer status to `complete`
- [ ] Update `specs/progress.txt`: Mark Phase 2 complete
- [ ] Commit: `feat(phase2): complete data layer - all tests passing`

### Phase 3: State Management

#### 3.1 Update Zustand Stores
- [ ] Complete `stores/ui-store.ts` with full UI state
- [ ] Complete `stores/project-store.ts` with project actions
- [ ] Complete `stores/confirmation-store.ts` with confirmation tracking
- [ ] Add `stores/data-store.ts` for offline sync state
- [ ] Update `prd.json`: Set 3.1 to `passed`
- [ ] Commit: `feat(phase3): complete Zustand stores`

#### 3.2 Create TanStack Query Hooks
- [ ] Create `hooks/use-projects.ts` with useProjects, useProject, useCreateProject, useUpdateProject, useDeleteProject
- [ ] Create `hooks/use-scenes.ts` with useScenes, useScene, useCreateScene, etc.
- [ ] Create `hooks/use-shots.ts` with useShots, useShot, useCreateShot, useUpdateShot, useConfirmShotList, useUnlockShotList
- [ ] Create `hooks/use-storyboards.ts` with useStoryboards, useGenerateStoryboard
- [ ] Create `hooks/index.ts` barrel export
- [ ] Update `prd.json`: Set 3.3 to `passed`
- [ ] Commit: `feat(phase3): add TanStack Query hooks`

#### 3.3 Validate Phase 3
- [ ] Write tests for hooks in `hooks/__tests__/`
- [ ] Run `cd app/client && npm test -- --run`
- [ ] Run `cd app/client && npm run type-check`
- [ ] Update `prd.json`: Set phase3_stateManagement status to `complete`, set 3.2 to `passed`
- [ ] Update `specs/progress.txt`: Mark Phase 3 complete
- [ ] Commit: `feat(phase3): complete state management - all tests passing`

### Phase 4: Script Parsing & Editor

#### 4.1 Complete Fountain Parser
- [ ] Fix failing tests in `services/__tests__/fountain-parser.test.ts`
- [ ] Ensure parser returns Result type properly
- [ ] Add scene heading parsing (INT/EXT)
- [ ] Add character name extraction
- [ ] Add dialogue parsing
- [ ] Add action line parsing
- [ ] Add transition parsing
- [ ] Update `prd.json`: Set 5.1, 5.2 to `passed`
- [ ] Commit: `feat(phase4): complete Fountain parser`

#### 4.2 Create Script Editor Components
- [ ] Create `components/script/ScriptEditor.tsx` - main editor with textarea
- [ ] Create `components/script/ScriptViewer.tsx` - read-only parsed view
- [ ] Create `components/script/ScriptToolbar.tsx` - format buttons
- [ ] Create `components/script/FountainHighlight.tsx` - syntax highlighting
- [ ] Wire up to Zustand store for script content
- [ ] Update `prd.json`: Set 5.3, 5.4 to `passed`
- [ ] Commit: `feat(phase4): add script editor components`

#### 4.3 Validate Phase 4
- [ ] Write component tests
- [ ] Test Fountain parsing with sample scripts
- [ ] Run `cd app/client && npm test -- --run`
- [ ] Update `prd.json`: Set phase5_scriptEditor status to `complete`
- [ ] Update `specs/progress.txt`: Mark Phase 4 complete
- [ ] Commit: `feat(phase4): complete script editor - all tests passing`

### Phase 5: Shot List UI

#### 5.1 Create Shot List Components
- [ ] Create `components/shot-list/ShotListEditor.tsx` - main table editor
- [ ] Create `components/shot-list/ShotRow.tsx` - individual shot row
- [ ] Create `components/shot-list/ShotForm.tsx` - add/edit shot form
- [ ] Create `components/shot-list/ShotTypeSelect.tsx` - dropdown for shot types
- [ ] Create `components/shot-list/CameraAngleSelect.tsx` - dropdown for angles
- [ ] Create `components/shot-list/CameraMovementSelect.tsx` - dropdown for movements
- [ ] Update `prd.json`: Set 7.1 to `passed`
- [ ] Commit: `feat(phase5): add shot list UI components`

#### 5.2 Create Confirmation UI
- [ ] Create `components/shot-list/ConfirmationButton.tsx` - confirm/unlock button
- [ ] Create `components/shot-list/ShotListStatus.tsx` - shows confirmation status
- [ ] Wire up to ConfirmationService
- [ ] Implement confirmation modal with cost estimate
- [ ] Update `prd.json`: Update phase9_confirmation criteria as applicable
- [ ] Commit: `feat(phase5): add confirmation UI components`

#### 5.3 Validate Phase 5
- [ ] Write component tests for all shot list components
- [ ] Test confirmation workflow end-to-end
- [ ] Verify paradigm gates work (cannot edit confirmed shot)
- [ ] Run `cd app/client && npm test -- --run`
- [ ] Update `prd.json`: Set phase7_shotList status to `complete`
- [ ] Update `specs/progress.txt`: Mark Phase 5 complete
- [ ] Commit: `feat(phase5): complete shot list UI - all tests passing`

### Phase 6: Storyboard Components

#### 6.1 Create Storyboard Display Components
- [ ] Create `components/storyboard/StoryboardPanel.tsx` - single panel
- [ ] Create `components/storyboard/StoryboardStrip.tsx` - horizontal filmstrip
- [ ] Create `components/storyboard/StoryboardDetail.tsx` - large panel view
- [ ] Add version history display
- [ ] Commit: `feat(phase6): add storyboard display components`

#### 6.2 Create Storyboard Generation Components
- [ ] Create `components/storyboard/StoryboardGenerator.tsx` - generation controls
- [ ] Create `components/storyboard/RefinementPanel.tsx` - edit prompt panel
- [ ] Add progress indicator for generation
- [ ] Add cost tracking display
- [ ] Commit: `feat(phase6): add storyboard generation UI`

#### 6.3 Create Storyboard Service
- [ ] Create `services/storyboard-service.ts` with generateStoryboard method
- [ ] Implement paradigm gate: BLOCK if scene not confirmed
- [ ] Connect to backend AI proxy endpoint
- [ ] Handle generation errors gracefully
- [ ] Update `prd.json`: Set 9.6, 9.7, 9.8 to `passed`, set 10.1 to `passed`
- [ ] Commit: `feat(phase6): add storyboard service with paradigm gates`

#### 6.4 Validate Phase 6
- [ ] Write component tests
- [ ] Write service tests for paradigm gates
- [ ] Run `cd app/client && npm test -- --run`
- [ ] Update `prd.json`: Set phase10_storyboard status to `complete`
- [ ] Update `specs/progress.txt`: Mark Phase 6 complete
- [ ] Commit: `feat(phase6): complete storyboard components - all tests passing`

### Phase 7: Scene Workspace Integration

#### 7.1 Create Workspace Layout
- [ ] Create `components/workspace/SceneWorkspace.tsx` - main layout
- [ ] Create `components/workspace/LeftSidebar.tsx` - navigation sidebar
- [ ] Create `components/workspace/RightPanel.tsx` - contextual tools
- [ ] Create `components/workspace/TopNavigation.tsx` - breadcrumbs and actions
- [ ] Create `components/workspace/ViewModeToggle.tsx` - storyboard/script/split
- [ ] Commit: `feat(phase7): add workspace layout components`

#### 7.2 Integrate All Components
- [ ] Wire up ScriptEditor to workspace
- [ ] Wire up ShotListEditor to workspace
- [ ] Wire up StoryboardStrip to workspace
- [ ] Implement scene navigation
- [ ] Implement view mode switching
- [ ] Commit: `feat(phase7): integrate all components into workspace`

#### 7.3 Validate Phase 7
- [ ] Write integration tests
- [ ] Test full workflow: script → shots → confirm → storyboards
- [ ] Run `cd app/client && npm test -- --run`
- [ ] Update `specs/progress.txt`: Mark Phase 7 complete
- [ ] Commit: `feat(phase7): complete scene workspace integration`

### Phase 8: Backend Integration

#### 8.1 Complete Backend Services
- [ ] Complete `services/ai-proxy.service.ts` for SDXL/Wan2.6
- [ ] Create `services/scene-service.ts` for scene CRUD
- [ ] Create `services/storyboard-service.ts` for storyboard generation
- [ ] Update routes to expose all services
- [ ] Update `prd.json`: Set 10.2 to `passed`
- [ ] Commit: `feat(phase8): complete backend services`

#### 8.2 Connect Frontend to Backend
- [ ] Update TanStack Query hooks to use API
- [ ] Implement offline sync with IndexedDB cache
- [ ] Add authentication flow
- [ ] Test API integration
- [ ] Commit: `feat(phase8): connect frontend to backend API`

#### 8.3 Final Validation
- [ ] Run full test suite: `cd app/client && npm test -- --run`
- [ ] Run server tests: `cd app/server && bun test`
- [ ] Run type check: `cd app/client && npm run type-check`
- [ ] Manual E2E test of complete workflow
- [ ] Update `prd.json`: Set all remaining phases to `complete`
- [ ] Update `specs/progress.txt`: Mark all phases complete
- [ ] Commit: `feat: complete MVP - all phases done`

---

## Testing Strategy

### Unit Tests
- All adapters: toDomain/toDB round-trips
- All repositories: CRUD operations
- All services: business logic including paradigm gates
- All components: rendering and interactions

### Integration Tests
- Shot list confirmation workflow
- Storyboard generation with paradigm gates
- Offline sync behavior
- API integration

### Edge Cases
- Empty shot list confirmation
- Concurrent edits (offline sync conflicts)
- API rate limiting and retries
- Large scripts with many scenes
- Missing character references

---

## Validation Commands

Execute after each phase completion:

```bash
# Client tests
cd app/client && npm test -- --run

# Client type check
cd app/client && npm run type-check

# Server tests
cd app/server && bun test

# Server type check
cd app/server && npm run type-check

# Full E2E (manual)
# 1. Start servers: ./scripts/start.sh
# 2. Open http://localhost:5173
# 3. Create project → Write script → Create shots → Confirm → Generate storyboards
```

---

## Notes

### Architecture Decisions
1. **FP Pattern**: All services use AsyncResult from `@/lib/fp` for composable error handling
2. **Repository Pattern**: All data access through repositories, never direct DB calls
3. **Adapter Pattern**: DB types (ISO strings) ↔ Domain types (Date objects) transformation
4. **Paradigm Gates**: Confirmation checks in service layer, not UI

### Dependencies to Add
None required - all dependencies already in package.json

### Known Issues to Fix
- ISSUE-001: AsyncResult timing test too strict (increase threshold to 300ms)
- Fountain parser tests failing (result.isOk not a function - needs Result type fix)
