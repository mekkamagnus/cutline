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

---

## Overview

Cutline is a web application for filmmakers that transforms Fountain-format scripts into videos through an AI-assisted storyboard creation workflow.

### Core Workflow

```
Fountain Script Input
        ↓
AI Script Parsing & Breakdown
        ↓
Shot List Creation (with AI suggestions)
        ↓
Shot List Confirmation
        ↓
AI Storyboard Generation
        ↓
Storyboard Refinement (optional)
        ↓
Video Generation (Phase 1.1+)
```

### Architecture Goals

- **Browser-First PWA**: Full functionality without server-side infrastructure
- **Offline-First**: Complete workflow available without internet connection
- **Progressive Enhancement**: Core features work everywhere; enhanced features when available
- **Local-First Privacy**: User projects stored locally by default

### Key Constraints

- Single-page application architecture
- IndexedDB for local persistence (no backend required for MVP)
- Bring-your-own API key model for AI services
- Responsive design: desktop, tablet, mobile

---

## Tech Stack

### Frontend (Phase 1 - MVP)

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18+ |
| **TypeScript** | Type Safety | 5+ |
| **Vite** | Build Tool | 5+ |
| **TanStack Query** | Server State / API Calls | 5+ |
| **Zustand** | Client State Management | 4+ |
| **React Router** | Client-Side Routing | 6+ |
| **Dexie.js** | IndexedDB Wrapper | 4+ |
| **CSS Modules** | Component Scoping | - |

### Why These Choices

**React**: Component model aligns with hierarchical data structure (Project → Script → Scenes → Shots → Storyboards). Large ecosystem and excellent TypeScript support.

**TypeScript**: End-to-end type safety for complex domain models. Shared types between frontend and future backend.

**Vite**: Lightning-fast HMR during development. Optimized production builds with automatic code splitting.

**TanStack Query**: Best-in-class data fetching with built-in loading, error, and retry states—perfect for AI API calls that may be slow or unreliable.

**Zustand**: Lightweight alternative to Redux. Minimal boilerplate for simple client state (UI state, selections).

**Dexie.js**: Type-safe IndexedDB wrapper with Promise-based API. Simplifies complex queries and indexing.

### Backend (Phase 2+)

| Technology | Purpose |
|------------|---------|
| **Bun** | JavaScript Runtime (all-in-one toolkit) |
| **Elysium** | Type-safe web framework for Bun |
| **SQLite** | Embedded database (via better-sqlite3) |

### Why Bun + Elysium + SQLite

- **Bun**: Fast startup, low memory footprint, built-in test runner and bundler
- **Elysium**: Modern, type-safe framework with excellent TypeScript support
- **SQLite**: Embedded database—no separate server required, easy hosting

---

## Architecture Principles

### 1. Browser-First MVP

No backend infrastructure for initial release. All functionality runs in the browser using:
- IndexedDB for persistence
- Direct AI API calls from client
- Service worker for PWA capabilities

### 2. Offline-First

Full functionality without internet:
- Service worker caches application assets
- IndexedDB stores all project data
- Background sync when connection restored

### 3. Progressive Enhancement

Core features work everywhere:
- Basic script editing: always available
- AI features: require API key and connection
- Video generation: Phase 1.1+ feature

### 4. Type Safety

TypeScript everywhere:
- Shared types between frontend and future backend
- No `any` types in production code
- Strict mode enabled

### 5. Simplicity Over Abstraction

YAGNI (You Aren't Gonna Need It):
- Implement only current requirements
- Avoid premature optimization
- Prefer simple solutions over clever ones

### 6. Local-First Privacy

Projects stay on user's device:
- No data sent to external servers (except AI APIs)
- User controls their own API keys
- Optional cloud sync (Phase 3)

---

## Data Model

### Hierarchy Overview

```
Project
├── Script
│   ├── Scenes
│   │   ├── Shots
│   │   │   └── StoryboardPanels
│   │   └── Comments
│   └── Characters
├── Comments (project-level)
└── Versions
```

### TypeScript Type Definitions

```typescript
// ============================================================================
// Core Types
// ============================================================================

type ShotType =
  | "wide"
  | "medium"
  | "close-up"
  | "extreme-cu"
  | "two-shot"
  | "over-the-shoulder"
  | "establishing"
  | "insert";

type CameraAngle =
  | "eye-level"
  | "high-angle"
  | "low-angle"
  | "dutch-angle"
  | "birds-eye"
  | "worms-eye";

type CameraMovement =
  | "static"
  | "pan"
  | "tilt"
  | "dolly"
  | "truck"
  | "pedestal"
  | "arc"
  | "handheld"
  | "steadicam";

type TimeOfDay = "day" | "night" | "dawn" | "dusk";

type StoryboardStyle =
  | "pencil-sketch"
  | "ink-drawing"
  | "manga-comic"
  | "watercolor-storyboard";

// ============================================================================
// Project
// ============================================================================

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  // Script-level configuration (Feature #2)
  visualStyle: string;
  colorPalette: string[];
  tone: string;

  // Character management
  characters: Character[];

  // Collaboration (Feature #1.10)
  comments: Comment[];
  versions: Version[];

  // PWA sync
  lastSyncedAt?: Date;
  syncStatus: "synced" | "pending" | "conflict";
}

// ============================================================================
// Script
// ============================================================================

interface Script {
  id: string;
  projectId: string;

  // Raw Fountain text
  fountainText: string;

  // Parsed data
  parsedData: ParsedScript;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Format: "fountain" or "av-two-column"
  format: "fountain" | "av-two-column";
}

interface ParsedScript {
  scenes: ParsedScene[];
  characters: Map<string, CharacterStats>;
  metadata: ScriptMetadata;
}

interface ScriptMetadata {
  totalScenes: number;
  totalCharacters: number;
  totalLocations: number;
  estimatedDuration: number; // minutes
  firstSceneId?: string;
}

// ============================================================================
// Scene
// ============================================================================

interface ParsedScene {
  id: string;
  heading: string;
  location: string;
  interior: boolean; // INT vs EXT
  timeOfDay: TimeOfDay;

  // Scene-level configuration (Feature #3)
  locationDescription?: string;
  mood?: string;
  lightingStyle?: string;
  colorPaletteOverride?: string[];

  // Parsed elements
  elements: ScriptElement[];

  // Relationships
  characterAppearances: string[]; // character names
  order: number; // sequence in script
}

type ScriptElement =
  | { type: "scene-heading"; text: string }
  | { type: "action"; text: string }
  | { type: "character"; name: string }
  | { type: "dialogue"; character: string; text: string }
  | { type: "parenthetical"; character: string; text: string }
  | { type: "transition"; text: string }
  | { type: "shot"; text: string };

// ============================================================================
// Character
// ============================================================================

interface Character {
  id: string;
  projectId: string;

  name: string;
  description?: string; // for visual reference generation

  // AI-generated visual reference (Feature #2)
  visualReferenceUrl?: string;
  visualReferenceApproved: boolean;

  // Stats
  dialogueCount: number;
  sceneAppearances: number;
  firstSceneId?: string;
}

interface CharacterStats {
  name: string;
  dialogueCount: number;
  sceneAppearances: number;
  sceneIds: string[];
}

// ============================================================================
// Shot
// ============================================================================

interface Shot {
  id: string;
  sceneId: string;

  // Shot definition (Feature #1.7)
  shotNumber: number;
  type: ShotType;
  angle: CameraAngle;
  movement: CameraMovement;
  charactersInFrame: string[]; // character names
  actionDescription: string;
  duration: number; // seconds
  notes?: string;

  // Confirmation state (Feature #1.9)
  confirmed: boolean;
  confirmedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  storyboardPanel?: StoryboardPanel;
}

// ============================================================================
// Storyboard Panel
// ============================================================================

interface StoryboardPanel {
  id: string;
  shotId: string;

  // Generated image
  imageUrl: string;

  // Generation metadata
  generatedAt: Date;
  generationParams: GenerationParams;
  apiProvider: "sdxl" | "wanxiang";
  cost: number; // USD

  // Style (script/scene level override)
  style: StoryboardStyle;

  // Version history (for refinement - Feature #7)
  version: number;
  previousVersions: StoryboardPanelVersion[];

  // Refinement prompt (if edited)
  refinementPrompt?: string;
}

interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  style: StoryboardStyle;
  shotType: ShotType;
  cameraAngle: CameraAngle;
  characters: string[]; // character names for visual consistency
  characterReferences: Record<string, string>; // name -> visual reference URL
  sceneContext: {
    location: string;
    mood?: string;
    lighting?: string;
  };
}

interface StoryboardPanelVersion {
  version: number;
  imageUrl: string;
  generatedAt: Date;
  refinementPrompt?: string;
}

// ============================================================================
// Comments (Feature #1.10)
// ============================================================================

interface Comment {
  id: string;
  entityType: "project" | "scene" | "shot" | "storyboard";
  entityId: string;

  content: string;
  author: "local"; // Phase 1; add user IDs in Phase 3
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Version (Feature #1.10)
// ============================================================================

interface Version {
  id: string;
  projectId: string;

  name: string;
  description?: string;
  createdAt: Date;

  // Snapshot of entire project state
  snapshotData: ProjectSnapshot;
}

interface ProjectSnapshot {
  script: {
    fountainText: string;
    parsedData: ParsedScript;
  };
  shots: Record<string, Shot>; // sceneId -> shots[]
  storyboardPanels: Record<string, StoryboardPanel>;
  comments: Comment[];
}

// ============================================================================
// Shot Suggestions (AI)
// ============================================================================

interface ShotSuggestion {
  shotNumber: number;
  type: ShotType;
  angle: CameraAngle;
  movement: CameraMovement;
  charactersInFrame: string[];
  actionDescription: string;
  duration: number;

  // AI reasoning
  reasoning: string; // e.g., "Suggest close-up on JANE because this is her emotional reaction"

  // User action
  status: "pending" | "accepted" | "edited" | "rejected";
}
```

### Relationships

| Relationship | Type | Cascade Rule |
|--------------|------|--------------|
| Project → Script | 1:1 | Delete script when project deleted |
| Script → Scenes | 1:N | Delete scenes when script deleted |
| Scene → Shots | 1:N | Delete shots when scene deleted |
| Shot → StoryboardPanel | 1:1 | Delete panel when shot deleted |
| Project → Characters | 1:N | Delete characters when project deleted |
| Project → Versions | 1:N | Keep versions (historical record) |
| Any → Comments | 1:N | Delete comments when entity deleted |
| Scenes ↔ Characters | N:M | CharacterStats tracks appearances |

---

## Component Architecture

### Screen-Level Components (Routing)

```
App
├── ProjectListScreen          / (landing)
└── ProjectWorkspace           /project/:id
    ├── ScriptEditorScreen     /project/:id (default)
    ├── ScriptBreakdownScreen  /project/:id/breakdown
    ├── ShotListEditorScreen   /project/:id/scene/:sceneId/shots
    ├── StoryboardViewScreen   /project/:id/scene/:sceneId/storyboards
    └── SettingsScreen         /project/:id/settings
```

### Feature Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `FountainEditor` | Contenteditable script editor with syntax highlighting | `text`, `onChange`, `parsedData` |
| `SceneNavigator` | Sidebar showing scene list with quick-jump | `scenes`, `currentSceneId`, `onSelect` |
| `CharacterRoster` | Sidebar showing characters with stats | `characters`, `onSelect` |
| `ShotListTable` | Per-scene shot editor in tabular format | `shots`, `sceneId`, `onUpdate` |
| `Filmstrip` | Horizontal scrolling gallery of storyboard panels | `panels`, `selectedId`, `onSelect` |
| `PanelDetail` | Large view of selected panel with edit options | `panel`, `onRegenerate`, `onEdit` |
| `ShotSuggestionsPanel` | AI suggestions with accept/edit/reject | `suggestions`, `onAccept`, `onReject` |
| `ScriptBreakdownDashboard` | Four-column stats and cards | `script`, `characters`, `locations` |
| `CommentsPanel` | Notes/comments on entities | `entityType`, `entityId`, `comments` |
| `VersionHistory` | List of project snapshots | `versions`, `onRestore`, `onCompare` |

### UI Components (from DESIGN.md)

| Component | Design Tokens | Usage |
|-----------|--------------|-------|
| `Button` | `--accent`, `--space-2` through `--space-4` | Primary, secondary, small variants |
| `NavTabs` | `--bg-tertiary`, `--border-radius` | Tab navigation |
| `FormatButtons` | `--font-size-xs`, min-height 36/44px | Script format shortcuts |
| `Card` | `--bg-secondary`, `--border-color` | Container for grouped content |
| `SceneItem` | `--border-left`, `--accent-light` | Scene list items |
| `Badge` | `--success`, `--warning`, `--error` | Status indicators |
| `FilmstripPanel` | width 160px (70px mobile) | Storyboard thumbnails |
| `CharacterAvatar` | 24px circular, colored | Character initials |

### Component Hierarchy (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│ App                                                             │
├─────────────────────────────────────────────────────────────────┤
│ ProjectWorkspace                                                │
│ ├── Header                                                      │
│ │   ├── Logo | Script | Shots | Storyboards | Breakdown        │
│ │   ├── Title | Scene 1/12 | View | Zoom | Save | Export        │
│ │   └── Save Status Indicator                                   │
│ ├── LeftSidebar (collapsible)                                   │
│ │   ├── SceneNavigator                                         │
│ │   ├── ProjectStats                                           │
│ │   └── CharacterRoster                                        │
│ ├── MainContent                                                │
│ │   ├── ScriptEditor (default)                                 │
│ │   │   ├── FountainEditor                                     │
│ │   │   └── FormatToolbar                                      │
│ │   ├── ScriptBreakdown                                        │
│ │   ├── ShotListEditor                                         │
│ │   │   ├── ShotListTable                                      │
│ │   │   └── ShotSuggestionsPanel                               │
│ │   └── StoryboardView                                         │
│ │       ├── Filmstrip                                          │
│ │       └── PanelDetail                                        │
│ └── RightPanel (contextual, collapsible)                        │
│     ├── (Script: format shortcuts, character autocomplete)      │
│     ├── (Shots: AI suggestions)                                │
│     └── (Storyboards: edit prompt, regenerate)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Management

### State Organization

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application State                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Server State    │  │   Client State   │  │   Local DB   │ │
│  │  (TanStack Query)│  │   (Zustand)      │  │  (IndexedDB) │ │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────┤ │
│  │ • AI API calls   │  │ • Current UI     │  │ • Projects   │ │
│  │ • Image gen      │  │ • Selections     │  │ • Scripts    │ │
│  │ • Shot suggestions│  │ • Draft edits   │  │ • Scenes     │ │
│  │ • Cloud sync*    │  │ • Sidebar state │  │ • Shots      │ │
│  │                  │  │ • View mode     │  │ • Storyboards│ │
│  └──────────────────┘  └──────────────────┘  │ • Characters │ │
│                                               │ • Comments   │ │
│                                               │ • Versions   │ │
│                                               └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    * Phase 2+
```

### Server State (TanStack Query)

```typescript
// AI API queries
const generateStoryboard = useMutation({
  mutationFn: (params: GenerationParams) =>
    imageGenerationAPI.generate(params),
  onSuccess: (data) => {
    // Update IndexedDB
    queryClient.invalidateQueries(['storyboards', data.shotId]);
  },
});

const getShotSuggestions = useQuery({
  queryKey: ['suggestions', sceneId],
  queryFn: () => aiAPI.suggestShots(sceneId),
  enabled: !!sceneId,
});
```

### Client State (Zustand)

```typescript
interface UIState {
  // Selections
  currentProjectId: string | null;
  currentSceneId: string | null;
  currentShotId: string | null;
  selectedPanelId: string | null;

  // UI state
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  viewMode: "script" | "split" | "storyboard";
  focusMode: boolean;

  // Draft edits
  unsavedChanges: boolean;

  // Actions
  selectProject: (id: string) => void;
  selectScene: (id: string) => void;
  toggleSidebar: (side: "left" | "right") => void;
  setViewMode: (mode: UIState["viewMode"]) => void;
  setFocusMode: (enabled: boolean) => void;
}
```

### Local Persistence (IndexedDB via Dexie.js)

```typescript
const db = new Dexie('CutlineDB');

db.version(1).stores({
  projects: 'id, name, createdAt, updatedAt',
  scripts: 'id, projectId',
  scenes: 'id, scriptId, order',
  shots: 'id, sceneId, shotNumber',
  storyboards: 'id, shotId',
  characters: 'id, projectId, name',
  comments: 'id, entityType, entityId',
  versions: 'id, projectId, createdAt',
});
```

### State Flow

```
User Action
    ↓
Component Event Handler
    ↓
┌─────────────────────────────────────┐
│ Is API call needed?                 │
└─────────────────────────────────────┘
        │                    │
       Yes                   No
        │                    │
        ▼                    ▼
┌───────────────┐    ┌──────────────┐
│ TanStack Query│    │   Zustand    │
│    Mutation   │    │    Action    │
└───────┬───────┘    └──────┬───────┘
        │                   │
        ▼                   ▼
┌───────────────┐    ┌──────────────┐
│   AI API      │    │  IndexedDB   │
└───────┬───────┘    └──────┬───────┘
        │                   │
        └─────────┬─────────┘
                  ▼
          ┌──────────────┐
          │  UI Re-render │
          └──────────────┘
```

---

## API Integration Layer

### Image Generation APIs

| Provider | Endpoint | Cost | Best For |
|----------|----------|------|----------|
| **SDXL** | Replicate API | ~$0.002/image | International users, cost efficiency |
| **通义万相 wan2.6-t2i** | Alibaba DashScope | ¥0.20/image (~$0.028) | China users, text rendering, sketch control |

### Abstraction Layer

```typescript
// ============================================================================
// API Interface
// ============================================================================

interface ImageGenerationAPI {
  /**
   * Generate a storyboard panel image
   */
  generate(params: GenerationParams): Promise<GeneratedImage>;

  /**
   * Estimate cost in USD for generation
   */
  estimateCost(params: GenerationParams): number;

  /**
   * Check if API is available
   */
  healthCheck(): Promise<boolean>;
}

interface GeneratedImage {
  url: string;
  cost: number;
  provider: string;
  generatedAt: Date;
}

// ============================================================================
// SDXL Adapter (via Replicate)
// ============================================================================

class SDXLAdapter implements ImageGenerationAPI {
  private apiKey: string;
  private baseURL = "https://api.replicate.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(params: GenerationParams): Promise<GeneratedImage> {
    const prompt = this.buildPrompt(params);

    const response = await fetch(`${this.baseURL}/predictions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: SDXL_MODEL_VERSION,
        input: {
          prompt,
          negative_prompt: params.negativePrompt,
          style: params.style,
        },
      }),
    });

    // Poll for result
    const prediction = await this.pollForResult(response.json());

    return {
      url: prediction.output[0],
      cost: 0.002, // ~$0.002 per image
      provider: "sdxl",
      generatedAt: new Date(),
    };
  }

  estimateCost(): number {
    return 0.002;
  }

  private buildPrompt(params: GenerationParams): string {
    // Build SDXL-optimized prompt from GenerationParams
    const { shotType, cameraAngle, characters, sceneContext } = params;

    let prompt = `Storyboard sketch, ${sceneContext.location}, `;

    // Add shot type modifiers
    prompt += `${shotType} shot, ${cameraAngle} angle, `;

    // Add characters
    if (characters.length > 0) {
      prompt += `characters: ${characters.join(", ")}, `;
    }

    // Add style
    prompt += `${params.style} style`;

    return prompt;
  }

  private async pollForResult(initialResponse: any): Promise<any> {
    // Poll Replicate API until generation complete
    // Implementation omitted for brevity
  }
}

// ============================================================================
// WanXiang Adapter (Alibaba DashScope)
// ============================================================================

class WanXiangAdapter implements ImageGenerationAPI {
  private apiKey: string;
  private baseURL = "https://dashscope.aliyuncs.com/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(params: GenerationParams): Promise<GeneratedImage> {
    const prompt = this.buildPrompt(params);

    const response = await fetch(`${this.baseURL}/services/aigc/text2image/generation`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "wan2.6-t2i",
        input: {
          prompt,
          negative_prompt: params.negativePrompt,
          style: this.mapStyle(params.style),
        },
      }),
    });

    const result = await response.json();

    return {
      url: result.output.url,
      cost: 0.028, // ¥0.20 ≈ $0.028
      provider: "wanxiang",
      generatedAt: new Date(),
    };
  }

  estimateCost(): number {
    return 0.028;
  }

  private buildPrompt(params: GenerationParams): string {
    // Build WanXiang-optimized prompt (supports Chinese)
    // Implementation similar to SDXL but with Chinese style modifiers
    return ""; // Omitted for brevity
  }

  private mapStyle(style: StoryboardStyle): string {
    // Map StoryboardStyle to WanXiang style codes
    const map: Record<StoryboardStyle, string> = {
      "pencil-sketch": "sketch",
      "ink-drawing": "ink",
      "manga-comic": "manga",
      "watercolor-storyboard": "watercolor",
    };
    return map[style] || "sketch";
  }
}

// ============================================================================
// API Factory (with fallback)
// ============================================================================

class ImageGenerationService {
  private primary: ImageGenerationAPI;
  private fallback?: ImageGenerationAPI;

  constructor(apiKey: string, provider: "sdxl" | "wanxiang", fallbackKey?: string) {
    this.primary = this.createAPI(provider, apiKey);
    if (fallbackKey) {
      const fallbackProvider = provider === "sdxl" ? "wanxiang" : "sdxl";
      this.fallback = this.createAPI(fallbackProvider, fallbackKey);
    }
  }

  async generate(params: GenerationParams): Promise<GeneratedImage> {
    try {
      return await this.primary.generate(params);
    } catch (error) {
      if (this.fallback) {
        console.warn("Primary API failed, trying fallback", error);
        return await this.fallback.generate(params);
      }
      throw error;
    }
  }

  private createAPI(provider: string, apiKey: string): ImageGenerationAPI {
    switch (provider) {
      case "sdxl":
        return new SDXLAdapter(apiKey);
      case "wanxiang":
        return new WanXiangAdapter(apiKey);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}
```

### Error Handling Strategy

```typescript
// Retry with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
};

// Rate limit detection
const isRateLimitError = (error: any): boolean => {
  return error?.status === 429 || error?.code === "rate_limit_exceeded";
};

// User-friendly error messages
const getErrorMessage = (error: any): string => {
  if (isRateLimitError(error)) {
    return "Rate limit exceeded. Please wait a moment and try again.";
  }
  if (error?.status === 401) {
    return "Invalid API key. Please check your settings.";
  }
  if (error?.status >= 500) {
    return "Service unavailable. Please try again later.";
  }
  return "An error occurred. Please try again.";
};
```

---

## Fountain Parser Architecture

### Parser Responsibilities

1. **Parse Fountain Format**:
   - Scene headings (sluglines)
   - Action lines
   - Character names
   - Dialogue
   - Parentheticals
   - Transitions
   - Shot headings

2. **Two-Column AV Format Support**:
   - Video column (visuals)
   - Audio column (dialogue/SFX)

3. **Syntax Highlighting**:
   - Token classification for editor styling
   - Line number mapping

4. **Metadata Extraction**:
   - Scene breakdown (INT/EXT, locations, time of day)
   - Character roster with dialogue counts
   - Script statistics

### Implementation Strategy

**Option 1: Use Existing Library (Recommended for MVP)**
- `fountain-js` or similar
- Proven, tested, handles edge cases
- May need extension for AV format

**Option 2: Custom Parser**
- Regex-based tokenization
- Full control over features
- More maintenance burden

**Option 3: Hybrid (Recommended)**
- Library for base Fountain parsing
- Custom extensions for AV format and specific needs

### Output Structure

```typescript
interface ParsedScript {
  scenes: ParsedScene[];
  characters: Map<string, CharacterStats>;
  metadata: ScriptMetadata;
}

interface ParsedScene {
  id: string;
  heading: string;
  headingLine: number; // for navigation
  location: string;
  interior: boolean;
  timeOfDay: TimeOfDay;

  elements: ScriptElement[];
  elementRanges: Array<{ start: number; end: number; element: ScriptElement }>;

  // Extracted metadata
  charactersPresent: string[];
  firstLine: number;
  lastLine: number;
}

interface ScriptElement {
  type: ElementType;
  text: string;
  line: number;
  // For dialogue: associated character
  character?: string;
}

type ElementType =
  | "scene-heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "shot";
```

### Parser Interface

```typescript
interface FountainParser {
  /**
   * Parse Fountain text into structured data
   */
  parse(text: string): ParsedScript;

  /**
   * Get syntax highlighting tokens for editor
   */
  getHighlightTokens(text: string): HighlightToken[];

  /**
   * Get scene at line number (for navigation)
   */
  getSceneAtLine(text: string, line: number): ParsedScene | null;

  /**
   * Parse two-column AV format
   */
  parseAVFormat(text: string): AVParsedScript;
}

interface HighlightToken {
  type: ElementType;
  startLine: number;
  endLine: number;
  text: string;
}

interface AVParsedScript {
  scenes: AVScene[];
}

interface AVScene {
  heading: string;
  videoRows: AVVideoRow[];
  audioRows: AVAudioRow[];
}

interface AVVideoRow {
  type: "action" | "shot" | "transition";
  text: string;
}

interface AVAudioRow {
  type: "character" | "dialogue" | "parenthetical" | "sfx";
  text: string;
}
```

### Character Name Caching

```typescript
class CharacterCache {
  private cache = new Map<string, Set<string>>();

  /**
   * Add character to scene's character set
   */
  addCharacter(sceneId: string, characterName: string): void {
    if (!this.cache.has(sceneId)) {
      this.cache.set(sceneId, new Set());
    }
    this.cache.get(sceneId)!.add(characterName.toUpperCase());
  }

  /**
   * Get autocomplete suggestions for scene
   */
  getCharacters(sceneId: string): string[] {
    return Array.from(this.cache.get(sceneId) || []);
  }

  /**
   * Get all characters across all scenes
   */
  getAllCharacters(): string[] {
    const all = new Set<string>();
    for (const characters of this.cache.values()) {
      characters.forEach(c => all.add(c));
    }
    return Array.from(all);
  }
}
```

---

## Storage & Persistence

### IndexedDB Schema

```typescript
// ============================================================================
// Database Definition
// ============================================================================

const db = new Dexie('CutlineDB');

db.version(1).stores({
  // Projects: top-level container
  projects: 'id, name, createdAt, updatedAt, lastSyncedAt',

  // Scripts: one per project
  scripts: 'id, projectId, format, updatedAt',

  // Scenes: parsed from script
  scenes: 'id, scriptId, order, interior, timeOfDay, location',

  // Shots: user-defined per scene
  shots: 'id, sceneId, shotNumber, confirmed',

  // Storyboards: generated images per shot
  storyboards: 'id, shotId, generatedAt, apiProvider',

  // Characters: per-project
  characters: 'id, projectId, name, dialogueCount',

  // Comments: on any entity
  comments: 'id, entityType, entityId, createdAt',

  // Versions: project snapshots
  versions: 'id, projectId, createdAt, name',

  // Settings: user preferences
  settings: 'key',
});

// ============================================================================
// TypeScript Interfaces (matching schema)
// ============================================================================

interface DBProject {
  id: string;
  name: string;
  createdAt: string; // ISO date
  updatedAt: string;

  // Script-level config
  visualStyle: string;
  colorPalette: string[];
  tone: string;

  // Sync
  lastSyncedAt?: string;
  syncStatus: "synced" | "pending" | "conflict";
}

interface DBScript {
  id: string;
  projectId: string;
  fountainText: string;
  parsedDataJson: string; // Serialized ParsedScript
  format: "fountain" | "av-two-column";
  updatedAt: string;
}

interface DBScene {
  id: string;
  scriptId: string;
  heading: string;
  location: string;
  interior: boolean;
  timeOfDay: TimeOfDay;
  order: number;
  elementsJson: string; // Serialized ScriptElement[]
  characterAppearancesJson: string; // Serialized string[]
}

interface DBShot {
  id: string;
  sceneId: string;
  shotNumber: number;
  type: ShotType;
  angle: CameraAngle;
  movement: CameraMovement;
  charactersInFrameJson: string;
  actionDescription: string;
  duration: number;
  notes?: string;
  confirmed: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DBStoryboard {
  id: string;
  shotId: string;
  imageUrl: string;
  generatedAt: string;
  generationParamsJson: string;
  apiProvider: "sdxl" | "wanxiang";
  cost: number;
  style: StoryboardStyle;
  version: number;
  previousVersionsJson: string;
  refinementPrompt?: string;
}

interface DBCharacter {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  visualReferenceUrl?: string;
  visualReferenceApproved: boolean;
  dialogueCount: number;
  sceneAppearances: number;
  firstSceneId?: string;
}

interface DBComment {
  id: string;
  entityType: "project" | "scene" | "shot" | "storyboard";
  entityId: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface DBVersion {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  snapshotDataJson: string;
}

interface DBSettings {
  key: string;
  valueJson: string;
}
```

### Data Access Layer

```typescript
// ============================================================================
// Repository Pattern for Type-Safe Access
// ============================================================================

class ProjectRepository {
  async create(project: Omit<DBProject, "id">): Promise<string> {
    const id = crypto.randomUUID();
    await db.projects.add({ ...project, id });
    return id;
  }

  async get(id: string): Promise<DBProject | undefined> {
    return await db.projects.get(id);
  }

  async update(id: string, changes: Partial<DBProject>): Promise<void> {
    await db.projects.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    // Cascade delete related records
    await db.projects.delete(id);
    await db.scripts.where("projectId").equals(id).delete();
    await db.characters.where("projectId").equals(id).delete();
    await db.comments.where("entityId").equals(id).delete();
    await db.versions.where("projectId").equals(id).delete();
  }

  async list(): Promise<DBProject[]> {
    return await db.projects.orderBy("updatedAt").reverse().toArray();
  }
}

class ShotRepository {
  async create(shot: Omit<DBShot, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.shots.add({ ...shot, id, createdAt: now, updatedAt: now });
    return id;
  }

  async getByScene(sceneId: string): Promise<DBShot[]> {
    return await db.shots.where("sceneId").equals(sceneId).sortBy("shotNumber");
  }

  async updateConfirmed(id: string, confirmed: boolean): Promise<void> {
    await db.shots.update(id, {
      confirmed,
      confirmedAt: confirmed ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
  }
}

// Similar repositories for Script, Scene, Storyboard, Character, Comment, Version
```

### Backup/Export

```typescript
class ProjectExporter {
  /**
   * Export entire project as JSON file
   */
  async exportProject(projectId: string): Promise<Blob> {
    const project = await db.projects.get(projectId);
    if (!project) throw new Error("Project not found");

    const script = await db.scripts.where("projectId").equals(projectId).first();
    const scenes = await db.scenes.where("scriptId").equals(script!.id).toArray();
    const characters = await db.characters.where("projectId").equals(projectId).toArray();
    const comments = await db.comments.where("entityId").equals(projectId).toArray();

    // Get all shots and storyboards
    const sceneIds = scenes.map(s => s.id);
    const shots = await db.shots.where("sceneId").anyOf(sceneIds).toArray();
    const shotIds = shots.map(s => s.id);
    const storyboards = await db.storyboards.where("shotId").anyOf(shotIds).toArray();

    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      project,
      script,
      scenes,
      characters,
      shots,
      storyboards,
      comments,
    };

    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
  }

  /**
   * Import project from JSON file
   */
  async importProject(file: File): Promise<string> {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate version compatibility
    if (data.version !== "1.0") {
      throw new Error(`Incompatible export version: ${data.version}`);
    }

    // Create new project with imported data
    const projectId = await db.projects.add({
      ...data.project,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Import related records with new IDs
    // ... (implementation omitted for brevity)

    return projectId;
  }
}
```

---

## Routing & Navigation

### Route Structure

```
/                              → ProjectListScreen (landing)
/project/:id                   → ScriptEditorScreen (default)
/project/:id/breakdown         → ScriptBreakdownScreen
/project/:id/scene/:sceneId/shots      → ShotListEditorScreen
/project/:id/scene/:sceneId/storyboards → StoryboardViewScreen
/project/:id/settings          → SettingsScreen
```

### Router Configuration (React Router v6)

```typescript
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <ProjectListScreen />,
      },
      {
        path: "project/:projectId",
        element: <ProjectWorkspace />,
        children: [
          { index: true, element: <ScriptEditorScreen /> },
          { path: "breakdown", element: <ScriptBreakdownScreen /> },
          { path: "scene/:sceneId/shots", element: <ShotListEditorScreen /> },
          { path: "scene/:sceneId/storyboards", element: <StoryboardViewScreen /> },
          { path: "settings", element: <SettingsScreen /> },
        ],
      },
    ],
  },
]);
```

### Navigation Patterns

**Desktop (from DESIGN.md)**:
- Top navigation tabs: Script | Shots | Storyboards | Breakdown
- Left sidebar: Scene Navigator, Character Roster
- Right panel: Contextual tools

**Mobile**:
- Bottom navigation bar: Script | Shots | Storyboards | Breakdown | Settings
- Slide-out panels: Scene Navigator (left), Format tools (bottom sheet)

### URL State Management

```typescript
// Query params for additional state
interface ProjectSearchParams {
  view?: "script" | "split" | "storyboard";
  focus?: boolean;
  scene?: string; // scene ID
  panel?: string; // panel ID
}

// Example: /project/abc123?view=split&scene=def456
```

---

## Performance Strategy

### Lazy Loading

**Code Splitting by Route** (automatic with Vite):

```typescript
// Lazy load screens
const ScriptBreakdownScreen = lazy(() =>
  import("./screens/ScriptBreakdownScreen")
);
const ShotListEditorScreen = lazy(() =>
  import("./screens/ShotListEditorScreen")
);
const StoryboardViewScreen = lazy(() =>
  import("./screens/StoryboardViewScreen")
);
```

**Storyboard Images On-Demand**:

```typescript
const useLazyStoryboardImage = (url: string) => {
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          setSrc(url);
          setLoaded(true);
        };
      }
    });

    const imgRef = /* ref from component */;
    if (imgRef) observer.observe(imgRef);

    return () => observer.disconnect();
  }, [url]);

  return { loaded, src };
};
```

**Virtual Scrolling** (for long scripts):

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

const VirtualScriptEditor = ({ scenes }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: scenes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // estimated row height
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: "100%", overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${item.start}px)`,
            }}
          >
            <SceneElement scene={scenes[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Caching Strategy

**TanStack Query Cache Configuration**:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
```

**Service Worker for PWA**:

```typescript
// sw.js
const CACHE_NAME = "cutline-v1";
const STATIC_ASSETS = [
  "/",
  "/assets/main.css",
  "/assets/main.js",
  // ... other assets
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### Bundle Size Targets

| Target | Limit | Strategy |
|--------|-------|----------|
| Initial bundle | <500KB gzipped | Code splitting, tree shaking |
| Route chunks | <200KB each | Lazy loading |
| Vendor chunk | <300KB | Externalize large deps |

---

## Security Considerations

### Phase 1 (Browser-Only MVP)

**API Key Management**:
- User provides their own API keys (stored in IndexedDB)
- Keys never sent to Cutline servers
- Optional: Encrypted storage for added protection

```typescript
interface APIKeyStorage {
  setKey(provider: string, key: string): Promise<void>;
  getKey(provider: string): Promise<string | undefined>;
  deleteKey(provider: string): Promise<void>;
}

class IndexedDBKeyStorage implements APIKeyStorage {
  async setKey(provider: string, key: string): Promise<void> {
    const encrypted = await this.encrypt(key);
    await db.settings.put({
      key: `api-key-${provider}`,
      valueJson: JSON.stringify(encrypted),
    });
  }

  private async encrypt(value: string): Promise<string> {
    // Use Web Crypto API for encryption
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const key = await this.getEncryptionKey();
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: crypto.getRandomValues(new Uint8Array(12)) },
      key,
      data
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }
}
```

**Content Security**:
- No user script content sent to external servers (except AI APIs with user's keys)
- CSP headers to prevent XSS
- Input sanitization for Fountain text

**CSP Configuration**:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.replicate.com https://dashscope.aliyuncs.com;
">
```

### Phase 2+ (Backend)

**Authentication**:
- JWT-based auth
- Secure HTTP-only cookies
- API key proxy service

**Encrypted Cloud Sync**:
- End-to-end encryption for synced projects
- User-controlled encryption keys

---

## Deployment Architecture

### Phase 1: Static PWA

**Hosting Options**:
- Vercel (recommended)
- Netlify
- GitHub Pages

**Deployment Process**:

```bash
# Build
pnpm build

# Output: dist/
# - index.html (with service worker inline)
# - assets/
#   - main-[hash].js
#   - main-[hash].css
#   - ...

# Deploy to Vercel
vercel --prod
```

**PWA Manifest** (`public/manifest.json`):

```json
{
  "name": "Cutline",
  "short_name": "Cutline",
  "description": "Script to video platform for filmmakers",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Phase 2: Backend (Optional)

**Infrastructure**:

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare / CDN                       │
├─────────────────────────────────────────────────────────────┤
│                   Static Assets (PWA)                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Bun Runtime (VPS)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Elysium    │  │   SQLite    │  │  File Storage       │ │
│  │  API        │  │  Database   │  │  (User uploads)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Docker Configuration**:

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

---

## Development Workflow

### Prerequisites

- **Node.js**: 18+ or Bun 1+
- **pnpm**: 8+ (for package management)

### Project Setup

```bash
# Clone repository
git clone https://github.com/your-org/cutline.git
cd cutline

# Install dependencies
pnpm install

# Start development server
pnpm dev
# → http://localhost:5173

# Run tests
pnpm test

# Lint code
pnpm lint

# Type check
pnpm type-check
```

### Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write ."
  }
}
```

### Git Workflow

```
main (protected)
  ↑
  │ PR review required
  │ CI tests must pass
  │
feature/issue-description
```

**Branch Naming**:
- Features: `feature/script-editor`
- Fixes: `fix/shot-list-crash`
- Chores: `chore/update-dependencies`

**Commit Message Format**:
```
type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore
# Examples:
feat(script): add fountain syntax highlighting
fix(shots): prevent duplicate shot numbers
docs(readme): update installation instructions
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm type-check
      - run: pnpm lint
      - run: pnpm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm build
```

### Testing Strategy

**Unit Tests** (Vitest):
- Component tests with React Testing Library
- Utility function tests
- Data transformation tests

**Integration Tests**:
- IndexedDB operations
- Fountain parser
- API client mocking

**E2E Tests** (Playwright, Phase 2):
- Complete user workflows
- Cross-browser testing

---

## Visual Architecture Diagrams

### Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Fountain   │───▶│   Parser    │───▶│   Parsed    │
│   Script    │    │             │    │   Scenes    │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                     ┌─────────────┐
                                     │ Script Break│
                                     │   Down UI   │
                                     └─────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────┐
                    ▼                                           ▼
             ┌─────────────┐                             ┌─────────────┐
             │  Shot List  │                             │ Character   │
             │   Editor    │                             │   Roster    │
             └─────────────┘                             └─────────────┘
                    │
                    ▼
             ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
             │ Shot List   │───▶│  AI Prompt  │───▶│   Image Gen │
             │  Confirmed  │    │  Builder    │    │    API      │
             └─────────────┘    └─────────────┘    └──────┬──────┘
                                                           │
                                                           ▼
                                                  ┌─────────────┐
                                                  │ Storyboard  │
                                                  │   Panels    │
                                                  └─────────────┘
```

### State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Action                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Component Event │
                    └────┬───────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
    ┌───────────────┐       ┌──────────────┐
    │ API Call?     │       │   Local      │
    │               │       │   Update     │
    └───┬───────┬───┘       └──────┬───────┘
        │       │                   │
       Yes      No                  │
        │       │                   │
        ▼       │                   ▼
┌───────────────┐           ┌──────────────┐
│  TanStack     │           │   Zustand    │
│  Query        │           │   Store      │
└───┬───────────┘           └───┬──────────┘
    │                           │
    ▼                           │
┌───────────────┐               │
│  AI API       │               │
└───┬───────────┘               │
    │                           │
    └───────────┬───────────────┘
                ▼
        ┌───────────────┐
        │  IndexedDB    │
        │  Persistence  │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │  UI Re-render │
        └───────────────┘
```

---

## Appendix: Phase Boundaries

### Phase 1 (MVP) - This Document

**Includes**:
- Browser-only PWA
- Script editor with Fountain parsing
- Script breakdown
- Shot list editor
- AI shot suggestions
- Storyboard generation (SDXL/WanXiang)
- Local storage (IndexedDB)
- Basic collaboration (comments, versions)

**Excludes**:
- Video generation
- Cloud sync
- User accounts
- Character visual references

### Phase 1.1

**Adds**:
- Character management with visual references
- Video generation (single API)
- Enhanced scene configuration

### Phase 2

**Adds**:
- Backend (Bun + Elysium + SQLite)
- Multiple video generation APIs
- Project versioning
- Advanced import/export

### Phase 3

**Adds**:
- User accounts & authentication
- Cloud sync
- Real-time collaboration
- Full video assembly & export

---

**Document Version**: 1.0
**Last Updated**: 2025-03-28
**Maintained By**: Development Team
