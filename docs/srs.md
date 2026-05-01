# Cutline Software Requirements Specification

Implementation-level specification for the Cutline script-to-storyboard platform. Translates PRD product requirements into technical contracts.

## 1. System Architecture

### 1.1 Stack

| Layer | Technology | Runtime |
|---|---|---|
| Frontend | React 18 + TypeScript 5, Vite | Browser |
| State | Zustand (client), TanStack Query (API) | Browser |
| Storage (client) | IndexedDB via Dexie | Browser |
| Backend | Elysia on Bun | Node/Bun |
| Storage (server) | SQLite (WAL mode, foreign keys ON) | Server |
| Auth | JWT (HS256) | Server |
| PWA | Service Worker, Web App Manifest | Browser |

### 1.2 Module Boundaries

```
app/client/src/
  components/     React UI components (no business logic)
  services/       Domain services, repositories, adapters, parser
  stores/         Zustand state stores (client-side state only)
  types/          Shared type definitions (domain + DB + UI)
  hooks/          Custom React hooks
  lib/            Utility libraries (fp-ts facade, etc.)
  styles/         CSS (tokens.css, fountain.css, component CSS)

app/server/src/
  routes/         Elysia route handlers (HTTP concern only)
  services/       Domain services (shot-service, confirmation-service, etc.)
  middleware/     Auth middleware (JWT verification)
  db/             SQLite connection + schema initialization
  types/          Server-specific types (auth, DB rows)
```

### 1.3 Data Flow

```
Component → Store Action → Adapter → Dexie (IndexedDB)
                                  ↕ sync when online
                             Server API → SQLite

Component → Service → Adapter → Dexie    (domain operations)
Component → Store   → Adapter → Dexie    (CRUD operations)
```

Services handle business rules (confirmation paradigm, validation). Stores handle UI state and simple CRUD. Adapters transform between domain types and DB types (Date ↔ ISO string).

### 1.4 Client-Side Routing

React Router v6 with URL-driven tab navigation. Each tab maps to a route:

| Route | View | Component |
|---|---|---|
| `/project/:projectId/script` | Script editor | `ScriptEditor` |
| `/project/:projectId/shots` | Shot list | `ShotListEditor` |
| `/project/:projectId/storyboards` | Storyboards | `StoryboardScreen` |
| `/project/:projectId/breakdown` | Breakdown | Placeholder |

`ProjectWorkspace` derives the active view from `useLocation().pathname`. Tab buttons call `navigate()` to update the URL. `deriveViewMode()` reads the URL path to determine which view to render.

Scene selection state lives in App component (not in the URL). Deep-linking to a specific scene is not supported yet.

---

## 2. Data Models

### 2.1 Client Domain Types

All domain types use `Date` objects. All DB types use ISO strings. Adapters convert between them.

**Project** — top-level container.

| Field | Type | Notes |
|---|---|---|
| id | `string` | `crypto.randomUUID()` |
| name | `string` | Default "Untitled Project" |
| visualStyle | `string` | Default "cinematic" |
| colorPalette | `string[]` | |
| tone | `string` | Default "neutral" |
| syncStatus | `'synced' \| 'pending' \| 'conflict'` | |
| createdAt, updatedAt | `Date` | |

**Script** — one per project.

| Field | Type | Notes |
|---|---|---|
| id | `string` | |
| projectId | `string` | FK to Project |
| fountainText | `string` | Raw Fountain text |
| format | `'fountain' \| 'av-two-column'` | |
| createdAt, updatedAt | `Date` | |

**Scene** — parsed from Fountain text.

| Field | Type | Notes |
|---|---|---|
| id | `string` | |
| scriptId | `string` | FK to Script |
| heading | `string` | e.g. "INT. COFFEE SHOP - DAY" |
| location | `string` | Parsed from heading |
| interior | `boolean` | INT vs EXT |
| timeOfDay | `TimeOfDay` | Enum: DAY, NIGHT, DAWN, etc. |
| order | `number` | Sequence in script |
| createdAt, updatedAt | `Date` | |

**Shot** — core of the shot-list-first paradigm.

| Field | Type | Notes |
|---|---|---|
| id | `string` | |
| sceneId | `string` | FK to Scene |
| shotNumber | `number` | Sequential per scene |
| type | `ShotType` | wide, medium, close-up, extreme-cu, two-shot, over-the-shoulder, establishing, insert |
| angle | `CameraAngle` | eye-level, high-angle, low-angle, dutch-angle, birds-eye, worms-eye |
| movement | `CameraMovement` | static, pan, tilt, dolly, truck, pedestal, arc, handheld, steadicam |
| charactersInFrame | `string[]` | Character names |
| actionDescription | `string` | What happens in this shot |
| duration | `number` | Seconds |
| notes | `string?` | Director notes |
| **confirmed** | `boolean` | **Required for storyboard generation** |
| confirmedAt | `Date?` | Timestamp of confirmation |
| createdAt, updatedAt | `Date` | |

**StoryboardPanel** — generated from a confirmed shot.

| Field | Type | Notes |
|---|---|---|
| id | `string` | |
| shotId | `string` | FK to Shot |
| imageUrl | `string` | Generated image URL or data URL |
| apiProvider | `ApiProvider` | sdxl \| wanxiang |
| cost | `number` | API cost in USD |
| style | `StoryboardStyle` | pencil-sketch, ink-drawing, manga-comic, watercolor |
| version | `number` | Incremented on refinement |
| previousVersions | `StoryboardPanelVersion[]` | For undo |
| refinementPrompt | `string?` | Last refinement prompt |
| generatedAt | `Date` | |

### 2.2 Enum Values

```
ShotType:        wide | medium | close-up | extreme-cu | two-shot |
                 over-the-shoulder | establishing | insert

CameraAngle:     eye-level | high-angle | low-angle | dutch-angle |
                 birds-eye | worms-eye

CameraMovement:  static | pan | tilt | dolly | truck | pedestal |
                 arc | handheld | steadicam

TimeOfDay:       DAY | NIGHT | DAWN | DUSK | MORNING | AFTERNOON |
                 EVENING | MAGIC HOUR

StoryboardStyle: pencil-sketch | ink-drawing | manga-comic | watercolor

ApiProvider:     sdxl | wanxiang
```

### 2.3 Client Database Schema (IndexedDB/Dexie)

Version 1 schema. Indexes support the shot-list-first paradigm.

| Table | Primary Key | Indexes |
|---|---|---|
| projects | id | name, createdAt, updatedAt |
| scripts | id | projectId |
| scenes | id | scriptId, order, [scriptId+order] |
| **shots** | id | sceneId, shotNumber, confirmed, **[sceneId+shotNumber]** |
| storyboards | id | shotId |
| characters | id | projectId, name, [projectId+name] |
| comments | id | entityType, entityId, [entityType+entityId] |
| versions | id | projectId, entityType, createdAt, [projectId+createdAt] |

### 2.4 Server Database Schema (SQLite)

Server DB uses `snake_case` column names. Foreign keys enforced.

```sql
users:           id, email, password_hash, created_at, updated_at
api_keys:        id, user_id, provider, encrypted_key, created_at
projects:        id, user_id, name, visual_style, color_palette, tone,
                 created_at, updated_at
```

---

## 3. Fountain Parser Specification

### 3.1 Element Detection Rules

The parser processes lines top-down. First match wins. State tracked: `inDialogueBlock`, `currentCharacter`.

| Priority | Element | Detection Rule | State Effect |
|---|---|---|---|
| 1 | Scene Heading | `REGEX: /^(INT\|EXT\|EST\|INT./EXT\|I/E)[. ]/i` or starts with `.` | Resets dialogue block |
| 2 | Character | Uppercase letters+digits+spaces, no INT/EXT prefix | Sets `inDialogueBlock=true` |
| 3 | Parenthetical | Text wrapped in `()`, only inside dialogue block | No state change |
| 4 | Dialogue | Leading whitespace OR following a character line | No state change |
| 5 | Transition | `FADE IN:`, `CUT TO:`, `DISSOLVE TO:`, `TO:` suffix, etc. | Resets dialogue block |
| 6 | Centered | `> text <` | No state change |
| 7 | Lyrics | Starts with `~` | No state change |
| 8 | Page Break | `===` (3+ equals) | No state change |
| 9 | Action | Default fallback | Resets dialogue block |

### 3.2 Parse Output

`FountainParser.parse(text)` returns `Result<AppError, ParsedScript>`:

```
ParsedScript {
  title?: string
  author?: string
  scenes: ParsedScene[]
  characters: Map<string, CharacterStats>  // name → {dialogueCount, sceneAppearances}
  metadata: { pageCount, wordCount, estimatedDuration }
}
```

`FountainParser.getHighlightTokens(text)` returns `Result<AppError, ParseToken[]>`:

```
ParseToken {
  type: 'scene_heading' | 'action' | 'character' | 'dialogue' |
        'parenthetical' | 'transition' | 'centered' | 'lyrics' |
        'page_break' | 'section' | 'synopse'
  text: string
  lineNumber: number
  metadata?: Record<string, unknown>
}
```

### 3.3 Scene Heading Parsing

Input: `"INT. COFFEE SHOP - DAY"` → Output:
- `location`: "COFFEE SHOP"
- `interior`: true
- `timeOfDay`: "DAY"

Scene heading regex: `/^((?:\*{0,3}_?)?(?:(?:INT|EXT|EST|INT\.?\/EXT|EXT\.?\/INT|I\/E)[. ]).+)|^(?:\.(?!\.+))(.+)/i`

### 3.4 Duration Estimation

`estimatedDuration = wordCount / 250` (rounded, in minutes). Based on ~250 words per minute average reading pace for screenplays.

---

## 4. Script Editor Specification

### 4.1 Architecture: Textarea Overlay Pattern

The script editor uses two synchronized layers:

1. **Textarea** (bottom layer) — handles input, cursor, selection. `color: transparent` so text is invisible.
2. **FountainHighlight overlay** (top layer, `pointer-events: none`) — renders syntax-highlighted text with CSS classes per element type.

Both layers share identical text content and dimensions. Cursor alignment requires character-by-character position matching.

### 4.2 Hollywood Standard Rendering

Design tokens for element widths (defined in `tokens.css`):

```css
--script-action-width: 60ch;
--script-character-width: 20ch;
--script-dialogue-width: 35ch;
--script-parenthetical-width: 20ch;
--script-font-size: 13pt;
--script-line-height: 1.4;
```

CSS classes per element type (defined in `fountain.css`):

| Element | CSS Class | Alignment | Width | Extra Styling |
|---|---|---|---|---|
| Scene Heading | `.fountain-scene-heading` | Left | 60ch (inherited) | Uppercase, bold, gold |
| Action | `.fountain-action` | Left | 60ch | Primary text color |
| Character | `.fountain-character` | Center (margin: auto) | max-width 20ch | Uppercase, semibold, blue |
| Dialogue | `.fountain-dialogue` | Center (margin: auto) | max-width 35ch | Primary text color |
| Parenthetical | `.fountain-parenthetical` | Center (margin: auto) | max-width 20ch | Italic, muted gray |
| Transition | `.fountain-transition` | Right | 60ch (inherited) | Uppercase, purple |
| Shot | `.fountain-shot` | Left | 60ch (inherited) | Uppercase, orange |

### 4.3 Whitespace Handling for Centered Elements

Fountain text uses leading whitespace for indentation (e.g., 20 spaces + "JANE"). The overlay strips leading whitespace for character, dialogue, and parenthetical elements so CSS `text-align: center` + `margin: auto` position the visible text correctly.

Implementation: `FountainHighlight.tsx` checks element type against a set of centered types and applies `line.trimStart()` before rendering.

### 4.4 CSS Cascade Constraint

`.fountain-line` base styles must be declared BEFORE element-specific styles in `fountain.css`. Same specificity (0,1,0) means later rule wins — if `.fountain-line { margin: 0 }` appears after `.fountain-character { margin-left: auto }`, the auto margin is overridden.

### 4.5 Page Delineation

Screenplays follow the industry convention of ~55 lines per page (1 page ≈ 1 minute of screen time). The editor renders visual page boundaries in the infinite-scroll layout.

**Constant**: `LINES_PER_PAGE = 55` (defined in `ScriptEditor.tsx`).

**Page divider rendering**:

1. **Line numbers** (`ScriptEditor.tsx`): Each line number is calculated as `(lineIndex % LINES_PER_PAGE) + 1`. When `lineIndex % LINES_PER_PAGE === 0` and `lineIndex > 0`, a `fountain-page-divider` element is rendered before the line number.

2. **Syntax overlay** (`FountainHighlight.tsx`): The same divider logic is applied in the overlay. When `index % linesPerPage === 0` and `index > 0`, a `<div className="fountain-page-divider">` is inserted before the highlighted line.

**CSS** (`fountain.css`):

```css
.fountain-page-divider {
  border-top: 1px dashed var(--border-light);
  margin: var(--space-4) 0;
  opacity: 0.5;
}
```

Dividers are dashed and semi-transparent to be visible but non-distracting. They do not affect the textarea content or cursor position.

**Per-page line numbers**: Line numbers restart at 1 at each page boundary. This matches how screenwriters reference locations ("page 3, line 12") and how production teams communicate.

---

## 5. Shot List System Specification

### 5.1 Shot-List-First Paradigm

The core business rule: **no storyboard generation without a confirmed shot list**.

Enforcement layers:
- **Service layer**: `ConfirmationService` checks `shot.confirmed === true` before generation
- **API layer**: Server returns `PARADIGM_VIOLATION` error if generation attempted on unconfirmed shots
- **UI layer**: Generate button disabled until shot list confirmed

### 5.2 Shot Generation Algorithm

`generateShotsFromScene(scene: ParsedScene): Shot[]`

Algorithm processes scene elements sequentially:

1. **First action block** → `establishing` shot (eye-level, static, 3s) with scene heading as description
2. **Subsequent action blocks** → `wide` shot (or `two-shot` if 2+ characters), duration = `ceil(words * 0.5)`
3. **Character + dialogue block** → alternating `over-the-shoulder` / `close-up` shots, duration = `ceil(words * 0.3)`
4. **Transitions** → skipped (no shot generated)

All generated shots have `confirmed: false`.

### 5.3 Shot Confirmation Flow

```
Director edits shot list → clicks "Confirm Shot List"
  → ConfirmationService.confirmShots(sceneId)
    → Validate: at least 1 shot exists
    → Update all shots: confirmed=true, confirmedAt=now
    → Return confirmed shots
  → UI shows locked state, enables "Generate Storyboards"
```

Unlock returns shots to `confirmed: false`.

### 5.4 Shot List Editor UI — Implementation

Per-scene tabular interface using a div-based grid (not HTML `<table>`). Components:

- **`ShotListEditor`**: Orchestrator. Receives `initialShots` prop for auto-seeding. Manages editing state. Uses `displayShots` (hook data or `initialShots` fallback) for all rendering.
- **`ShotRow`**: Renders a shot as a grid row (`<div>` elements with `shot-list-editor__row` / `shot-list-editor__cell` classes). Imports `ShotForm` for inline editing.
- **`ShotForm`**: Inline form for add/edit. `onSave` accepts `ShotData` (not `Partial<ShotData>`). `shotNumber` and `isCreating` props for context.
- **`ShotListStatus`**: Presentational. Accepts `shotCount`, `isConfirmed`, `confirmedAt` as props — no internal hooks.
- **`ConfirmationButton`**: Presentational. Accepts `shotCount`, `isConfirmed`, `onConfirm`, `onUnlock`, `isConfirming`, `isUnlocking` — no internal state or modal.

**Auto-seed pattern**: `ShotListEditor` uses a `hasSeeded` ref to prevent double-seeding. When `useShots(sceneId)` returns empty and `initialShots` are provided, each shot is persisted via `createShot.mutateAsync({ sceneId, data })`. This bridges the gap between generated in-memory shots and the IndexedDB-backed confirmation workflow.

**Styles**: `shot-list.css` defines all BEM classes using design tokens. Column widths: `#` (40px), Type (100px), Angle (100px), Movement (100px), Characters (120px), Action (1fr), Duration (70px), Actions (auto).

Keyboard: Tab advances fields, Enter adds new shot, Escape cancels edit.

---

## 5.5. Storyboard Screen Specification

### 5.5.1 Architecture

`StoryboardScreen` orchestrates the storyboard view for a single scene. It does not use the existing `StoryboardStrip` or `StoryboardPanel` components — it renders its own card grid layout.

**Data flow**:
```
StoryboardScreen
  ├── useShots(sceneId) → shots from IndexedDB
  ├── useShotListConfirmationStatus(sceneId) → isConfirmed
  ├── useStoryboardsForShots(shotIds) → Map<shotId, StoryboardPanel>
  ├── .storyboard-grid → array of .storyboard-card elements
  ├── StoryboardGenerator (shown when not all panels generated)
  └── RefinementPanel (shown when card selected)
```

### 5.5.2 Batch Storyboard Query Hook

`useStoryboardsForShots(shotIds: string[])` — single `useQuery` hook that fetches all storyboards for an array of shot IDs in one IndexedDB query using `repo.findByShotIds(shotIds)`. Returns `Map<string, StoryboardPanel>`.

**Why not per-shot hooks**: The initial implementation called `useStoryboardForShot(shotId)` inside a `.map()` over `displayShots`. This violated React's Rules of Hooks — when shot count changed between renders, hook call count changed, causing 9 console errors and a blank screen. The batch hook calls `useQuery` exactly once regardless of shot count.

### 5.5.3 Card Grid Layout

```
.storyboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 280px);
  grid-auto-rows: max-content;
  align-items: start;
  align-content: start;
  gap: var(--space-4);
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
```

- **Fixed 280px columns**: Cards never resize. Only column count changes with viewport (4 cols @ 1920px, 3 @ 1512px, 2 @ 1280px, 1 @ 800px).
- **`grid-auto-rows: max-content`**: Each row sizes to its card's natural height. Without this, CSS Grid compressed rows to ~70px, and `overflow: hidden` on cards clipped all content.
- **`align-items: start` + `align-content: start`**: Prevents grid from stretching cards vertically. Rows pack at the top; grid scrolls via `overflow-y: auto`.
- **`.storyboard-card { height: max-content }`**: Ensures cards report full content height for correct row measurement.

### 5.5.4 Card Structure

Each `.storyboard-card` contains:

1. **Image area**: `.storyboard-card__image-area` (16:9 aspect ratio)
   - Generated: `<img>` with storyboard image
   - Placeholder: `.storyboard-card__placeholder` showing "Shot N / Generate"

2. **Annotations**: `.storyboard-card__annotations`
   - Header row (3-col grid): Scene | Frame | Time
   - Description row (full-width): action description
   - Script row (full-width): type / angle / movement — characters
   - Footer row (2-col grid): Sound | Music

### 5.5.5 Paradigm Gate States

| Condition | Rendered |
|---|---|
| No shots | Empty state: "Go to the Shots tab to create your shot list first." |
| Shots not confirmed | Warning: "Confirm Your Shot List" with explanation |
| Shots confirmed, panels missing | Card grid with placeholders + StoryboardGenerator |
| All panels generated | Card grid only (no generator) |

### 5.5.6 Refinement Panel

- Desktop: slides in from right (400px width, `slideInRight` animation)
- Mobile: slides up from bottom (100% width, `slideUpMobile` animation)
- Contains: image preview, prompt textarea, style selector, generate button, cost display
- Escape key closes panel
- `onRefined` callback updates local `storyboardMap` state optimistically

---

## 6. API Specification

### 6.1 Server Endpoints

Base URL: `http://localhost:3001`

**Auth** (no auth required):

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/auth/signup` | `{ email, password }` | `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |

**Projects** (JWT required):

| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List user's projects |
| POST | `/projects` | Create project |
| GET | `/projects/:id` | Get project |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |

**Shots** (JWT required):

| Method | Path | Description |
|---|---|---|
| GET | `/shots/scene/:sceneId` | List shots for scene |
| POST | `/shots/scene/:sceneId` | Create shot |
| PUT | `/shots/:id` | Update shot |
| DELETE | `/shots/:id` | Delete shot |
| POST | `/shots/scene/:sceneId/confirm` | Confirm all shots in scene |

**Storyboards** (JWT required):

| Method | Path | Description |
|---|---|---|
| POST | `/storyboards/generate/:shotId` | Generate storyboard for confirmed shot |
| GET | `/storyboards/shot/:shotId` | Get storyboards for shot |
| POST | `/storyboards/:id/refine` | Refine with prompt |

**AI** (JWT required):

| Method | Path | Description |
|---|---|---|
| POST | `/ai/suggest-shots/:sceneId` | Get AI shot suggestions |

**Sync** (JWT required):

| Method | Path | Description |
|---|---|---|
| POST | `/sync/push` | Push local changes |
| GET | `/sync/pull` | Pull remote changes |

### 6.2 Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

Error codes: `INTERNAL_ERROR`, `PARADIGM_VIOLATION`, `UNAUTHORIZED`, `NOT_FOUND`, `VALIDATION_ERROR`.

### 6.3 Authentication

JWT token in `Authorization: Bearer <token>` header. Token payload:

```typescript
{ userId: string, email: string, iat: number }
```

### 6.4 Paradigm Violation Response

When storyboard generation is attempted on unconfirmed shots:

```json
{
  "error": "PARADIGM_VIOLATION",
  "message": "Cannot generate storyboards for scene X: shot list not confirmed"
}
```

---

## 7. State Management Specification

### 7.1 Client Stores (Zustand)

**useProjectStore** — project CRUD and sync state.

State: `projects[]`, `currentProject`, `isLoading`, `error`, `isOnline`, `lastSyncAt`, `pendingChanges`

Actions: `loadProjects`, `loadProject`, `createProject`, `updateProject`, `deleteProject`, `setCurrentProject`, `syncWithServer`, `setOnline`

Sync: listens to `window online/offline` events. Auto-syncs when coming online.

**useConfirmationStore** — shot confirmation state.

**useUIStore** — view mode, sidebar state, selections.

State: `viewMode` (script | split | storyboard), `currentSceneId`, `currentShotId`, sidebar toggles, focus mode, `hasUnconfirmedChanges`.

### 7.2 Offline-First Pattern

1. All writes go to IndexedDB first (immediate, offline-safe)
2. `syncStatus` set to `'pending'` on write
3. When online: push pending changes to server, pull remote changes, resolve conflicts, set `syncStatus: 'synced'`
4. Conflict resolution: last-write-wins (based on `updatedAt` timestamp)

---

## 8. PWA Specification

### 8.1 Service Worker

- Strategy: NetworkFirst for API calls (fresh when online, cached when offline)
- Static assets: CacheFirst
- `sw.js` must NEVER be cached by the server (nginx config: `Cache-Control: no-cache`)

### 8.2 Installability

- Web App Manifest with `display: standalone`
- Minimum 192x192 and 512x512 icons
- Start URL: `/`
- Theme color matches `--bg-primary`

---

## 9. Functional Programming Patterns

### 9.1 fp-ts Facade

All fp-ts imports go through `@/lib/fp` facade. Never import fp-ts directly in components or services.

Key types: `Result<AppError, T>`, `Option<T>`, `AsyncResult<AppError, T>`.

### 9.2 Result Usage

Services return `Result<AppError, T>`. Components call `.run()` at the edge and pattern-match:

```typescript
const result = await SomeService.operation(params).run();
result.match({
  ok: (data) => handleSuccess(data),
  err: (error) => showError(error.message),
});
```

### 9.3 Error Domain

Single error type `AppError` with factory methods: `AppError.parse()`, `AppError.validation()`, `AppError.notFound()`, etc.

---

## 10. Non-Functional Requirements

### 10.1 Performance

| Metric | Target |
|---|---|
| Script parse (50-page screenplay) | < 100ms |
| Syntax highlight update (on keystroke) | < 16ms (1 frame) |
| IndexedDB write | < 50ms |
| Scene navigation | < 200ms |
| Storyboard image generation | 2-5 seconds per panel |

### 10.2 Browser Support

- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- PWA installability: Chrome, Edge, Safari (iOS 16+)

### 10.3 Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 768px | Single column, bottom nav, slide-over sidebars |
| Tablet | 768px–1023px | 3-column grid, narrower sidebars |
| Desktop | 1024px+ | 3-column grid (240px | flex | 200px) |

Touch targets: minimum 44px on `pointer: coarse` devices.

### 10.4 Accessibility

- `:focus-visible` outline on all interactive elements
- `aria-hidden="true"` on overlay (FountainHighlight)
- Screen reader text via `.sr-only` class
- Keyboard navigation for all interactive controls

---

## 11. Testing Requirements

### 11.1 Unit Tests

| Module | What to Test |
|---|---|
| FountainParser | Element detection, scene parsing, character extraction, edge cases (empty lines, mixed case) |
| ShotGenerator | Coverage generation (dialogue, action, transitions), duration calculation |
| Adapters | Domain ↔ DB type conversion (Date ↔ ISO string), null handling |
| Services | Confirmation paradigm enforcement, validation rules |

### 11.2 Integration Tests

| Flow | What to Test |
|---|---|
| Script editing | Parse → highlight tokens → render overlay alignment |
| Shot list CRUD | Create → edit → confirm → lock state → unlock |
| Offline sync | Write offline → come online → push/pull → conflict resolution |

### 11.3 E2E Tests

| Flow | Steps |
|---|---|
| Core workflow | Create project → write script → parse scenes → generate shots → confirm → generate storyboard |
| Hollywood Standard | Write script → screenshot → verify element widths via computed styles |

---

## 12. Build and Deployment

### 12.1 Client Build

```bash
cd app/client && npm run build    # Vite production build to dist/
```

Output: static files served by nginx.

### 12.2 Server Build

```bash
cd app/server && bun run build    # Bun bundle
```

### 12.3 Deployment

- Client: nginx serves static files, proxies `/api/*` to backend
- Server: Bun process on port 3001
- CI: git fetch + reset (not pull), then build and deploy
