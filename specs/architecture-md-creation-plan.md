# Chore: Create architecture.md

## Chore Description

Create a comprehensive `architecture.md` document that details the technical software architecture of Cutline based on the Product Requirements Document (docs/prd.md). This document should serve as the technical blueprint for implementing the application, covering the tech stack, data models, component architecture, API integrations, and deployment strategy.

## Relevant Files

Use these files to resolve the chore:

### Reference Files
- `docs/prd.md` - Product Requirements Document containing technical architecture specifications (lines 866-951)
  - Tech Stack decisions (React + TypeScript, Vite, TanStack)
  - Architecture decisions (browser-only MVP, Bun+Elysium+SQLite for backend)
  - Key technical considerations (Fountain parsing, data model, AI API integration, state management)

- `DESIGN.md` - Design System documentation
  - UI/UX patterns that inform component architecture
  - Design tokens that inform styling architecture
  - Screen architecture that informs routing structure

### New Files
- `docs/architecture.md` - The new architecture document to be created

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Create Document Structure and Overview

**Create `docs/architecture.md` with the following structure:**

```markdown
# Cutline: Technical Architecture

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture Principles](#architecture-principles)
4. [Data Model](#data-model)
5. [Component Architecture](#component-architecture)
6. [State Management](#state-management)
7. [API Integration Layer](#api-integration-layer)
8. [Fountain Parser Architecture](#fountain-parser-architecture)
9. [Storage & Persistence](#storage--persistence)
10. [Routing & Navigation](#routing--navigation)
11. [Performance Strategy](#performance-strategy)
12. [Security Considerations](#security-considerations)
13. [Deployment Architecture](#deployment-architecture)
14. [Development Workflow](#development-workflow)
```

**Write the Overview section:**
- Project summary: Script-to-video platform for filmmakers
- Core workflow: Fountain script → AI breakdown → Shot list → Storyboards → Video
- Architecture goals: Browser-first PWA with optional backend for cloud features
- Key constraints: Offline-first, local storage, progressive enhancement

### Step 2: Document Tech Stack

**Expand on PRD's technical decisions:**

**Frontend (Phase 1 - MVP):**
- React 18+ with TypeScript
- Vite for build tooling (HMR, optimized builds)
- TanStack Query (React Query) for server state/API calls
- Zustand for client state (lightweight when needed)
- CSS Modules + design tokens from DESIGN.md

**Why These Choices:**
- React: Component model fits hierarchical data (Project → Script → Scenes → Shots → Storyboards)
- TypeScript: End-to-end type safety for complex domain models
- Vite: Fast dev server, optimized production builds
- TanStack Query: Excellent for managing AI API calls (loading, error, retry states)
- Zustand: Lightweight alternative to Redux for simple client state

**Future - Backend (Phase 2+):**
- Bun runtime (fast, all-in-one)
- Elysium web framework (type-safe)
- SQLite with better-sqlite3 (embedded, easy hosting)

### Step 3: Define Architecture Principles

**Document core design principles:**

1. **Browser-First MVP**: No backend needed for initial release
2. **Offline-First**: Full functionality without internet (PWA)
3. **Progressive Enhancement**: Core features work everywhere, enhanced features when available
4. **Type Safety**: TypeScript everywhere, shared types between client/server
5. **Simplicity Over Abstraction**: YAGNI - implement only current requirements
6. **Local-First Privacy**: Projects stay on user's device by default

### Step 4: Document Data Model

**Create detailed type definitions based on PRD's hierarchical structure:**

```typescript
// Core hierarchy
Project → Script → Scenes → Shots → Storyboards → Panels

// Key types to document:
- Project (metadata, settings, created/updated timestamps)
- Script (raw Fountain text, parsed elements)
- Scene (heading, INT/EXT, location, time, characters, action lines, dialogue)
- Character (name, dialogue count, visual reference, description)
- Shot (type, angle, movement, characters, action, duration, notes)
- StoryboardPanel (image URL, shot reference, generation metadata, versions)
- Comment/Note (entity type, entity ID, content, author, timestamp)
- Version (name, description, timestamp, snapshot data)
```

**Document relationships:**
- One-to-many: Project → Scripts, Script → Scenes, Scene → Shots, Shot → StoryboardPanels
- Many-to-many: Scenes ↔ Characters (appearances)
- Referential integrity cascade rules

### Step 5: Component Architecture

**Map components to PRD features and DESIGN.md screens:**

**Screen-level components (routing):**
- ProjectListScreen (landing)
- ScriptEditorScreen (primary, per DESIGN.md)
- ScriptBreakdownScreen
- ShotListEditorScreen
- StoryboardViewScreen
- SettingsScreen

**Feature components:**
- FountainEditor (contenteditable, syntax highlighting)
- SceneNavigator (sidebar)
- CharacterRoster (sidebar)
- ShotListTable (per-scene)
- Filmstrip (storyboard gallery)
- PanelDetail (selected panel view)

**UI components (from DESIGN.md):**
- Buttons (primary, secondary, small)
- NavTabs, FormatButtons
- Cards, SceneItems, Badges
- FilmstripPanel, CharacterAvatar

### Step 6: State Management Strategy

**Document state organization:**

**Server State (TanStack Query):**
- AI API calls (image generation, shot suggestions, script analysis)
- Cloud sync (Phase 2+)

**Client State (Zustand):**
- Current project/scene/shot selection
- UI state (sidebar open/closed, view mode, focus mode)
- Draft edits (unsaved changes)

**Local Persistence (IndexedDB via Dexie.js):**
- Projects, scripts, scenes, shots, storyboards
- Comments, versions, settings
- Offline-first storage with sync on reconnect

**State flow:**
```
User Action → Component Event → Zustand Action → IndexedDB Update → UI Re-render
                                                    ↓
                                          (if API needed) → TanStack Query → AI API
```

### Step 7: API Integration Layer

**Document AI API architecture:**

**Image Generation APIs (from PRD):**
- Primary: SDXL via Replicate (~$0.002/image)
- Secondary: 通义万相 wan2.6-t2i (¥0.20/image, China users)

**Abstraction layer design:**
```typescript
interface ImageGenerationAPI {
  generate(params: GenerationParams): Promise<GeneratedImage>
  estimateCost(params: GenerationParams): number
}

class SDXLAdapter implements ImageGenerationAPI { ... }
class WanXiangAdapter implements ImageGenerationAPI { ... }
```

**Error handling:**
- Automatic retry with exponential backoff
- Fallback to alternative API if primary fails
- Rate limit detection and queuing
- User-friendly error messages

### Step 8: Fountain Parser Architecture

**Document script parsing approach:**

**Parser responsibilities:**
- Parse Fountain format (scenes, characters, dialogue, action, transitions, parentheticals)
- Two-column AV format support
- Syntax highlighting tokens
- Scene metadata extraction
- Character name caching

**Implementation options:**
1. Use existing library (fountain-js or similar)
2. Custom parser with regex-based tokenization
3. Combination: library for base parsing, custom for AV format

**Output structure:**
```typescript
interface ParsedScript {
  scenes: ParsedScene[]
  characters: Map<string, CharacterStats>
  metadata: ScriptMetadata
}

interface ParsedScene {
  heading: string
  location: string
  interior: boolean
  timeOfDay: TimeOfDay
  elements: ScriptElement[]  // action, dialogue, etc.
}
```

### Step 9: Storage & Persistence

**Document IndexedDB schema:**

**Stores (tables):**
- `projects` (id, name, created, updated, settings)
- `scripts` (id, projectId, fountainText, parsedData)
- `scenes` (id, scriptId, heading, order, metadata)
- `shots` (id, sceneId, shotNumber, type, angle, movement, etc.)
- `storyboards` (id, shotId, imageUrl, generationParams, versions)
- `characters` (id, projectId, name, description, visualReference)
- `comments` (id, entityType, entityId, content, timestamp)
- `versions` (id, projectId, name, snapshotData, timestamp)

**Indexes for performance:**
- projects: created, updated
- scenes: scriptId, order
- shots: sceneId, shotNumber
- storyboards: shotId
- comments: entityType, entityId

**Backup/export:**
- JSON export with all project data
- Import with validation and conflict resolution

### Step 10: Routing & Navigation

**Document routing structure:**

**Phase 1 (hash-based or memory router for PWA):**
```
/                           → Project list
/project/:id                → Script editor (default)
/project/:id/breakdown      → Script breakdown
/project/:id/scene/:sceneId/shots    → Shot list editor
/project/:id/scene/:sceneId/storyboards → Storyboard view
/project/:id/settings       → Project settings
```

**Navigation patterns:**
- Desktop: Top nav tabs + sidebar navigation
- Mobile: Bottom nav bar + slide-out panels (per DESIGN.md)

### Step 11: Performance Strategy

**Document optimization approaches:**

**Lazy loading:**
- Code splitting by route (Vite automatic)
- Storyboard images loaded on-demand
- Virtual scrolling for long scripts/shot lists

**Caching:**
- TanStack Query caching for API responses
- IndexedDB for all local data
- Service worker for offline assets (PWA)

**Bundles:**
- Initial bundle <500KB gzipped
- Route chunks loaded as needed
- Vendor chunk for React/TanStack

### Step 12: Security Considerations

**Document security approach for Phase 1:**

**API Key Management:**
- User-provided API keys (stored in IndexedDB, never sent to our servers)
- Optional: Bring-your-own-key model

**Content Security:**
- No user data sent to external servers (except AI APIs with user's keys)
- CSP headers to prevent XSS
- Input sanitization for Fountain text

**Future (Phase 2+):**
- Authentication (JWT-based)
- Encrypted cloud sync
- API key proxy service

### Step 13: Deployment Architecture

**Phase 1 (Static PWA):**
- Static hosting (Vercel, Netlify, GitHub Pages)
- Service worker for offline functionality
- No backend required

**Phase 2 (with backend):**
- Bun runtime on VPS or container
- SQLite database (file-based or via better-sqlite3)
- Optional: Cloudflare Workers for edge functions

### Step 14: Development Workflow

**Document development setup:**

**Prerequisites:**
- Node.js 18+ (or Bun for Phase 2)
- pnpm for package management

**Setup commands:**
```bash
pnpm install
pnpm dev          # Start Vite dev server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm test         # Run tests (Vitest)
pnpm lint         # ESLint
```

**Git workflow:**
- Feature branches from main
- PR review required
- Automated tests on PR

### Step 15: Add Diagrams and Visual References

**Add ASCII diagrams for key architectures:**

**Data flow diagram:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Fountain   │───▶│   Parser    │───▶│   Parsed    │
│   Script    │    │             │    │   Scenes    │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Storyboard  │◀───│  AI Prompt  │◀───│ Shot List   │
│  Panels     │    │  Builder    │    │  (User)     │
└─────────────┘    └─────────────┘    └─────────────┘
```

**Component hierarchy:**
```
App
├── ProjectListScreen
└── ProjectWorkspace
    ├── Header (nav tabs, save, export)
    ├── Sidebar (scenes, characters)
    ├── MainContent
    │   ├── ScriptEditor
    │   ├── ScriptBreakdown
    │   ├── ShotListEditor
    │   └── StoryboardView
    └── RightPanel (contextual)
```

### Step 16: Validation

**Review the completed document:**
- All sections from PRD's Technical Architecture are covered
- Type definitions are consistent with PRD's data model
- Tech stack decisions are justified
- Component mapping covers all Phase 1 features
- Storage schema supports all data relationships
- API integration handles both SDXL and WanXiang

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `ls -la docs/architecture.md` - Verify architecture.md was created
- `wc -l docs/architecture.md` - Verify document has substantial content (expect 500+ lines)
- `head -50 docs/architecture.md` - Verify document starts with proper title and overview
- `grep -c "##" docs/architecture.md` - Verify document has all major sections (expect 15+ headings)
- `grep -c "interface\|type" docs/architecture.md` - Verify TypeScript types are documented (expect 20+)

## Notes

**Source Material:**
- PRD lines 866-951 contain the base technical architecture
- DESIGN.md contains UI/UX patterns that inform component structure
- PRD's "Development Phases & MVP Scope" (lines 518-607) defines Phase 1 boundaries

**Scope:**
- Focus on Phase 1 (MVP) architecture
- Mention Phase 2/3 as future considerations
- Keep implementation-specific details minimal (this is architecture, not implementation)

**Audience:**
- Developers implementing the features
- Future maintainers understanding the system
- Technical stakeholders reviewing architecture decisions

**Relationship to other docs:**
- PRD: What to build (features, requirements)
- DESIGN.md: How it should look/feel (UI/UX)
- architecture.md: How it should be built (technical structure)
