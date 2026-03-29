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

Cutline Phase 1 MVP is a full-stack web application with PWA functionality that transforms Fountain-format scripts into storyboards through an AI-assisted workflow.

**Target Users**: Filmmakers and storytellers (primary), short video creators (secondary)

**Architecture**:
- **Frontend**: React + TypeScript + Vite PWA (installable, offline-capable)
- **Backend**: Bun + Elysia + SQLite (authentication, persistence, AI proxy)
- **Sync**: Offline-first with automatic sync to server

**Core Workflow**:
1. Fountain Script → Script Parsing & Breakdown
2. Shot List Creation (AI suggests → Director edits)
3. Shot List Confirmation (**critical gate**)
4. AI Storyboard Generation (from confirmed shots only)
5. Storyboard Refinement → Export

## User Story

As a filmmaker,
I want to create an account, write/edit Fountain scripts, break them down into scenes, define shot lists with AI assistance, confirm my shot list, and generate storyboard images from confirmed shots,
So that I can efficiently visualize my script before production while maintaining complete creative control, with my work securely synced across devices.

## Problem Statement

Filmmakers need to transform scripts into visual storyboards, but existing tools either:
1. Generate unexpected AI outputs without director control
2. Require manual drawing without AI assistance
3. Don't integrate script editing with shot planning and storyboard generation

## Solution Statement

Cutline Phase 1 MVP provides a full-stack web application with PWA functionality that:
- **Authenticates users** with secure JWT-based authentication
- **Parses Fountain scripts** automatically into scenes, characters, and locations
- **Provides AI-assisted shot suggestions** that directors can edit before generation
- **Requires explicit shot list confirmation** before any AI generation occurs
- **Generates storyboard panels** from confirmed shots via secure server-side AI proxy
- **Persists projects** to SQLite database with offline caching in IndexedDB
- **Works as a PWA** for installation and offline use with automatic sync
- **Secures AI API keys** on the server, never exposed to client

---

## Project Structure

```
cutline/
├── app/
│   ├── client/                    # React + TypeScript + Vite PWA frontend
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
│   │   │   ├── lib/               # FP facade, utilities
│   │   │   ├── types/             # TypeScript types (architecture.md lines 494-828)
│   │   │   └── utils/
│   │   ├── public/                # PWA assets, manifest
│   │   └── vite.config.ts
│   └── server/                    # Bun + Elysia + SQLite backend (MVP)
│       ├── src/
│       │   ├── routes/            # API endpoints
│       │   │   ├── auth.ts        # Signup, login, JWT
│       │   │   ├── projects.ts    # Project CRUD
│       │   │   ├── ai.ts          # AI proxy endpoints
│       │   │   └── sync.ts        # Offline sync
│       │   ├── db/                # Database layer
│       │   │   ├── schema.ts      # SQLite schema
│       │   │   └── migrations.ts  # Migration runner
│       │   ├── services/          # Business logic
│       │   │   ├── auth.service.ts
│       │   │   ├── project.service.ts
│       │   │   └── ai-proxy.service.ts
│       │   ├── middleware/        # Auth, CORS, logging
│       │   └── index.ts           # Elysia app entry
│       ├── data/                  # SQLite database files
│       └── bunfig.toml            # Bun configuration
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
**Goal**: Set up full-stack project with all core systems

#### 1.1 Project Initialization
```bash
# Create structure
mkdir -p app/client/src/{components/{editor,breakdown,shots,storyboards,ui,layout},hooks,stores,services,types,lib/fp,utils}
mkdir -p app/client/public
mkdir -p app/server/src/{routes,services,db,middleware}
mkdir -p app/server/data

# Initialize frontend (Vite + React + TypeScript)
cd app/client
npm create vite@latest . -- --template react-ts
npm install

# Initialize backend (Bun + Elysia)
cd ../server
bun init
bun add elysia @elysia/jwt @elysia/cors
```

#### 1.2 Frontend Dependencies
**From architecture.md Frontend section**:
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

#### 1.3 Backend Dependencies
```bash
cd app/server
bun add elysia \
         @elysia/jwt \
         @elysia/cors \
         jose \
         zod
```

#### 1.4 TypeScript Configuration
**Frontend** (app/client/tsconfig.json):
- Strict mode enabled
- Path aliases: `@/lib/*`, `@/components/*`, `@/services/*`, `@/types/*`
- ES2020 target with JSX support

**Backend** (app/server/tsconfig.json):
- Strict mode enabled
- Path aliases for clean imports
- ES2022 target for Bun

#### 1.5 Vite Configuration with PWA
**From architecture.md**:
- Path aliases matching tsconfig
- PWA plugin with workbox for offline support
- API proxy to backend server
- Build optimization with code splitting

#### 1.6 Backend Server Setup
```typescript
// app/server/src/index.ts
import { Elysia } from 'elysia';
import { cors } from '@elysia/cors';
import { jwt } from '@elysia/jwt';

const app = new Elysia()
  .use(cors())
  .use(jwt({ secret: process.env.JWT_SECRET }))
  .get('/health', () => ({ status: 'ok' }))
  .listen(3001);

console.log(`Backend running at http://localhost:${app.server?.port}`);
```

#### 1.7 PWA Manifest
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

### Phase 1.5: Backend API Implementation
**Goal**: Set up Bun + Elysia backend with authentication and API proxy

#### 1.5.1 Backend Project Structure
```
app/server/
├── src/
│   ├── index.ts              # Elysia app entry point
│   ├── routes/
│   │   ├── auth.ts           # POST /auth/signup, /auth/login
│   │   ├── projects.ts       # GET/POST/PUT/DELETE /projects
│   │   ├── scenes.ts         # Scene CRUD operations
│   │   ├── shots.ts          # Shot CRUD + confirmation
│   │   ├── ai.ts             # AI proxy endpoints (generation)
│   │   └── sync.ts           # Offline sync endpoint
│   ├── db/
│   │   ├── index.ts          # SQLite connection
│   │   ├── schema.sql        # Database schema
│   │   └── migrations.ts     # Migration runner
│   ├── services/
│   │   ├── auth.service.ts   # Password hashing, JWT generation
│   │   ├── project.service.ts
│   │   └── ai-proxy.service.ts  # Secure API key handling
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification middleware
│   │   ├── cors.ts           # CORS configuration
│   │   └── error.ts          # Error handling
│   └── types/
│       └── index.ts          # Shared types with frontend
├── data/                     # SQLite database files
├── bunfig.toml               # Bun configuration
└── package.json
```

#### 1.5.2 SQLite Schema
```sql
-- app/server/src/db/schema.sql

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,  -- 'replicate' | 'dashscope'
  encrypted_key TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  visual_style TEXT,
  color_palette TEXT,  -- JSON array
  tone TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scripts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  fountain_text TEXT,
  parsed_data TEXT,  -- JSON
  format TEXT DEFAULT 'fountain',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scenes (
  id TEXT PRIMARY KEY,
  script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  heading TEXT NOT NULL,
  location TEXT,
  interior INTEGER DEFAULT 1,
  time_of_day TEXT,
  scene_order INTEGER,
  metadata TEXT  -- JSON
);

CREATE TABLE shots (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  shot_number INTEGER NOT NULL,
  type TEXT NOT NULL,
  angle TEXT NOT NULL,
  movement TEXT NOT NULL,
  characters_in_frame TEXT,  -- JSON array
  action_description TEXT,
  duration REAL,
  notes TEXT,
  confirmed INTEGER DEFAULT 0,
  confirmed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE storyboards (
  id TEXT PRIMARY KEY,
  shot_id TEXT NOT NULL REFERENCES shots(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  generation_params TEXT,  -- JSON
  api_provider TEXT,
  cost REAL,
  style TEXT,
  version INTEGER DEFAULT 1,
  previous_versions TEXT,  -- JSON
  refinement_prompt TEXT
);

-- Indexes for performance
CREATE INDEX idx_shots_scene ON shots(scene_id);
CREATE INDEX idx_shots_confirmed ON shots(confirmed);
CREATE INDEX idx_scenes_script ON scenes(script_id);
CREATE INDEX idx_projects_user ON projects(user_id);
```

#### 1.5.3 Authentication Service
```typescript
// app/server/src/services/auth.service.ts
import { sign, verify } from 'jose';
import { hash, compare } from 'bcrypt';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export class AuthService {
  static async signup(email: string, password: string) {
    const passwordHash = await hash(password, 12);
    const user = await db.users.create({
      id: crypto.randomUUID(),
      email,
      password_hash: passwordHash,
    });
    return this.generateToken(user.id);
  }

  static async login(email: string, password: string) {
    const user = await db.users.findByEmail(email);
    if (!user || !(await compare(password, user.password_hash))) {
      throw new Error('Invalid credentials');
    }
    return this.generateToken(user.id);
  }

  private static async generateToken(userId: string) {
    return await sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  }

  static async verifyToken(token: string) {
    const { payload } = await verify(token, JWT_SECRET);
    return payload.userId as string;
  }
}
```

#### 1.5.4 AI Proxy Service
```typescript
// app/server/src/services/ai-proxy.service.ts
// AI API keys are stored encrypted on server, never exposed to client

export class AIProxyService {
  static async generateImage(
    userId: string,
    provider: 'sdxl' | 'wanxiang',
    params: GenerationParams
  ): Promise<GeneratedImage> {
    // Get encrypted API key for user
    const keyRecord = await db.api_keys.findByUserAndProvider(userId, provider);
    if (!keyRecord) {
      throw new Error(`No API key configured for ${provider}`);
    }

    const apiKey = decrypt(keyRecord.encrypted_key);

    // Proxy to AI provider
    if (provider === 'sdxl') {
      return this.callSDXL(apiKey, params);
    } else {
      return this.callWanxiang(apiKey, params);
    }
  }

  private static async callSDXL(apiKey: string, params: GenerationParams) {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: SDXL_MODEL_VERSION,
        input: this.buildSDXLInput(params),
      }),
    });
    // ... handle response
  }
}
```

#### 1.5.5 Elysia Routes
```typescript
// app/server/src/routes/auth.ts
import { Elysia, t } from 'elysia';
import { AuthService } from '../services/auth.service';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/signup', async ({ body }) => {
    const { email, password } = body;
    const token = await AuthService.signup(email, password);
    return { token };
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String({ minLength: 8 }),
    }),
  })
  .post('/login', async ({ body }) => {
    const { email, password } = body;
    const token = await AuthService.login(email, password);
    return { token };
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    }),
  });
```

#### 1.5.6 Sync Endpoint
```typescript
// app/server/src/routes/sync.ts
// Offline-first sync with conflict resolution

export const syncRoutes = new Elysia({ prefix: '/sync' })
  .use(authMiddleware)
  .post('/push', async ({ body, user }) => {
    // Receive changes from client
    const { changes, lastSyncAt } = body;

    // Apply changes with conflict detection
    const conflicts = await SyncService.applyChanges(user.id, changes, lastSyncAt);

    return { conflicts, syncedAt: new Date().toISOString() };
  })
  .get('/pull', async ({ query, user }) => {
    // Send changes since last sync
    const { since } = query;
    const changes = await SyncService.getChangesSince(user.id, since);
    return { changes, syncedAt: new Date().toISOString() };
  });
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

### Phase 1.5 TDD: Backend API

#### 1.5.1 Backend Test Structure
```
app/server/
├── src/
│   └── __tests__/
│       ├── auth.test.ts
│       ├── projects.test.ts
│       ├── ai-proxy.test.ts
│       └── sync.test.ts
```

#### 1.5.2 TDD Cycle: Authentication

**🔴 RED - Define auth behavior first:**
```typescript
// app/server/src/__tests__/auth.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { AuthService } from '../services/auth.service';

describe('AuthService', () => {
  describe('signup', () => {
    it('hashes password with bcrypt', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const result = await AuthService.signup(email, password);

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(email);
      expect(result.user.password_hash).not.toBe(password);
    });

    it('rejects duplicate emails', async () => {
      await AuthService.signup('dup@example.com', 'password123');

      await expect(
        AuthService.signup('dup@example.com', 'different')
      ).rejects.toThrow('Email already exists');
    });

    it('validates email format', async () => {
      await expect(
        AuthService.signup('invalid-email', 'password123')
      ).rejects.toThrow('Invalid email');
    });
  });

  describe('login', () => {
    it('returns JWT token on success', async () => {
      await AuthService.signup('login@example.com', 'password123');

      const result = await AuthService.login('login@example.com', 'password123');

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('login@example.com');
    });

    it('rejects wrong password', async () => {
      await AuthService.signup('wrong@example.com', 'password123');

      await expect(
        AuthService.login('wrong@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

#### 1.5.3 TDD Cycle: AI Proxy

**🔴 RED - Define proxy behavior:**
```typescript
// app/server/src/__tests__/ai-proxy.test.ts
import { describe, it, expect, vi } from 'bun:test';
import { AIProxyService } from '../services/ai-proxy.service';

describe('AIProxyService', () => {
  describe('generateImage', () => {
    it('calls Replicate API with stored key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ output: ['image-url'] }),
      });
      global.fetch = mockFetch;

      const userId = 'user-123';
      const prompt = 'A close-up shot of a character';

      const result = await AIProxyService.generateImage(userId, prompt, 'sdxl');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.replicate.com/v1/predictions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Token r8_'),
          }),
        })
      );
      expect(result.imageUrl).toBe('image-url');
    });

    it('never exposes API key to client', async () => {
      const result = await AIProxyService.generateImage('user-123', 'test', 'sdxl');

      // Result should NOT contain the API key
      expect(JSON.stringify(result)).not.toContain('r8_');
    });

    it('handles rate limiting gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limited' }),
      });
      global.fetch = mockFetch;

      await expect(
        AIProxyService.generateImage('user-123', 'test', 'sdxl')
      ).rejects.toThrow('Rate limited');
    });
  });
});
```

#### 1.5.4 TDD Cycle: Sync Service

**🔴 RED - Define sync behavior:**
```typescript
// app/server/src/__tests__/sync.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { SyncService } from '../services/sync.service';

describe('SyncService', () => {
  describe('applyChanges', () => {
    it('applies valid changes', async () => {
      const userId = 'user-123';
      const changes = [
        { type: 'create', entity: 'shot', data: { id: 'shot-1', type: 'wide' } },
        { type: 'update', entity: 'shot', id: 'shot-2', data: { type: 'close-up' } },
      ];

      const result = await SyncService.applyChanges(userId, changes, null);

      expect(result.conflicts).toHaveLength(0);
      expect(result.applied).toBe(2);
    });

    it('detects conflicts on concurrent edits', async () => {
      const userId = 'user-123';
      const baseTime = new Date('2024-01-01').toISOString();

      // Create a shot
      await SyncService.applyChanges(userId, [
        { type: 'create', entity: 'shot', data: { id: 'shot-1', type: 'wide', updatedAt: baseTime } },
      ], null);

      // Simulate another client editing the same shot
      await SyncService.applyChanges(userId, [
        { type: 'update', entity: 'shot', id: 'shot-1', data: { type: 'medium' }, baseVersion: baseTime },
      ], null);

      // Try to update with stale base version
      const result = await SyncService.applyChanges(userId, [
        { type: 'update', entity: 'shot', id: 'shot-1', data: { type: 'close-up' }, baseVersion: baseTime },
      ], null);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].entity).toBe('shot');
      expect(result.conflicts[0].id).toBe('shot-1');
    });
  });
});
```

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

### Authentication & Backend (Full-Stack MVP)
- [ ] User can sign up with email and password
- [ ] User can log in with credentials
- [ ] JWT tokens manage authentication state
- [ ] Projects persist to server-side SQLite database
- [ ] AI API keys stored securely on server (never exposed to client)
- [ ] All AI generation calls proxied through backend

### Core Functionality
- [ ] Can create/write Fountain scripts with syntax highlighting
- [ ] Script parses into scenes and breakdown automatically
- [ ] AI suggests shots based on scene content
- [ ] Can accept/edit/reject AI suggestions
- [ ] Can refine storyboards with text prompts
- [ ] Can export storyboards as files

### PWA & Offline (Offline-First with Sync)
- [ ] App is installable on desktop and mobile
- [ ] Core editing works offline with IndexedDB cache
- [ ] Changes sync automatically when connection restored
- [ ] Conflict resolution handles concurrent edits
- [ ] Offline indicator shows sync status

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

## Manual Testing Checklist (Full-Stack MVP)

### Authentication Flow
1. ☐ Sign up with email and password
2. ☐ Verify password is hashed (check database)
3. ☐ Log out and log back in
4. ☐ Verify JWT token persistence
5. ☐ Test invalid login credentials rejected

### Shot-List-First Paradigm
6. ☐ Create new project
7. ☐ Write 3-scene Fountain script
8. ☐ Verify breakdown extracts scenes correctly
9. ☐ Scene 1: Add 5 shots manually
10. ☐ Try to generate storyboards → **Should fail with "Confirm shot list first"**
11. ☐ Confirm shot list → Verify lock icon appears
12. ☐ Try to edit a shot → **Should be blocked**
13. ☐ Generate storyboards → Verify 5 panels created via server proxy
14. ☐ Unlock shot list → Edit a shot → Re-confirm
15. ☐ Generate again → Verify cost shown, progress tracked

### PWA & Offline Sync
16. ☐ Install app on desktop/mobile
17. ☐ Go offline → Make edits
18. ☐ Verify offline indicator shows
19. ☐ Go online → Verify changes sync
20. ☐ Test on second device → Verify sync works

### Cross-Device
21. ☐ Login on mobile device
22. ☐ Verify projects appear
23. ☐ Make edit on mobile → Verify appears on desktop
24. ☐ Test conflict resolution (edit same entity on two devices)

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

### Why Full-Stack with PWA?
**Reference**: architecture.md Architecture Principles

- **Security**: AI API keys stored securely on server, never exposed to client
- **Persistence**: Reliable server-side storage with offline-first local cache
- **Authentication**: Proper user accounts with JWT-based sessions
- **Sync**: Automatic synchronization between devices with conflict resolution
- **Offline Support**: PWA enables working without connection, syncs when online
- **Simple Deployment**: Single server (Bun + Elysia + SQLite) = one deployable unit

### Why IndexedDB + SQLite?
**Reference**: architecture.md Storage & Persistence

- IndexedDB serves as offline-first cache in browser
- SQLite provides reliable server-side persistence
- Automatic sync between client cache and server
- Works offline with background sync when connection restored
- Conflict resolution for concurrent edits

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
- No character visual references (Phase 1.1)
- No real-time collaboration (Phase 2)
- No team workspaces (Phase 2)
- No video assembly with transitions (Phase 3)
- Single-server deployment (horizontal scaling in Phase 3+)
- No end-to-end encryption for project data (Phase 2)

---

**Document Version**: 2.1
**Last Updated**: 2026-03-29
**Architecture**: Full-Stack Web Application with PWA Functionality
