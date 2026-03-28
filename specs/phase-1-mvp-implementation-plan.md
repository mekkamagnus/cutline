# Feature: Phase 1 MVP - Script to Storyboard Platform

## The Shot-List-First Paradigm

**Core Philosophy**: The confirmed shot list is the specification for storyboard generation.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SHOT-LIST-FIRST WORKFLOW                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Fountain Script                                                    │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│  │    Parse    │ ──▶ │   Suggest   │ ──▶ │    Edit     │           │
│  │   Scenes    │     │   Shots     │     │   Shots     │           │
│  └─────────────┘     └─────────────┘     └─────────────┘           │
│                                                 │                   │
│                                                 ▼                   │
│                                          ┌─────────────┐            │
│  ⚠️  CRITICAL GATE:                      │  ⚡ CONFIRM │            │
│  No generation without confirmation      └─────────────┘            │
│                                                 │                   │
│                                                 ▼                   │
│                                          ┌─────────────┐            │
│                                          │  Generate   │            │
│                                          │ Storyboards │            │
│                                          └─────────────┘            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Principle**: AI suggests → Director edits → Director confirms → AI generates

This ensures:
- **No surprise storyboards**: Every panel corresponds to an approved shot
- **Creative control**: Directors approve before any AI generation
- **Cost transparency**: Know exactly what will be generated before spending

## Design Document References

### Product Requirements
**Reference**: `docs/prd.md`
- Feature #1.7: Shot List Editor (lines 99-120)
- Feature #1.8: AI-Assisted Shot Suggestions (lines 122-140)
- Feature #1.9: Shot List Confirmation (lines 142-155)
- Feature #6: AI Storyboard Generation from Confirmed Shot List (lines 272-294)

### Technical Architecture
**Reference**: `docs/architecture.md`
- Data Model: `Shot` with `confirmed` field (lines 692-716)
- Service Layer: `ShotService` with confirmation workflow (lines 1232-1306)
- Adapter Layer: `ShotAdapter` for IndexedDB operations (lines 1389-1456)
- Confirmation state management patterns (lines 1255-1270)

### UI Mockups
**Desktop Reference**: `mockup.html`
- Three-column layout (lines 128-134)
- Shot list table with inline editing (lines 598-621)
- Confirmation button and cost display (lines 1389-1396)
- Filmstrip gallery for storyboards (lines 635-664)

**Mobile Reference**: `mockup-mobile.html`
- Bottom navigation pattern (lines 292-300)
- Shot cards instead of table (lines 491-527)
- Filmstrip carousel (lines 529-559)
- Bottom sheet confirmation (lines 1174-1178)

---

## Feature Description

Cutline Phase 1 MVP is a browser-only Progressive Web App (PWA) that transforms Fountain-format scripts into storyboards through an AI-assisted workflow.

**Target Users**: Filmmakers and storytellers (primary), short video creators (secondary)

**Core Workflow**:
1. Fountain Script → Script Parsing & Breakdown
2. Shot List Creation (AI suggests → Director edits)
3. Shot List Confirmation (**critical gate**)
4. AI Storyboard Generation (from confirmed shots only)
5. Storyboard Refinement → Export

## User Story

As a filmmaker,
I want to write/edit Fountain scripts, break them down into scenes, define shot lists with AI assistance, confirm my shot list, and generate storyboard images from confirmed shots,
So that I can efficiently visualize my script before production while maintaining complete creative control.

## Problem Statement

Filmmakers need to transform scripts into visual storyboards, but existing tools either:
1. Generate unexpected AI outputs without director control
2. Require manual drawing without AI assistance
3. Don't integrate script editing with shot planning and storyboard generation

## Solution Statement

Cutline Phase 1 MVP provides a browser-only PWA that:
- **Parses Fountain scripts** automatically into scenes, characters, and locations
- **Provides AI-assisted shot suggestions** that directors can edit before generation
- **Requires explicit shot list confirmation** before any AI generation occurs
- **Generates storyboard panels** from confirmed shots using SDXL or 通义万相 APIs
- **Stores everything locally** with IndexedDB for privacy and offline access
- **Works as a PWA** for installation and offline use

---

## Project Structure

```
cutline/
├── app/
│   ├── client/                    # React + TypeScript + Vite frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── editor/        # Script editor (PRD #1.5)
│   │   │   │   ├── breakdown/     # Script breakdown (PRD #1.6)
│   │   │   │   ├── shots/         # Shot list + confirmation (PRD #1.7-1.9)
│   │   │   │   ├── storyboards/   # Storyboard view (PRD #6-7)
│   │   │   │   ├── ui/            # Shared components (mockup.html refs)
│   │   │   │   └── layout/        # Layout (mockup.html three-column)
│   │   │   ├── hooks/
│   │   │   ├── stores/            # Zustand (architecture.md lines 988-1011)
│   │   │   ├── services/          # Service layer (architecture.md lines 1149-1587)
│   │   │   ├── types/             # TypeScript types (architecture.md lines 494-828)
│   │   │   └── utils/
│   │   ├── public/                # PWA assets
│   │   └── vite.config.ts
│   └── server/                    # Backend (Phase 2+)
├── docs/
│   ├── prd.md                     # Product requirements
│   └── architecture.md            # Technical architecture
├── mockup.html                    # Desktop UI reference
├── mockup-mobile.html             # Mobile UI reference
└── specs/
    └── phase-1-mvp-implementation-plan.md
```

---

## Implementation Plan

### Phase 1: Foundation Infrastructure
**Goal**: Set up project with all core systems referenced in architecture.md

#### 1.1 Project Initialization
```bash
# Create structure
mkdir -p app/client/src/{components/{editor,breakdown,shots,storyboards,ui,layout},hooks,stores,services,types,utils}
mkdir -p app/client/public scripts

# Initialize Vite + React + TypeScript
cd app/client
npm create vite@latest . -- --template react-ts
npm install
```

#### 1.2 Core Dependencies
**From architecture.md lines 62-75**:
```bash
npm install @tanstack/react-query@^5.0.0 \
            @tanstack/react-virtual@^3.0.0 \
            zustand@^4.0.0 \
            dexie@^4.0.0 \
            react-router-dom@^6.0.0 \
            @fontsource/inter@^5.0.0 \
            @fontsource/courier-prime@^1.0.0 \
            fp-ts@^2.16 \
            date-fns@^3.0.0
```

**Dev dependencies**:
```bash
npm install -D vitest@^1.0.0 \
               @testing-library/react@^14.0.0 \
               vite-plugin-pwa@^0.17.0 \
               workbox-window@^7.0.0
```

#### 1.3 TypeScript Configuration
**From architecture.md lines 1307-1342**:
- Strict mode enabled
- Path aliases: `@/lib/*`, `@/components/*`, `@/services/*`, `@/types/*`
- ES2020 target with JSX support

#### 1.4 Vite Configuration
**From architecture.md lines 1307-1342**:
- Path aliases matching tsconfig
- PWA plugin with workbox
- Build optimization with code splitting

#### 1.5 PWA Manifest
**From architecture.md lines 2624-2671**:
```json
{
  "name": "Cutline",
  "short_name": "Cutline",
  "description": "Script to video platform for filmmakers",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#6366f1"
}
```

---

### Phase 2: Type System & Data Layer
**Goal**: Implement complete data model from architecture.md

#### 2.1 Core Type Definitions
**Reference**: architecture.md lines 494-828

Create `src/types/index.ts`:

```typescript
// Shot types from PRD lines 106-113
export type ShotType =
  | 'wide' | 'medium' | 'close-up' | 'extreme-cu'
  | 'two-shot' | 'over-the-shoulder' | 'establishing' | 'insert';

export type CameraAngle =
  | 'eye-level' | 'high-angle' | 'low-angle'
  | 'dutch-angle' | 'birds-eye' | 'worms-eye';

export type CameraMovement =
  | 'static' | 'pan' | 'tilt' | 'dolly'
  | 'truck' | 'pedestal' | 'arc' | 'handheld' | 'steadicam';

// Shot with confirmation state - CRITICAL for paradigm
export interface Shot {
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

  // CONFIRMATION STATE - Core of shot-list-first paradigm
  confirmed: boolean;
  confirmedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

#### 2.2 FP Types Facade
**Reference**: architecture.md lines 143-260

Create `src/lib/fp/index.ts`:
```typescript
// Re-export from fp-ts facade only
export { Option, Result, AsyncResult } from './types';
export { AppError } from './errors';
```

**Rule**: Never import fp-ts directly outside `src/lib/fp/`

#### 2.3 IndexedDB Schema with Dexie
**Reference**: architecture.md lines 2062-2209

Create `src/services/db.ts`:

```typescript
import Dexie, { Table } from 'dexie';

export class CutlineDB extends Dexie {
  projects!: Table<Project>;
  scripts!: Table<Script>;
  scenes!: Table<Scene>;
  shots!: Table<Shot>;          // With confirmed field
  storyboards!: Table<StoryboardPanel>;
  characters!: Table<Character>;
  comments!: Table<Comment>;
  versions!: Table<Version>;

  constructor() {
    super('CutlineDB');
    this.version(1).stores({
      projects: 'id, name, createdAt, updatedAt',
      scripts: 'id, projectId',
      scenes: 'id, scriptId, order',
      shots: 'id, sceneId, shotNumber, confirmed',  // Index on confirmed
      storyboards: 'id, shotId',
      characters: 'id, projectId, name',
      comments: 'id, entityType, entityId',
      versions: 'id, projectId, createdAt'
    });
  }
}
```

#### 2.4 Repository Pattern
**Reference**: architecture.md lines 2211-2269

Implement repositories for each entity:
- `ProjectRepository`: CRUD with cascade delete
- `ShotRepository`: **Critical** - includes confirmation state management
- `StoryboardRepository`: Panel management with version history

---

### Phase 3: State Management
**Goal**: Set up state layers from architecture.md

#### 3.1 Zustand UI Store
**Reference**: architecture.md lines 988-1011

```typescript
interface UIState {
  // Selection state
  currentProjectId: string | null;
  currentSceneId: string | null;
  currentShotId: string | null;

  // View state
  viewMode: 'script' | 'split' | 'storyboard';
  focusMode: boolean;

  // Confirmation tracking - for paradigm enforcement
  hasUnconfirmedChanges: boolean;

  // Actions
  selectProject: (id: string) => void;
  selectScene: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
}
```

#### 3.2 TanStack Query for AI Services
**Reference**: architecture.md lines 949-983

Configure QueryClient with:
- `staleTime: 5 * 60 * 1000` (5 minutes)
- `gcTime: 30 * 60 * 1000` (30 minutes)
- Retry logic for API failures

---

### Phase 4: Routing & Layout
**Goal**: Match mockup.html structure

#### 4.1 Route Structure
**Reference**: architecture.md lines 2341-2380

```
/                              → ProjectListScreen
/project/:id                   → ScriptEditorScreen (default)
/project/:id/breakdown         → ScriptBreakdownScreen
/project/:id/scene/:sceneId/shots     → ShotListEditorScreen
/project/:id/scene/:sceneId/storyboards → StoryboardViewScreen
/project/:id/settings          → SettingsScreen
```

#### 4.2 Desktop Layout
**Reference**: mockup.html lines 128-134, 886-1174

```
┌─────────────────────────────────────────────────────────────────┐
│ Header (nav tabs: Script | Shots | Storyboards | Breakdown)    │
├─────────────────────────────────────────────────────────────────┤
│ Top Toolbar (title, scene selector, view toggle, save status)  │
├────────────┬──────────────────────────────────┬────────────────┤
│ Left       │                                  │ Right          │
│ Sidebar    │        Main Content              │ Sidebar        │
│ (240px)    │        (flexible)                │ (200px)        │
│            │                                  │                │
│ Scene Nav  │   Script Editor / Shots / etc    │ Characters /   │
│ Stats      │                                  │ Current Scene  │
├────────────┴──────────────────────────────────┴────────────────┤
│ Format Bar (Scene | Action | Character | Dialogue | ...)       │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3 Mobile Layout
**Reference**: mockup-mobile.html lines 233-291, 753-917

- Top bar with scene navigation
- Single column content
- Bottom navigation (Script | Shots | Boards | Breakdown)
- Bottom sheet for confirmations
- 44px minimum touch targets

---

### Phase 5: Script Editor (Foundation Feature)
**Reference**: PRD Feature #1.5 (lines 60-76), architecture.md lines 1851-2060

#### 5.1 Fountain Parser
Create `src/services/fountainParser.ts`:

```typescript
interface FountainParser {
  parse(text: string): Result<AppError, ParsedScript>;
  getHighlightTokens(text: string): Result<AppError, HighlightToken[]>;
  getSceneAtLine(text: string, line: number): Option<ParsedScene>;
  parseAVFormat(text: string): Result<AppError, AVParsedScript>;
}
```

**Elements to parse**:
- Scene headings (INT/EXT, location, time)
- Action lines
- Character names
- Dialogue
- Parentheticals
- Transitions
- Shot headings

#### 5.2 Script Editor Component
**Reference**: mockup.html lines 1004-1058

- Contenteditable div with `spellcheck="false"`
- Font: 'Courier Prime', 13pt desktop / 1rem mobile
- Syntax highlighting per element type
- Max-width guides (60ch action, 35ch dialogue)
- Branded cursor: `caret-color: var(--accent)`

#### 5.3 Format Toolbar
**Reference**: mockup.html lines 1127-1172

Buttons with platform-aware shortcuts:
- Scene (Cmd/Ctrl + Enter)
- Action
- Character
- Dialogue
- Parenthetical
- Transition

---

### Phase 6: Script Breakdown
**Reference**: PRD Feature #1.6 (lines 78-98)

#### 6.1 Breakdown Service
```typescript
class ScriptBreakdownService {
  static getBreakdown(scriptId: string): AsyncResult<AppError, ScriptBreakdown> {
    return scriptAdapter.findById(scriptId)
      .andThen(script => this.analyzeScenes(script));
  }
}
```

#### 6.2 Breakdown UI
**Reference**: mockup.html lines 1176-1290

- Four-column stats grid: Scenes, Characters, Locations, Minutes
- Tabbed view: Scenes | Characters | Locations
- Scene cards with INT/EXT icons
- Character cards with dialogue counts
- Click-through navigation

---

### Phase 7: Shot List Editor (Core Paradigm Component)
**Reference**: PRD Feature #1.7 (lines 99-120), architecture.md lines 1160-1206

#### 7.1 Shot Type Definitions
**Reference**: PRD lines 106-113

```typescript
// From PRD specifications
const SHOT_TYPES = [
  'wide', 'medium', 'close-up', 'extreme-cu',
  'two-shot', 'over-the-shoulder', 'establishing', 'insert'
] as const;

const CAMERA_ANGLES = [
  'eye-level', 'high-angle', 'low-angle',
  'dutch-angle', 'birds-eye', 'worms-eye'
] as const;

const CAMERA_MOVEMENTS = [
  'static', 'pan', 'tilt', 'dolly',
  'truck', 'pedestal', 'arc', 'handheld', 'steadicam'
] as const;
```

#### 7.2 Shot List Table Component
**Reference**: mockup.html lines 1292-1397

Columns:
1. Shot Number (auto)
2. Shot Type (dropdown with badges)
3. Camera Angle (dropdown)
4. Camera Movement (dropdown)
5. Characters in Frame (multi-select)
6. Action Description (textarea)
7. Duration (number)
8. Actions (delete, reorder)

#### 7.3 Shot List Service
**Reference**: architecture.md lines 1232-1306

```typescript
class ShotService {
  // Create shot in unconfirmed state
  static createShot(sceneId: string, data: ShotData): AsyncResult<AppError, Shot>;

  // Get shots for scene (both confirmed and unconfirmed)
  static getByScene(sceneId: string): AsyncResult<AppError, Shot[]>;

  // Update shot (only if not confirmed)
  static updateShot(shotId: string, data: Partial<Shot>): AsyncResult<AppError, Shot>;

  // Delete shot (only if not confirmed)
  static deleteShot(shotId: string): AsyncResult<AppError, void>;
}
```

---

### Phase 8: AI Shot Suggestions
**Reference**: PRD Feature #1.8 (lines 122-140)

#### 8.1 AI Service Interface
```typescript
interface AIService {
  suggestShots(scene: ParsedScene): AsyncResult<AppError, ShotSuggestion[]>;
}
```

#### 8.2 Suggestion Panel
**Reference**: mockup-mobile.html lines 1205-1258

Display suggestions with:
- Shot type, angle, movement
- Characters in frame
- Action description
- AI reasoning (why this shot)

Actions:
- Accept → adds to shot list as unconfirmed
- Edit → opens edit form, then adds as unconfirmed
- Reject → dismissed

---

### Phase 9: Shot List Confirmation (PARADIGM GATE)
**Reference**: PRD Feature #1.9 (lines 142-155), architecture.md lines 1255-1270

> ⚠️ **CRITICAL**: This is the core of the shot-list-first paradigm.
> No storyboard generation can occur without confirmation.

#### 9.1 Confirmation Service
```typescript
class ShotListConfirmationService {
  /**
   * Confirm all shots in a scene
   * - Sets confirmed: true on all shots
   * - Sets confirmedAt timestamp
   * - Locks shots from editing
   * - Enables storyboard generation
   */
  static confirmShotList(sceneId: string): AsyncResult<AppError, ConfirmedShotList> {
    return shotAdapter.findByScene(sceneId)
      .andThen(shots => {
        if (shots.length === 0) {
          return AsyncResult.err(
            AppError.validation('Cannot confirm empty shot list')
          );
        }
        return this.markAllConfirmed(sceneId, shots);
      });
  }

  /**
   * Unlock shot list for editing
   * - Sets confirmed: false on all shots
   * - Clears confirmedAt
   * - Disables storyboard generation
   * - Shows warning about unconfirmed changes
   */
  static unlockShotList(sceneId: string): AsyncResult<AppError, void> {
    return shotAdapter.unlockScene(sceneId);
  }
}
```

#### 9.2 Confirmation UI
**Reference**: mockup.html lines 1389-1396, mockup-mobile.html lines 1174-1178

**Desktop**: Bottom bar with confirm button and cost estimate
**Mobile**: Bottom sheet with confirm button

Display:
- Shot count
- Estimated generation cost (shots × cost per image)
- "Confirm Shot List" button
- "Unlock for Editing" button (when confirmed)

#### 9.3 Confirmation State Indicators

```typescript
// Scene card shows confirmation status
interface SceneCardProps {
  scene: Scene;
  shots: Shot[];
  confirmed: boolean;  // All shots confirmed?
  hasUnconfirmedChanges: boolean;  // Was confirmed, now unlocked?
}
```

Visual indicators:
- ✅ Green badge: "Confirmed" (5 shots)
- ⚠️ Yellow badge: "Unconfirmed changes"
- ⏳ Gray badge: "Not confirmed"

---

### Phase 10: Storyboard Generation (From Confirmed Shots Only)
**Reference**: PRD Feature #6 (lines 272-294), architecture.md lines 1308-1376

#### 10.1 Generation Preconditions
> ⚠️ **ENFORCE**: Generation only possible when shot list is confirmed

```typescript
class StoryboardService {
  static generateForScene(
    sceneId: string,
    apiProvider: 'sdxl' | 'wanxiang'
  ): AsyncResult<AppError, StoryboardPanel[]> {
    return shotAdapter.findConfirmedByScene(sceneId)
      .andThen(shots => {
        // PARADIGM ENFORCEMENT: Only generate from confirmed shots
        if (shots.length === 0) {
          return AsyncResult.err(
            AppError.validation('No confirmed shots found. Confirm shot list first.')
          );
        }
        // Proceed with generation...
      });
  }
}
```

#### 10.2 One Panel Per Confirmed Shot
**Reference**: PRD line 278

```
For each confirmed shot → Generate ONE storyboard panel
```

The shot metadata becomes generation parameters:
- `shotType` → framing/composition
- `angle` → perspective
- `movement` → motion hints
- `charactersInFrame` → who appears
- `actionDescription` → main prompt content

#### 10.3 Image Generation APIs
**Reference**: architecture.md lines 1590-1803

**SDXL (Primary)**:
- Via Replicate API
- Cost: ~$0.002/image
- Best for international users

**WanXiang (Secondary)**:
- Via Alibaba DashScope
- Cost: ¥0.20/image (~$0.028)
- Better for China users

#### 10.4 Generation Progress UI
**Reference**: mockup.html lines 1399-1514

- Progress bar: "Generating storyboard 3 of 12 for Scene 5"
- Cost tracking (running total)
- Individual panel status indicators
- Cancel button

---

### Phase 11: Storyboard Refinement
**Reference**: PRD Feature #7 (lines 296-309)

#### 11.1 Edit Mode
- "Edit" button per panel
- Refinement prompt textarea
- Non-destructive (saves to version history)

#### 11.2 Version History
```typescript
interface StoryboardPanelVersion {
  version: number;
  imageUrl: string;
  generatedAt: Date;
  refinementPrompt?: string;
}
```

---

### Phase 12: UI Components (From Mockups)

#### 12.1 Desktop Components
**Reference**: mockup.html

| Component | Lines | Purpose |
|-----------|-------|---------|
| Header | 69-80 | Top navigation with tabs |
| SceneNavigator | 286-334 | Left sidebar scene list |
| ScriptEditor | 404-419 | Main editor area |
| FormatToolbar | 486-539 | Bottom format bar |
| ShotListTable | 598-621 | Shot list editor |
| Filmstrip | 635-664 | Storyboard gallery |

#### 12.2 Mobile Components
**Reference**: mockup-mobile.html

| Component | Lines | Purpose |
|-----------|-------|---------|
| SceneNavBar | 208-231 | Scene prev/next |
| FormatBar | 326-360 | Horizontal format buttons |
| BottomNav | 292-300 | Main navigation |
| ShotCard | 491-527 | Card-based shot display |
| BottomSheet | 1174-1178 | Confirmation sheet |
| Filmstrip carousel | 529-559 | Storyboard thumbnails |

#### 12.3 Design Tokens
**Reference**: mockup.html lines 11-57

```css
:root {
  /* Colors */
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --accent: #6366f1;

  /* Fountain element colors */
  --fountain-scene: #fbbf24;
  --fountain-character: #60a5fa;
  --fountain-dialogue: #f5f5f5;

  /* Spacing (8px base) */
  --space-4: 16px;
  --space-6: 24px;
}
```

---

### Phase 13: PWA Features
**Reference**: PRD Feature #1.11 (lines 176-189)

#### 13.1 Service Worker
- Cache app shell
- Network first for API calls
- Background sync for offline changes

#### 13.2 Offline Mode
- Show offline indicator
- Queue operations
- Sync when restored

---

## TDD Workflow

**Philosophy**: Tests drive design, not just verify implementation. Write tests first to clarify requirements before coding.

### Core TDD Principles

1. **Red First**: Write a failing test that describes desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code quality while keeping tests green
4. **Repeat**: Small cycles, continuous feedback

### TDD Cycle Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     TDD MICRO-CYCLE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐      ┌─────────┐      ┌───────────┐          │
│   │  🔴 RED │ ──▶  │🟢 GREEN │ ──▶  │🔵 REFACTOR│          │
│   └─────────┘      └─────────┘      └───────────┘          │
│       │                │                  │                │
│       ▼                ▼                  ▼                │
│   Write           Make it            Improve              │
│   failing         pass               design               │
│   test            (minimal)          (keep green)         │
│                                                             │
│   Time: 1-5 min per cycle (unit), 10-30 min (integration)  │
└─────────────────────────────────────────────────────────────┘
```

---

### Phase 2 TDD: Type System & Data Layer

#### 2.1 Test File Structure
```
src/
├── types/
│   └── index.ts
├── services/
│   ├── db.ts
│   └── __tests__/
│       ├── db.test.ts
│       └── repositories.test.ts
```

#### 2.2 TDD Cycle: Shot Type Validation

**🔴 RED - Write failing test first:**
```typescript
// src/services/__tests__/shot-types.test.ts
import { describe, it, expect } from 'vitest';
import { validateShotType, ShotType } from '@/types';

describe('ShotType validation', () => {
  it('accepts valid shot types', () => {
    const validTypes: ShotType[] = ['wide', 'medium', 'close-up', 'extreme-cu'];
    validTypes.forEach(type => {
      expect(validateShotType(type)).toBe(true);
    });
  });

  it('rejects invalid shot types', () => {
    expect(() => validateShotType('invalid-type' as ShotType))
      .toThrow('Invalid shot type: invalid-type');
  });
});
```

**🟢 GREEN - Minimal implementation:**
```typescript
// src/types/shot.ts
export const VALID_SHOT_TYPES = ['wide', 'medium', 'close-up', 'extreme-cu',
  'two-shot', 'over-the-shoulder', 'establishing', 'insert'] as const;

export function validateShotType(type: ShotType): boolean {
  if (!VALID_SHOT_TYPES.includes(type)) {
    throw new Error(`Invalid shot type: ${type}`);
  }
  return true;
}
```

**🔵 REFACTOR - Improve design:**
```typescript
// src/types/shot.ts
export type ShotType = typeof VALID_SHOT_TYPES[number];

export const isValidShotType = (value: unknown): value is ShotType =>
  VALID_SHOT_TYPES.includes(value as ShotType);

export function validateShotType(type: unknown): asserts type is ShotType {
  if (!isValidShotType(type)) {
    throw new Error(`Invalid shot type: ${type}. Valid types: ${VALID_SHOT_TYPES.join(', ')}`);
  }
}
```

#### 2.3 TDD Cycle: Dexie Database Schema

**🔴 RED:**
```typescript
// src/services/__tests__/db.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CutlineDB } from '../db';

describe('CutlineDB', () => {
  let db: CutlineDB;

  beforeEach(async () => {
    db = new CutlineDB();
    await db.shots.clear();
  });

  it('indexes shots by sceneId for fast lookup', async () => {
    const sceneId = 'scene-1';
    await db.shots.bulkAdd([
      { id: 'shot-1', sceneId, shotNumber: 1, confirmed: false },
      { id: 'shot-2', sceneId, shotNumber: 2, confirmed: false },
      { id: 'shot-3', sceneId: 'scene-2', shotNumber: 1, confirmed: false },
    ]);

    const sceneShots = await db.shots.where('sceneId').equals(sceneId).toArray();
    expect(sceneShots).toHaveLength(2);
    expect(sceneShots.every(s => s.sceneId === sceneId)).toBe(true);
  });

  it('indexes shots by confirmed state', async () => {
    await db.shots.bulkAdd([
      { id: 'shot-1', sceneId: 'scene-1', shotNumber: 1, confirmed: true },
      { id: 'shot-2', sceneId: 'scene-1', shotNumber: 2, confirmed: false },
    ]);

    const confirmedShots = await db.shots.where('confirmed').equals(true).toArray();
    expect(confirmedShots).toHaveLength(1);
    expect(confirmedShots[0].id).toBe('shot-1');
  });
});
```

---

### Phase 5 TDD: Fountain Parser

#### 5.1 Parser Test Suite

**🔴 RED - Define behavior first:**
```typescript
// src/services/__tests__/fountainParser.test.ts
import { describe, it, expect } from 'vitest';
import { FountainParser } from '../fountainParser';

describe('FountainParser', () => {
  const parser = new FountainParser();

  describe('scene headings', () => {
    it('parses INT. location', () => {
      const result = parser.parse('INT. OFFICE - DAY');
      expect(result.isOk()).toBe(true);
      const script = result.unwrap();
      expect(script.scenes).toHaveLength(1);
      expect(script.scenes[0].heading).toBe('INT. OFFICE - DAY');
      expect(script.scenes[0].location).toBe('OFFICE');
      expect(script.scenes[0].timeOfDay).toBe('DAY');
      expect(script.scenes[0].interior).toBe(true);
    });

    it('parses EXT. location', () => {
      const result = parser.parse('EXT. BEACH - SUNSET');
      expect(result.isOk()).toBe(true);
      const scene = result.unwrap().scenes[0];
      expect(scene.interior).toBe(false);
    });

    it('ignores non-scene headings', () => {
      const result = parser.parse('This is just action text.');
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().scenes).toHaveLength(0);
    });
  });

  describe('character dialogue', () => {
    it('extracts character names and dialogue', () => {
      const script = `
INT. OFFICE - DAY

JOHN
(happy)
Hello, world!

SARAH
Hi there!
      `.trim();

      const result = parser.parse(script);
      expect(result.isOk()).toBe(true);
      const parsed = result.unwrap();

      expect(parsed.characters).toContain('JOHN');
      expect(parsed.characters).toContain('SARAH');
      expect(parsed.scenes[0].dialogue).toHaveLength(2);
    });
  });
});
```

**🟢 GREEN - Implement parser:**
```typescript
// src/services/fountainParser.ts
import { Result, AppError } from '@/lib/fp';

const SCENE_HEADING_REGEX = /^(INT|EXT|INT\.?\/EXT|EXT\.?\/INT)\.?\s+(.+?)\s*-\s*(.+)$/;

export class FountainParser {
  parse(text: string): Result<AppError, ParsedScript> {
    const lines = text.split('\n');
    const scenes: ParsedScene[] = [];
    const characters = new Set<string>();

    let currentScene: ParsedScene | null = null;

    for (const line of lines) {
      const match = line.match(SCENE_HEADING_REGEX);
      if (match) {
        if (currentScene) scenes.push(currentScene);
        currentScene = {
          heading: line,
          interior: match[1].startsWith('INT'),
          location: match[2].trim(),
          timeOfDay: match[3].trim(),
          dialogue: [],
        };
      }
      // ... more parsing logic
    }

    if (currentScene) scenes.push(currentScene);

    return Result.ok({ scenes, characters: Array.from(characters) });
  }
}
```

---

### Phase 7 TDD: Shot List Service

#### 7.1 Shot CRUD Operations

**🔴 RED - Define contract first:**
```typescript
// src/services/__tests__/shotService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ShotService } from '../shotService';
import { createTestDB, createTestScene } from '@/test-utils';

describe('ShotService', () => {
  let db: CutlineDB;
  let testScene: Scene;

  beforeEach(async () => {
    db = await createTestDB();
    testScene = await createTestScene(db);
  });

  describe('createShot', () => {
    it('creates shot in unconfirmed state by default', async () => {
      const result = await ShotService.createShot(testScene.id, {
        type: 'wide',
        angle: 'eye-level',
        movement: 'static',
        actionDescription: 'Opening shot',
      });

      expect(result.isOk()).toBe(true);
      const shot = result.unwrap();
      expect(shot.confirmed).toBe(false);
      expect(shot.confirmedAt).toBeUndefined();
    });

    it('auto-assigns shot number based on scene order', async () => {
      await ShotService.createShot(testScene.id, { /* ... */ });
      await ShotService.createShot(testScene.id, { /* ... */ });

      const result = await ShotService.createShot(testScene.id, { /* ... */ });
      expect(result.unwrap().shotNumber).toBe(3);
    });
  });

  describe('updateShot', () => {
    it('allows update when shot is unconfirmed', async () => {
      const shot = await ShotService.createShot(testScene.id, { /* ... */ });
      const result = await ShotService.updateShot(shot.id, { type: 'close-up' });

      expect(result.isOk()).toBe(true);
      expect(result.unwrap().type).toBe('close-up');
    });

    it('blocks update when shot is confirmed', async () => {
      const shot = await ShotService.createShot(testScene.id, { /* ... */ });
      await db.shots.update(shot.id, { confirmed: true, confirmedAt: new Date() });

      const result = await ShotService.updateShot(shot.id, { type: 'close-up' });
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErrorOr(null).kind).toBe('validation');
    });
  });

  describe('deleteShot', () => {
    it('blocks delete when shot is confirmed', async () => {
      const shot = await ShotService.createShot(testScene.id, { /* ... */ });
      await db.shots.update(shot.id, { confirmed: true });

      const result = await ShotService.deleteShot(shot.id);
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErrorOr(null).message).toContain('confirmed');
    });
  });
});
```

---

### Phase 9 TDD: Confirmation Service (PARADIGM GATE)

> ⚠️ **CRITICAL**: These tests define the core paradigm behavior

**🔴 RED - The most important tests:**
```typescript
// src/services/__tests__/confirmationService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ShotListConfirmationService } from '../confirmationService';
import { StoryboardService } from '../storyboardService';

describe('Shot-List-First Paradigm Enforcement', () => {
  describe('confirmShotList', () => {
    it('rejects confirmation of empty shot list', async () => {
      const scene = await createTestScene(db);
      // No shots added

      const result = await ShotListConfirmationService.confirmShotList(scene.id);
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErrorOr(null).message).toContain('empty');
    });

    it('sets confirmed=true and confirmedAt on all shots', async () => {
      const scene = await createSceneWithShots(db, 3);
      const beforeConfirm = await db.shots.where('sceneId').equals(scene.id).toArray();
      expect(beforeConfirm.every(s => s.confirmed === false)).toBe(true);

      const result = await ShotListConfirmationService.confirmShotList(scene.id);
      expect(result.isOk()).toBe(true);

      const afterConfirm = await db.shots.where('sceneId').equals(scene.id).toArray();
      expect(afterConfirm.every(s => s.confirmed === true)).toBe(true);
      expect(afterConfirm.every(s => s.confirmedAt instanceof Date)).toBe(true);
    });
  });

  describe('unlockShotList', () => {
    it('resets confirmation state for editing', async () => {
      const scene = await createConfirmedSceneWithShots(db, 3);

      const result = await ShotListConfirmationService.unlockShotList(scene.id);
      expect(result.isOk()).toBe(true);

      const shots = await db.shots.where('sceneId').equals(scene.id).toArray();
      expect(shots.every(s => s.confirmed === false)).toBe(true);
      expect(shots.every(s => s.confirmedAt === undefined)).toBe(true);
    });

    it('shows warning about unconfirmed changes', async () => {
      const scene = await createConfirmedSceneWithShots(db, 3);
      await ShotListConfirmationService.unlockShotList(scene.id);

      // UI should track this state
      const uiState = useUIStore.getState();
      expect(uiState.hasUnconfirmedChanges).toBe(true);
    });
  });
});

describe('Storyboard Generation Guard', () => {
  it('BLOCKS generation without confirmation', async () => {
    const scene = await createSceneWithShots(db, 5);
    // Shots exist but NOT confirmed

    const result = await StoryboardService.generateForScene(scene.id, 'sdxl');

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErrorOr(null).kind).toBe('validation');
    expect(result.unwrapErrorOr(null).message).toContain('Confirm shot list first');
  });

  it('ALLOWS generation after confirmation', async () => {
    const scene = await createSceneWithShots(db, 5);
    await ShotListConfirmationService.confirmShotList(scene.id);

    const result = await StoryboardService.generateForScene(scene.id, 'sdxl');

    expect(result.isOk()).toBe(true);
  });

  it('generates exactly ONE panel per confirmed shot', async () => {
    const scene = await createConfirmedSceneWithShots(db, 5);

    const result = await StoryboardService.generateForScene(scene.id, 'sdxl');
    const panels = result.unwrap();

    expect(panels).toHaveLength(5);
    expect(panels.map(p => p.shotId)).toEqual(
      expect.arrayContaining([shot1.id, shot2.id, shot3.id, shot4.id, shot5.id])
    );
  });
});
```

---

### Phase 10 TDD: Storyboard Service

**🔴 RED - Test external API integration:**
```typescript
// src/services/__tests__/storyboardService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { StoryboardService } from '../storyboardService';

describe('StoryboardService', () => {
  describe('generatePanel', () => {
    it('builds prompt from shot metadata', async () => {
      const shot: Shot = {
        id: 'shot-1',
        type: 'close-up',
        angle: 'low-angle',
        movement: 'static',
        charactersInFrame: ['JOHN'],
        actionDescription: 'John looks surprised',
      };

      const prompt = StoryboardService.buildPrompt(shot);

      expect(prompt).toContain('close-up');
      expect(prompt).toContain('low angle');
      expect(prompt).toContain('John');
      expect(prompt).toContain('looks surprised');
    });
  });

  describe('API integration', () => {
    it('calls SDXL with correct parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ output: ['image-url'] }),
      });
      global.fetch = mockFetch;

      await StoryboardService.generateImage({
        prompt: 'test prompt',
        provider: 'sdxl',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.replicate.com/v1/predictions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('sdxl'),
        })
      );
    });
  });
});
```

---

### TDD Test Utilities

Create `src/test-utils/index.ts`:

```typescript
import { CutlineDB } from '@/services/db';

export async function createTestDB(): Promise<CutlineDB> {
  const db = new CutlineDB(`test-${Date.now()}`);
  await db.open();
  return db;
}

export async function createTestScene(db: CutlineDB): Promise<Scene> {
  const project = await db.projects.add({
    id: crypto.randomUUID(),
    name: 'Test Project',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const script = await db.scripts.add({
    id: crypto.randomUUID(),
    projectId: project.id,
    content: '',
  });

  return await db.scenes.add({
    id: crypto.randomUUID(),
    scriptId: script.id,
    order: 0,
    heading: 'INT. TEST - DAY',
  });
}

export async function createSceneWithShots(
  db: CutlineDB,
  count: number
): Promise<{ scene: Scene; shots: Shot[] }> {
  const scene = await createTestScene(db);
  const shots: Shot[] = [];

  for (let i = 0; i < count; i++) {
    const shot = await db.shots.add({
      id: crypto.randomUUID(),
      sceneId: scene.id,
      shotNumber: i + 1,
      type: 'wide',
      angle: 'eye-level',
      movement: 'static',
      charactersInFrame: [],
      actionDescription: `Shot ${i + 1}`,
      confirmed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    shots.push(shot);
  }

  return { scene, shots };
}

export async function createConfirmedSceneWithShots(
  db: CutlineDB,
  count: number
): Promise<{ scene: Scene; shots: Shot[] }> {
  const { scene, shots } = await createSceneWithShots(db, count);
  const now = new Date();

  for (const shot of shots) {
    await db.shots.update(shot.id, { confirmed: true, confirmedAt: now });
    shot.confirmed = true;
    shot.confirmedAt = now;
  }

  return { scene, shots };
}
```

---

### TDD Commands

```bash
# Run tests in watch mode during development
npm run test:watch

# Run specific test file
npm run test -- src/services/__tests__/confirmationService.test.ts

# Run with coverage (target: >80%)
npm run test:coverage

# Run only paradigm enforcement tests
npm run test -- --grep "Paradigm"
```

---

### TDD Checklist Per Phase

Before starting each phase implementation:

- [ ] **Write test file first** with failing tests describing expected behavior
- [ ] **Run tests** - confirm they fail for the right reasons
- [ ] **Implement minimal code** to make tests pass
- [ ] **Refactor** while keeping tests green
- [ ] **Achieve >80% coverage** before moving to next phase
- [ ] **All paradigm tests pass** (for phases 7-10)

---

## Testing Strategy

### Paradigm Enforcement Tests

```typescript
describe('Shot-List-First Paradigm', () => {
  it('prevents generation without confirmation', async () => {
    const scene = await createSceneWithShots(5);
    // Try to generate without confirming
    const result = await StoryboardService.generateForScene(scene.id);
    expect(result.isErr()).toBe(true);
    expect(result.unwrapErrorOr(null).kind).toBe('validation');
  });

  it('allows generation after confirmation', async () => {
    const scene = await createSceneWithShots(5);
    await ShotListConfirmationService.confirmShotList(scene.id);
    const result = await StoryboardService.generateForScene(scene.id);
    expect(result.isOk()).toBe(true);
  });

  it('locks shots after confirmation', async () => {
    const scene = await createSceneWithShots(5);
    await ShotListConfirmationService.confirmShotList(scene.id);
    const result = await ShotService.updateShot(shotId, { type: 'close-up' });
    expect(result.isErr()).toBe(true);
  });
});
```

### Integration Tests
- Script → Breakdown → verify scenes extracted
- Shots → Confirmation → verify lock state
- Confirmation → Generation → verify storyboards created
- Unlock → Edit → verify changes saved

---

## Acceptance Criteria

### Shot-List-First Paradigm (Critical)
- [ ] Can create/edit/delete shots when list is unconfirmed
- [ ] Must confirm shot list before generation (enforced)
- [ ] Confirmed shot list is locked (no accidental edits)
- [ ] Can unlock shot list for editing
- [ ] Generation shows cost estimate before starting
- [ ] Each confirmed shot generates exactly ONE storyboard panel

### Core Functionality
- [ ] Can create/write Fountain scripts with syntax highlighting
- [ ] Script parses into scenes and breakdown automatically
- [ ] AI suggests shots based on scene content
- [ ] Can accept/edit/reject AI suggestions
- [ ] Can refine storyboards with text prompts
- [ ] Can export storyboards as files
- [ ] All data persists locally in IndexedDB
- [ ] Works offline after first load

### UI/UX (From Mockups)
- [ ] Desktop three-column layout matches mockup.html
- [ ] Mobile responsive design matches mockup-mobile.html
- [ ] Scene navigator shows INT/EXT icons
- [ ] Shot list table allows inline editing
- [ ] Filmstrip displays storyboard panels
- [ ] Focus mode hides chrome
- [ ] 44px minimum touch targets on mobile

---

## Validation Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests (target: >80% coverage)
npm run test
npm run test:coverage

# Build
npm run build
npm run preview

# PWA validation
npm run build
# Test: load app, verify install prompt, test offline
```

---

## Manual Testing Checklist (Paradigm Verification)

1. ☐ Create new project
2. ☐ Write 3-scene Fountain script
3. ☐ Verify breakdown extracts scenes correctly
4. ☐ Scene 1: Add 5 shots manually
5. ☐ Try to generate storyboards → **Should fail with "Confirm shot list first"**
6. ☐ Confirm shot list → Verify lock icon appears
7. ☐ Try to edit a shot → **Should be blocked**
8. ☐ Generate storyboards → Verify 5 panels created
9. ☐ Unlock shot list → Edit a shot → Re-confirm
10. ☐ Generate again → Verify cost shown, progress tracked
11. ☐ Refine 1 storyboard
12. ☐ Export storyboards
13. ☐ Test on mobile viewport
14. ☐ Test offline mode

---

## Key Architectural Decisions

### Why Shot-List-First?
**Reference**: PRD lines 33-39

> "The confirmed shot list is the specification for storyboard generation. No surprise storyboards: every storyboard panel corresponds to an approved shot."

This paradigm ensures:
1. **Creative control**: Directors approve before AI generates
2. **Cost transparency**: Know exact cost before generating
3. **No waste**: No credits spent on unwanted storyboards
4. **Clear workflow**: Explicit confirmation gate

### Why IndexedDB?
**Reference**: architecture.md lines 113-118

- Browser-only MVP requires local storage
- Privacy-friendly (projects stay local)
- Works offline
- Can export/import for backup

### Why fp-ts Facade?
**Reference**: architecture.md lines 143-158

- Type-safe error handling
- Null safety with Option<T>
- Composable async operations
- Single error domain (AppError)
- Never import fp-ts directly

---

## Progress Tracking Files

Two files track different aspects of progress:

### prd.json - Feature Status & Acceptance Criteria

The `prd.json` file is the **single source of truth for feature status** and acceptance criteria tracking.

```
prd.json
├── project          # Project metadata (name, version, phase)
├── paradigm         # Shot-list-first philosophy and rules
├── architecture     # Tech stack decisions
├── features         # All features with status, user stories, acceptance criteria
├── acceptanceCriteria  # Implementation tracking by phase
├── qualityGates     # Test coverage, type-check, linting targets
└── knownIssues      # Documented bugs and blockers
```

**Use prd.json for:**
- Tracking feature status (`not_started` → `in_progress` → `complete`)
- Acceptance criteria verification
- Quality gate metrics
- Known issues and blockers

**Feature Status Values:**

| Status | Meaning |
|--------|---------|
| `complete` | Fully implemented and tested |
| `partial` | Some criteria met, work in progress |
| `in_progress` | Currently being worked on |
| `not_started` | Not yet begun (default) |
| `blocked` | Waiting on dependency or external factor |

**Workflow:**
```bash
# Before starting a feature
# Update status to "in_progress" in prd.json

# After completing a feature
# 1. Update feature status to "complete"
# 2. Mark acceptance criteria as "passed" with evidence
# 3. Add lesson learned to progress.txt
```

### progress.txt - Lessons Learned

The `progress.txt` file captures **retrospective notes and lessons learned** when completing user stories.

**Use progress.txt for:**
- What went well / challenges encountered
- Key decisions and their outcomes
- Patterns to continue / avoid
- Code references and test locations
- Retrospective insights

**When to update:**
- After completing each feature/user story
- After resolving significant issues
- After making important technical decisions

### Summary

| File | Purpose | When to Update |
|------|---------|----------------|
| `prd.json` | Status tracking, acceptance criteria | Start/complete features, pass criteria |
| `progress.txt` | Lessons learned, retrospectives | After completing user stories |

### Key Paradigm Features

The shot-list-first paradigm is enforced by these critical features (in prd.json):

| Feature | Role | Flags |
|---------|------|-------|
| #1.7 Shot List Editor | Define shots before generation | — |
| #1.9 Shot List Confirmation | **GATE** - Lock before generation | `paradigm: true`, `priority: critical` |
| #6 AI Storyboard Generation | **REQUIRES** confirmed shot list | `paradigm: true`, `priority: critical` |

---

## Known Limitations (Phase 1)

- No video generation (Phase 1.1)
- No cloud sync (Phase 3)
- No user accounts (Phase 3)
- No character visual references (Phase 1.1)
- Single user only (local)
