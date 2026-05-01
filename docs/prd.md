# Cutline: Script to Video Platform

## Product Overview

Cutline is a web application for filmmakers, storytellers, and short video creators that transforms scripts into videos through an AI-assisted storyboard creation workflow.

### Target Audience
- Primary: Filmmakers and storytellers
- Secondary: Short video creators (social media, YouTube, etc.)

### Core Workflow

```
Script Input (Fountain format)
    ↓
AI Script Parsing
    ↓
Script Breakdown (scenes, characters, locations, props)
    ↓
Shot List Creation (with AI suggestions)
    ↓
Shot List Confirmation
    ↓
AI Storyboard Generation (from confirmed shot list)
    ↓
Storyboard Refinement (optional)
    ↓
Video Generation (via API)
```

### Product Philosophy

**Shot-List-First Approach**:
- The AI is a powerful assistant that suggests shot coverage
- The director maintains creative control through the shot list
- AI suggests → Director edits → Director confirms → AI generates
- The confirmed shot list is the specification for storyboard generation
- No surprise storyboards: every storyboard panel corresponds to an approved shot

---

## Features

### 1. Script Input & Parsing

**User Story**: As a filmmaker, I want to upload or paste a script in Fountain format so that the AI can automatically recognize and organize its elements.

**Acceptance Criteria**:
- Accept Fountain format script input (paste or file upload)
- Parse and identify:
  - Scenes (scene headings, sluglines)
  - Characters
  - Dialogue
  - Action lines
  - Transitions
  - Parentheticals
- Display parsed structure in organized, navigable format
- Handle common Fountain format variations

### 1.5. Script Editor — ✅ Implemented

**User Story**: As a filmmaker, I want to write and edit scripts directly in the application so that I can work on my screenplay without switching tools.

**Acceptance Criteria**:
- ✅ In-app Fountain format script editor with syntax highlighting
- ✅ Hollywood Standard formatting (element widths, colors, spacing)
- ✅ Textarea overlay pattern: transparent textarea + syntax overlay for rendering
- ✅ Page delineation every 55 lines with per-page line numbers
- ✅ Infinite-scroll layout (no nested scrollbars, auto-resizing textarea)
- ✅ Color-coded syntax highlighting per element type
- ✅ Standard screenplay formatting (Courier font, proper margins/spacing)
- ✅ Responsive design: editing works on desktop, tablet, and mobile
- ✅ Word count and page count estimation in stats
- ❌ Auto-formatting as you type (deferred — manual Fountain format)
- ❌ Fountain format autocomplete (deferred)
- ❌ Scene heading detection and auto-formatting (deferred)
- ❌ Character name caching and autocomplete (deferred)
- ❌ **AV Format Support**: Two-column script format (deferred)
- ❌ Keyboard shortcuts for common script elements (deferred)
- ❌ Save indicator for unsaved changes (deferred)

#### 1.5.1 Hollywood Standard Formatting

**Reference**: See `docs/hollywood-standard.md` for the full specification.

**User Story**: As a filmmaker, I want my script to render in industry-standard screenplay format so that it looks professional and matches what I'd see in Final Draft or Fade In.

**Acceptance Criteria**:

- **Typography**: Courier or Courier Prime font, 12pt equivalent, monospaced
- **Element dimensions** match Hollywood Standard (measured in `ch` units for 10-pitch Courier):

  | Element | Max Width | Alignment | CSS Variable |
  |---|---|---|---|
  | Scene Heading | 60ch (6.0") | Left, uppercase, bold | — |
  | Action | 60ch (6.0") | Left | `--script-action-width` |
  | Character Cue | 20ch (2.0") | Centered, uppercase | `--script-character-width` |
  | Dialogue | 35ch (3.5") | Centered | `--script-dialogue-width` |
  | Parenthetical | 20ch (2.0") | Centered, italic | `--script-parenthetical-width` |
  | Transition | 60ch (6.0") | Right, uppercase | — |
  | Shot | 60ch (6.0") | Left, uppercase | — |

- **Centered elements** (character cues, dialogue, parentheticals) use `margin: auto` with `max-width` constraint — leading whitespace is stripped from the syntax overlay so CSS centering is not affected by Fountain indentation
- **Spacing**: 1 blank line between distinct elements; no blank line between character cue and its dialogue/parenthetical
- **Color-coded syntax highlighting** per element type (scene headings, characters, dialogue, parentheticals, action, transitions, shots)
- **Textarea overlay pattern**: transparent textarea for input + absolute-positioned overlay for rendering; cursor alignment maintained between layers
- **Responsive**: element widths scale proportionally on tablet and mobile viewports

**User Story**: As a filmmaker, I want syntax highlighting to distinguish script elements at a glance so that I can quickly scan and navigate my screenplay.

**Acceptance Criteria**:

- Each element type has a distinct color from the design token palette:
  - Scene headings: `--fountain-scene` (gold)
  - Character cues: `--fountain-character` (blue)
  - Dialogue: `--fountain-dialogue` (primary text)
  - Parentheticals: `--fountain-parenthetical` (muted gray, italic)
  - Action: `--fountain-action` (primary text)
  - Transitions: `--fountain-transition` (purple)
  - Shots: `--fountain-shot` (orange)
- Highlighting updates in real-time as the user types
- Non-highlighted text (unknown element type) renders as action style by default

#### 1.5.2 Page Delineation & Navigation

**User Story**: As a filmmaker, I want to see where each screenplay page begins and ends so that I know my script's page count and can reference specific pages during production.

**Acceptance Criteria**:
- Dashed horizontal divider lines appear every 55 lines (standard screenplay page boundary)
- Line numbers restart at 1 at each page boundary (per-page numbering)
- Page dividers are subtle (dashed, low opacity) and do not interfere with editing
- Infinite-scroll layout: all pages visible in a single continuous scroll — no nested scrollbars
- Page count displayed in the status bar (derived from total lines / 55)
- Dividers render in both the line number gutter and the syntax overlay for visual alignment

### 1.6. Script Breakdown & Analysis

**User Story**: As a filmmaker, I want to see my script automatically broken down into its constituent elements so that I can understand and organize the production requirements.

**Acceptance Criteria**:
- Automatic extraction and categorization of:
  - **Scenes**: All scene headings with line numbers, INT/EXT classification
  - **Characters**: All speaking characters with dialogue counts and scene appearances
  - **Locations**: All unique locations grouped by interior/exterior
  - **Props**: Key props mentioned in action lines (AI-detected)
  - **Time of Day**: Day/night/dawn/dusk classification per scene
  - **Transitions**: All transitions between scenes
- Visual breakdown dashboard showing:
  - Scene list with locations and time indicators
  - Character roster with appearance counts and scene references
  - Location list with scene groupings
  - Script statistics (total scenes, characters, locations, estimated duration)
- Click-through navigation: click any element to jump to its location in script
- Export breakdown as CSV or PDF
- Scene metadata editing: add notes, tags, and production status to each scene
- **Integration with Shot List**: Characters and locations available as dropdowns in shot editor

### 1.7. Shot List Editor — ✅ Implemented

**User Story**: As a filmmaker, I want to define shots for each scene so that the AI knows exactly what storyboards to generate.

**Acceptance Criteria**:
- ✅ Per-scene shot list editor with tabular interface (div-based grid)
- ✅ For each shot, define:
  - **Shot Number**: Sequential (1, 2, 3...)
  - **Shot Type**: Wide / Medium / Close-up / Extreme CU / Two-shot / Over-the-shoulder / Establishing / Insert
  - **Camera Angle**: Eye level / High angle / Low angle / Dutch angle / Bird's eye / Worm's eye
  - **Camera Movement**: Static / Pan / Tilt / Dolly / Truck / Pedestal / Arc / Handheld / Steadicam
  - **Characters in Frame**: Select from script's character roster
  - **Action Description**: Brief description of what happens in shot
  - **Duration**: Suggested length (seconds)
  - **Notes**: Director's additional notes
- ✅ Auto-generated shots from parsed scene content (rule-based, not AI)
- ✅ Add/edit/delete shots with inline form
- ✅ Shot count display per scene
- ✅ Summary stats: total duration, estimated cost
- ✅ Auto-save via TanStack Query mutations to IndexedDB
- ❌ Keyboard shortcuts: Tab to next field, Enter to add new shot (deferred)
- ❌ Copy/duplicate shot functionality (deferred)
- ❌ Reorder shots (move up/down buttons are present but no-op — deferred)
- ❌ Delete shot with confirmation (deferred)

### 1.8. AI-Assisted Shot Suggestions — ✅ Implemented (rule-based)

**User Story**: As a filmmaker, I want the AI to suggest appropriate shots for my scenes so that I have a starting point rather than starting from blank.

**Acceptance Criteria**:
- ✅ Deterministic shot generation from parsed scene content
- ✅ Generation rules (element-type-based, not AI):
  - First action at scene start → establishing shot (3s) + wide shot for grouped actions
  - Subsequent action groups → wide or two-shot (if 2+ characters)
  - Character + dialogue + parenthetical blocks → alternating over-the-shoulder / close-up
  - Transitions → skipped (implicit cuts)
  - Duration calculated from word count, capped at 2–10 seconds
- ✅ 9 unit tests covering all generation rules
- ✅ Auto-seeded into IndexedDB when DB is empty
- ❌ AI-powered suggestions with reasoning (deferred — uses heuristic rules)
- ❌ "Regenerate suggestions" button (deferred)
- ❌ Accept/reject individual suggestions (deferred)

### 1.9. Shot List Confirmation — ✅ Implemented

**User Story**: As a filmmaker, I want to explicitly confirm my shot list before AI generation so that I don't waste credits on unwanted storyboards.

**Acceptance Criteria**:
- ✅ Summary statistics: shot count, estimated storyboard generation cost
- ✅ "Confirm Shot List" button that:
  - Locks the shot list (prevents accidental edits)
  - Enables AI storyboard generation for this scene
  - Shows confirmation dialog with estimated cost
- ✅ "Unlock for Editing" button to make changes after confirmation
- ✅ Visual indicator showing confirmed vs. unconfirmed status (📝 Draft / 🔒 Confirmed)
- ✅ Paradigm gate enforced at service, API, and UI layers
- ❌ Review mode showing all shots before confirmation (deferred)
- ❌ Bulk confirmation: confirm multiple scenes at once (deferred)

### 1.10. Local Collaboration Features

**User Story**: As a filmmaker, I want to add notes and track changes without cloud sync so that I can iterate on my script locally.

**Acceptance Criteria**:
- **Comments/Notes**: Add notes to scenes, storyboards, characters, and shots
  - Inline comments on script text
  - Per-scene notes panel
  - Per-shot notes in shot list
- **Version History**: Local version snapshots
  - "Save Version" with name and description
  - View version list with timestamps
  - Restore any previous version
  - Compare versions (see what changed)
- **Track Changes**: Script edit history
  - Toggle track changes mode
  - See who changed what (local user only for Phase 1)
  - Accept or reject individual changes
- All collaboration data stored locally (IndexedDB)

### 1.11. Progressive Web App

**User Story**: As a filmmaker, I want to install Cutline as an app and work offline so that I can write and plan anywhere.

**Acceptance Criteria**:
- Installable PWA (Add to Home Screen on mobile/desktop)
- Offline mode: full functionality available without internet
- Background sync when connection restored
- Responsive design optimized for:
  - Desktop editing (full keyboard shortcuts, multi-panel)
  - Tablet editing (touch-optimized, responsive panels)
  - Mobile editing (simplified interface, still fully functional)
- Local data persistence (IndexedDB) with export/import backup

### 2. Script-Level Configuration

**User Story**: As a filmmaker, I want to define overall visual style and settings at the script level so that the AI generates storyboards that match my creative vision from the start.

**Acceptance Criteria**:
- Allow configuration of script-wide visual settings:
  - Overall visual style (cinematic, documentary, animation, etc.)
  - Color palette preferences
  - Tone/mood (dark, lighthearted, suspenseful, etc.)
- Character management system (similar to Fade In/Final Draft):
  - Create character profiles with text descriptions
  - Include: age, physical traits, clothing style, typical expressions, personality notes
  - AI generates visual reference images from character descriptions
  - Director approves or refines generated reference images
  - Approved references used for consistent character rendering across all storyboards
- Script-level settings inform AI's initial storyboard generation

### 3. Scene-Level Configuration

**User Story**: As a filmmaker, I want to define scene-specific visual style and setting details so that all storyboards within that scene maintain consistency.

**Acceptance Criteria**:
- For each scene, allow configuration of:
  - Location/set description (environment details)
  - Mood/atmosphere (tense, warm, eerie, etc.)
  - Lighting style (harsh, soft, golden hour, etc.)
  - Color palette adjustments (override script defaults if needed)
  - Overall visual style/tone for this scene
- Scene-level settings apply as defaults to all storyboards in that scene
- Ability to override scene defaults at individual storyboard level

### 4. Storyboard-Level Configuration

**User Story**: As a filmmaker, I want to control specific shot details for each storyboard panel so that I can direct the visual narrative precisely.

**Acceptance Criteria**:
- For each storyboard panel, allow configuration of:
  - Shot composition (camera angles, framing, movement)
  - Character appearance and positioning
  - Character expressions and emotions
  - Specific camera movements within the shot
- Inherit scene-level defaults by default
- Override scene defaults when needed
- Preview/visualize storyboard panel configuration

### 5. Image Generation API Integration (MVP)

**User Story**: As a filmmaker, I want to choose between multiple image generation APIs so that I can optimize for cost, quality, and regional availability.

**Acceptance Criteria**:
- **Primary API - SDXL**:
  - Lowest cost (~$0.002/image)
  - Good quality for storyboard aesthetics
  - Best for international users
  - Multiple style LoRAs available for sketch/illustrated looks
- **Secondary API - 通义万相 wan2.6-t2i**:
  - Excellent for China-based users
  - Superior text rendering and layout control
  - Native sketch/line art control via ControlNet
  - Pricing: ¥0.20/image (~$0.028)
- **API Selection**:
  - User can choose default API at project level
  - Per-scene API override (e.g., use Wan2.6 for text-heavy scenes)
  - Auto-select based on user region (China → Wan2.6, International → SDXL)
- **Style Consistency**:
  - Both APIs support sketch/illustrated/manga aesthetics
  - Style prompts adapted per API (different prompt formats)
  - Character reference system works with both APIs
- **Fallback & Error Handling**:
  - Automatic retry with alternative API if primary fails
  - Rate limit handling and queuing
  - Clear error messages if API unavailable
- **Cost Estimation**:
  - Show estimated cost before generating storyboards
  - Track API usage and costs per project
  - Budget warnings (optional threshold)

**Implementation Notes**:
- Use Replicate API for SDXL (simpler integration, multiple SDXL models)
- Use Alibaba Cloud DashScope API for Wan2.6
- Abstraction layer for easy addition of future APIs (DALL-E, etc.)

### 6. AI Storyboard Generation (From Confirmed Shot List) — ✅ Implemented

**User Story**: As a filmmaker, I want the AI to generate storyboard panels based on my confirmed shot list so that I get visual representations of my planned shots.

**Acceptance Criteria**:
- ✅ **Requires confirmed shot list** (Feature #1.9) — enforced at service, API, and UI layers
- ✅ For each confirmed shot in shot list, generates ONE storyboard panel
- ✅ Uses shot list fields as generation parameters:
  - Shot Type → influences framing and composition
  - Camera Angle → influences perspective in generated image
  - Camera Movement → hints at motion within static image
  - Characters in Frame → ensures correct characters appear
  - Action Description → main prompt content
- ✅ **Visual Style**: Static AI images with sketch/illustrated/manga aesthetic
  - Style options: Pencil Sketch, Ink Drawing, Manga/Comic, Watercolor, Cinematic, Noir, Traditional Storyboard
  - Style selector in StoryboardGenerator component
- ✅ Progress indicator during batch generation
- ✅ Cost tracking: show API cost per panel and running total
- ✅ Batch generation: generate all storyboards for a scene at once
- ✅ **Card grid display**: each panel rendered as a 280px fixed-width card with annotations
- ✅ **Paradigm gate**: warning message when shot list not confirmed; generator hidden until confirmed
- ✅ Online generation via backend API; offline fallback to placeholder images
- ❌ Individual regeneration from card (available via refinement panel)

### 7. Storyboard Refinement (Edit Mode) — ✅ Implemented

**User Story**: As a filmmaker, I want to selectively edit individual storyboard panels with targeted prompts so that I can refine the AI's rough drafts without starting from scratch.

**Acceptance Criteria**:
- ✅ Click generated card to open refinement panel
- ✅ RefinementPanel slides in from right (desktop) or bottom sheet (mobile)
- ✅ Prompt input for targeted refinement
- ✅ Version history tracking (version number displayed)
- ✅ Escape key to close panel
- ✅ Non-destructive editing (previous versions saved)
- ❌ Undo/redo within refinement session (deferred)

### 8. Video Generation - Scene Level (Primary)

**User Story**: As a filmmaker, I want to generate video clips for all storyboard panels in a scene at once so that I can efficiently create the visual content for that scene.

**Acceptance Criteria**:
- Select a scene and click "Generate Video"
- Generates individual video clips for each storyboard panel in that scene
- Batch processing for efficiency
- Progress indicator showing which panels are complete
- Generated clips are organized by scene and panel
- Video generation parameters can be set at scene level:
  - Duration per clip
  - Motion intensity (subtle to dynamic)
  - Resolution/quality settings
- Store generation metadata (API used, parameters, timestamp) for reproducibility

### 9. Video Generation - Panel Preview (Optional)

**User Story**: As a filmmaker, I want to generate a single storyboard panel into video so that I can preview how it will look before committing to generating the full scene.

**Acceptance Criteria**:
- "Preview Video" button on individual storyboard panels
- Generates video for that single panel only
- Uses same scene-level generation parameters
- Faster feedback for iterative refinement
- Can regenerate panel with different prompts/settings

### 10. Video Export & Assembly

**User Story**: As a filmmaker, I want to export my generated video clips so that I can use them in post-production or share them.

**Acceptance Criteria**:
- Export individual video clips per storyboard panel (primary)
- Download as organized folder structure:
  - /project-name/scene-01/panel-01.mp4, panel-02.mp4, etc.
- Include metadata file with generation details
- **Future phase**: Assemble full video with transitions
- Export options: resolution, frame rate, format (MP4, etc.)

### 11. Video Generation API Integration

**User Story**: As a filmmaker, I want to select from multiple video generation APIs so that I can choose the best option for my needs (cost, quality, speed).

**Acceptance Criteria**:
- Support multiple video generation APIs:
  - RunwayML (Gen-2/Gen-3)
  - Pika Labs
  - Stability AI
  - Easy to add new integrations
- API selection at project or scene level
- Display API status (available, rate limits, costs if known)
- **Prototype phase**: Implement with easiest/cheapest option first
- Fallback/error handling if API is unavailable

---

## Project Management Features

### 12. Project Saving & Auto-Save (Phase 1)

**User Story**: As a filmmaker, I want my work to be automatically saved locally so that I don't lose progress if I accidentally close the browser.

**Acceptance Criteria**:
- Auto-save to local storage (browser IndexedDB)
- Save all project data: script, breakdown, shot lists, configurations, storyboards, generated assets, comments, versions
- Auto-save every 30 seconds or on significant changes (including shot list edits)
- Manual "Save" button for immediate save
- "Save As" to create new project file
- Visual indicator showing unsaved changes

### 13. Project Export/Import (Phase 1)

**User Story**: As a filmmaker, I want to export my project as a file so that I can back it up, share it, or work on it across different devices.

**Acceptance Criteria**:
- Export project as JSON file
- Include all project data and metadata
- Import project files to restore or continue work
- Validate imported files for compatibility
- Handle import conflicts (version mismatch, missing data)

### 14. Project Versioning (Phase 2)

**User Story**: As a filmmaker, I want to save multiple versions of my project so that I can experiment with different creative directions and revert if needed.

**Acceptance Criteria**:
- Create named versions ("V1 - Original", "V2 - Darker mood")
- Save snapshot of entire project state
- View version history with timestamps and notes
- Restore any previous version
- Compare versions (see what changed between versions)
- Branch/merge functionality (optional, advanced)

### 15. Project Duplication (Phase 2)

**User Story**: As a filmmaker, I want to duplicate my project so that I can create variations without losing the original.

**Acceptance Criteria**:
- "Duplicate Project" button
- Creates complete copy with new name
- All configurations, storyboards, and generated assets copied
- Prompt for new project name
- Keep reference to original project

### 16. Fountain Script Import with Smart Configuration (Phase 2)

**User Story**: As a filmmaker, I want to import an existing Fountain script and have the system intelligently suggest configurations so that I don't have to start from scratch.

**Acceptance Criteria**:
- Upload Fountain script (.fountain or .txt)
- Parse script and identify scenes, characters, locations
- AI analyzes script and suggests:
  - Script-level visual style based on genre/tone
  - Character profiles from dialogue and action descriptions
  - Scene mood/lighting based on scene descriptions
- Director reviews and accepts/edits suggestions
- Generate initial rough draft storyboards automatically

### 17. Cloud Sync & Collaboration (Phase 3)

**User Story**: As a filmmaker, I want to sync my projects to the cloud so that I can access them from anywhere and collaborate with team members.

**Acceptance Criteria**:
- User accounts with authentication
- Projects synced to cloud storage
- Access projects from any device
- Real-time sync across devices
- Collaborative features:
  - Share projects with specific users
  - Permission levels (view, edit, admin)
  - Comments/annotations on storyboards
- Offline mode with conflict resolution
- Project history and activity log

---

## User Interface & Navigation

### 18. Scene-Focused Main View

**User Story**: As a filmmaker, I want to focus on one scene at a time so that I can work through my script methodically without being overwhelmed.

**Acceptance Criteria**:
- ✅ Main view displays current scene with context-dependent content
- ✅ **Top Navigation**: 4-tab layout (Script | Shots | Storyboards | Breakdown), URL-driven routing
- ✅ **Left Sidebar**:
  - ✅ Scene list with scene headings and INT/EXT indicators
  - ✅ Character list with dialogue counts
  - ✅ Script stats (scenes, characters, locations, runtime, word count)
  - ✅ Quick actions (Edit Scene, Export Scene, Line Numbers)
  - ❌ Global settings panel (deferred)
- ✅ **Main Content Area** (tab-dependent):
  - ✅ Script tab: Fountain editor with syntax highlighting
  - ✅ Shots tab: Tabular shot list with add/edit/delete
  - ✅ Storyboards tab: Card grid with generator and refinement
  - ✅ Breakdown tab: placeholder
- ✅ **Right Panel** (contextual, collapsible):
  - ✅ When editing storyboard: RefinementPanel with prompt input
  - ❌ When configuring scene: Scene settings form (deferred)
  - ❌ When generating video: Generation parameters (deferred)
- ✅ Navigation between scenes: click scene in left sidebar
- ✅ Mobile: stacked layout with bottom nav bar

### 19. Storyboard Panel Interaction

**User Story**: As a filmmaker, I want to interact with individual storyboard panels naturally so that I can review and refine them efficiently.

**Acceptance Criteria**:
- ✅ Storyboard panels displayed in responsive card grid (fixed 280px width, auto-fill columns)
- ✅ Each card shows: 16:9 image area + annotation rows (Scene, Frame, Time, Description, Script/Camera, Sound, Music)
- ✅ Click generated card to open refinement panel
- ✅ Placeholder cards for ungenerated shots show "Shot N / Generate" prompt
- ✅ Stats bar shows panels generated count and total cost
- ✅ Paradigm gate: warning shown when shot list not confirmed
- ❌ Keyboard navigation between panels (deferred)
- ❌ Drag-and-drop reorder (deferred)
- ❌ Duplicate/delete from card (deferred — available in refinement panel)

### 20. Script View Integration

**User Story**: As a filmmaker, I want to see the original script text alongside storyboards so that I can ensure the visual interpretation matches my written words.

**Acceptance Criteria**:
- **Script View Mode**: Full parsed script display
  - Fountain format highlighting
  - Click scene heading to jump to that scene
  - Click character name to view character profile
  - Editable script text ( Fountain format)
- **Split View Mode**: Script on left, storyboards on right
  - Synced scrolling - script scroll updates storyboard view
  - Click action line → highlight corresponding storyboard panel
  - Click storyboard panel → highlight script text
- **Storyboard View Mode**: Hide script, focus on visuals (default)

---

## Development Phases & MVP Scope

### Phase 1: MVP (Full-Stack Web Application with PWA)

**Goal**: Validate core value proposition - script → shot list → storyboard workflow with full authentication and persistence

**Architecture**:
- Full-stack application: Bun + Elysia + SQLite backend
- React + TypeScript + Vite frontend
- PWA functionality for offline support and installability
- User authentication with JWT
- Secure API key management on backend
- Offline-first with automatic sync

**Core Features**:

1. **Script Input & Parsing** (Feature #1) — ✅ **Implemented**
   - Fountain format paste (upload deferred)
   - Parse scenes, characters, dialogue, action lines
   - Display parsed structure in left sidebar and stats

2. **Script Editor** (Feature #1.5) — ✅ **Implemented**
   - In-app Fountain editor with syntax highlighting
   - Transparent textarea + overlay rendering pattern
   - Hollywood Standard formatting (element widths, centering, colors)
   - Page delineation every 55 lines with per-page line numbers
   - Infinite-scroll layout (no nested scrollbars)
   - Auto-resize textarea to fit content
   - ~~AV format support~~ (deferred to Phase 2)
   - ~~Auto-formatting as you type~~ (deferred — manual Fountain format)
   - Responsive: desktop, tablet, mobile editing

3. **Script Breakdown & Analysis** (Feature #1.6) — 🟡 **Partial**
   - ✅ Auto-extract scenes, characters, locations from Fountain text
   - ✅ Scene list in left sidebar with INT/EXT indicators
   - ✅ Character list with dialogue counts and scene appearances
   - ✅ Script statistics (total scenes, characters, locations, est. runtime, word count)
   - ❌ Props detection (AI-detected) — deferred
   - ❌ Click-through navigation (click element → jump in script)
   - ❌ Export breakdown as CSV/PDF
   - ❌ Scene metadata editing (notes, tags, production status)

4. **Shot List Editor** (Feature #1.7) — ✅ **Implemented**
   - Per-scene shot definition with tabular interface (div-based grid)
   - Shot type, angle, movement, characters, action, duration, notes
   - Add/edit/delete shots with inline form
   - Confirmation workflow with cost estimate
   - Auto-generated shots from parsed scene content
   - Summary stats (total duration, estimated cost)
   - ~~Keyboard shortcuts~~ (deferred)
   - ~~Copy/duplicate shot~~ (deferred)
   - ~~Drag-and-drop reorder~~ (move up/down buttons are no-op — deferred)

5. **AI-Assisted Shot Suggestions** (Feature #1.8) — ✅ **Implemented (rule-based)**
   - Deterministic shot generation from parsed scene elements
   - Rules: first action → establishing, subsequent → wide/two-shot, dialogue → OTS/close-up
   - Duration calculated from word count (2–10s range)
   - 9 unit tests covering all generation rules
   - ~~AI-powered suggestions with reasoning~~ (deferred — uses heuristic rules, not AI)

6. **Shot List Confirmation** (Feature #1.9) — ✅ **Implemented**
   - Confirm button with cost estimate dialog
   - Locks shot list (prevents edits)
   - Unlock for editing with confirmation dialog
   - Visual status indicator (📝 Draft / 🔒 Confirmed)
   - Estimated cost display per shot
   - ~~Bulk confirmation across scenes~~ (deferred)

7. **AI Storyboard Generation** (Feature #6) — ✅ **Implemented**
   - Generates from CONFIRMED SHOT LIST only (paradigm gate enforced)
   - One storyboard per confirmed shot
   - Style selector: Pencil Sketch, Ink Drawing, Manga/Comic, Watercolor, Cinematic, Noir, Traditional Storyboard
   - Online: backend API for real AI generation
   - Offline: placeholder generation (picsum.photos fallback)
   - Progress indicator during batch generation
   - Cost tracking per panel and running total
   - Card grid layout: fixed 280px cards with responsive columns
   - Each card shows: image area + annotations (Scene, Frame, Time, Description, Script, Sound, Music)

8. **Storyboard Refinement** (Feature #7) — ✅ **Implemented (component exists)**
   - RefinementPanel slides in from right (desktop) or bottom (mobile)
   - Prompt input for targeted refinement
   - Version history tracking
   - Escape key to close
   - ~~Multi-step refinement workflow~~ (single prompt iteration)

9. **Storyboard Export** (simplified from Feature #10) — ❌ **Not implemented**
   - Export storyboard images as files
   - Organized by scene
   - Include metadata

10. **Local Collaboration** (Feature #1.10) — ❌ **Not implemented**
    - Comments/notes on scenes, shots, storyboards
    - Version history (local snapshots)
    - Track changes

11. **Progressive Web App** (Feature #1.11) — ✅ **Implemented**
    - ✅ Installable PWA (manifest, service worker)
    - ✅ Service Worker with NetworkFirst caching
    - ✅ nginx configured to never cache sw.js
    - ✅ Offline-first with IndexedDB persistence
    - ❌ Background sync — deferred
    - ✅ Responsive design (desktop, tablet, mobile)

**Backend Features**:
- User authentication (signup, login, password reset) — ✅ Implemented
- Project persistence to SQLite database — ✅ Implemented
- Secure AI API key proxy (keys never exposed to client) — ✅ Implemented
- Offline-first sync with conflict resolution — 🟡 Partial (client-side IndexedDB, sync deferred)

**UI/UX**:
- ✅ Scene-focused navigation (Features #18-20)
- ✅ 4-tab layout: Script | Shots | Storyboards | Breakdown
- ✅ Left sidebar: scene list, characters, stats, quick actions
- ✅ Right panel: contextual tools
- ✅ Mobile: stacked layout with bottom nav

**Project Management**:
- ✅ Server-side persistence with local caching
- ❌ Auto-sync when online — deferred
- ❌ Manual export/import for backup — deferred

**Success Criteria**:
- ✅ User can create account and authenticate
- ✅ Filmmaker can create/import a script
- ✅ Script breakdown auto-extracts scenes, characters, locations
- ✅ Filmmaker creates and confirms shot list
- ✅ AI generates storyboard panels based on shot list
- ✅ Filmmaker can refine panels
- ❌ Filmmaker can export storyboard images — deferred
- ✅ End-to-end workflow works for a 5-10 page script (demo project)
- 🟡 Offline editing works; sync when connection restored is deferred
- ✅ **NO video generation** - storyboard export is sufficient for MVP

### Phase 1.1: Enhanced Visual References & Video

**Goal**: Add character visual references and video generation

**Additional Features**:
- **Character Management with Visual References** (Feature #2)
  - Create character profiles with text descriptions
  - AI generates visual reference images from descriptions
  - Director approves/refines reference images
  - Approved references used for consistent character rendering

- **Video Generation** (Feature #8, single API)
  - Generate video clips per scene
  - Single video API (easiest/cheapest for prototype)
  - Basic generation parameters (duration, motion intensity)
  - Export video clips

- **Enhanced Scene Configuration** (Feature #3, full)
  - Full scene-level settings
  - Color palette, visual style options
  - Location/set description with mood/atmosphere

### Phase 2: Advanced Features

**Goal**: Increase power user capabilities and workflow efficiency

**Additional Features**:
- **Import Formats Beyond Fountain** (Feature #1, expanded)
  - Final Draft (.fdx) import
  - Celtx import
  - Plain text with auto-format detection
- **Multiple Video Generation APIs** (Feature #11)
  - RunwayML (Gen-2/Gen-3)
  - Pika Labs
  - Stability AI
- **Per-Panel Video Preview** (Feature #9)
  - Generate single panel as video preview
  - Faster feedback for iteration
- **Storyboard Style Variants**
  - More aesthetic options (watercolor, marker, etc.)
  - Style mixing within project
- **Advanced Video Generation Parameters**
  - Camera movement intensity
  - Resolution/quality settings
- **Video Export with Transitions** (partial Feature #10)
  - Assemble scenes with basic transitions
- **Team Collaboration**
  - Share projects with team members
  - Permission levels (view, edit, admin)
  - Real-time collaboration features

### Phase 3: Platform & Collaboration

**Goal**: Multi-user workflows and enterprise features

**Additional Features**:
- **Team Collaboration** (Feature #17.5 enhanced)
  - Share projects with team members
  - Permission levels (view, edit, admin)
  - Real-time collaboration with presence indicators
- **Comments & Annotations** (expanded from Feature #1.10)
  - Multi-user comments
  - @mentions and notifications
- **Activity History**
  - Project history and activity log
  - Who changed what and when
- **Team Project Management**
  - Team workspaces
  - Project roles and permissions
- **Full Video Assembly and Export** (complete Feature #10)
  - Assemble full video with transitions
  - Export options: resolution, frame rate, format
- **Enterprise Features**
  - SSO integration (SAML, OIDC)
  - Audit logs
  - Advanced analytics

**User Story**: As a filmmaker, I want to see the original script text alongside storyboards so that I can ensure the visual interpretation matches my written words.

**Acceptance Criteria**:
- **Script View Mode**: Full parsed script display
  - Fountain format highlighting
  - Click scene heading to jump to that scene
  - Click character name to view character profile
  - Editable script text ( Fountain format)
- **Split View Mode**: Script on left, storyboards on right
  - Synced scrolling - script scroll updates storyboard view
  - Click action line → highlight corresponding storyboard panel
  - Click storyboard panel → highlight script text
- **Storyboard View Mode**: Hide script, focus on visuals (default)

**User Story**: As a filmmaker, I want to sync my projects to the cloud so that I can access them from anywhere and collaborate with team members.

**Acceptance Criteria**:
- User accounts with authentication
- Projects synced to cloud storage
- Access projects from any device
- Real-time sync across devices
- Collaborative features:
  - Share projects with specific users
  - Permission levels (view, edit, admin)
  - Comments/annotations on storyboards
- Offline mode with conflict resolution
- Project history and activity log

**User Story**: As a filmmaker, I want to select from multiple video generation APIs so that I can choose the best option for my needs (cost, quality, speed).

**Acceptance Criteria**:
- Support multiple video generation APIs:
  - RunwayML (Gen-2/Gen-3)
  - Pika Labs
  - Stability AI
  - Easy to add new integrations
- API selection at project or scene level
- Display API status (available, rate limits, costs if known)
- **Prototype phase**: Implement with easiest/cheapest option first
- Fallback/error handling if API is unavailable

---

## Resolved Questions

### ✓ Question 3: Storyboard Elements to Control

**Answer**: Hierarchical control approach
- **Scene-level**: Overall style, setting, mood, lighting (applies to all storyboards in scene)
- **Storyboard-level**: Shot composition, character positioning, camera angles, expressions (per panel)
- Scene defaults can be overridden at storyboard level

### ✓ Question 4: Storyboard Interaction Model

**Answer**: Hybrid approach with AI rough drafts
- AI breaks script into scenes and storyboards (rough drafts)
- Each storyboard has an "Edit" button
- Director enters targeted prompts to refine specific panels
- AI regenerates individual panels based on prompts
- Non-destructive editing with undo/redo

### ✓ Question 5: Character Reference System

**Answer**: Hybrid (text → visual reference)
- Character management similar to Fade In/Final Draft (text-based profiles)
- AI generates visual reference images from text descriptions
- Director approves/refines reference images
- Approved references ensure consistency across storyboards

### ✓ Question 6: Video Generation

**Answer**: Per-scene generation with per-panel preview option
- **Primary**: Generate video clips for all panels in a scene (batch processing)
- **Optional**: Generate single panel as preview
- **Output**: Individual video clips per panel (organized folder structure)
- **Future**: Full video assembly with transitions
- **APIs**: Multiple options (RunwayML, Pika Labs, Stability AI), prototype with easiest/cheapest

### ✓ Question 7: Project Management

**Answer**: Hybrid approach with phased rollout
- **Phase 1**: Local auto-save + manual export/import (browser-based)
- **Phase 2**: Versioning, duplication, smart Fountain import
- **Phase 3**: Cloud sync, user accounts, collaboration features

### ✓ Question 8: Storyboard Visual Representation

**Answer**: Static AI images with sketch/illustrated/manga aesthetic
- **Primary**: Static images (fastest, lightest, cheapest)
- **Style options**: Pencil sketch, ink drawing, manga/comic, watercolor storyboard
- **Style selection**: At script or scene level for consistency
- **Future enhancement**: Optional motion preview for key shots (Phase 2+)

### ✓ Question 9: User Interface & Navigation

**Answer**: Scene-focused navigation
- **Main view**: Single scene at a time with its storyboard panels
- **Left sidebar**: Project navigation, scene list, characters, global settings
- **Main area**: Current scene content, storyboard filmstrip, script text
- **Right panel**: Contextual tools (edit prompts, settings, video generation)
- **View modes**: Storyboard / Script / Split view
- Navigation: Previous/next scene, scene dropdown, click sidebar

### ✓ Question 10: MVP Scope

**Answer**: Three-phase approach with clear MVP

**Phase 1 (MVP)**: Core script → storyboard workflow
- Script parsing, scene config, AI storyboard generation, refinement, image export
- Local project management, scene-focused UI
- **NO video generation** - focus on storyboard quality and workflow
- Validate core value proposition

**Phase 1.1**: Add characters and video generation
- Character management with visual references
- Video generation (Stable Video Diffusion + 通义万相)
- Enhanced scene configuration

**Phase 2**: Advanced features
- Versioning, duplication, smart import
- Multiple APIs, per-panel video preview
- Advanced generation parameters

**Phase 3**: Platform & collaboration
- Cloud sync, user accounts, team features
- Full video assembly and export

### ✓ Question 11: Technical Architecture

**Answer**: Full-stack TypeScript application with PWA functionality

**Frontend**: React + TypeScript, Vite, TanStack (Query/Zustand), PWA (service worker, offline-first)
**Backend**: Bun + Elysia + SQLite (from MVP)
**Storage**: SQLite on server + IndexedDB for offline cache

**Rationale**:
- Full-stack from MVP provides authentication, secure API key management, and persistent storage
- PWA capabilities enable offline editing with automatic sync
- Bun + Elysia + SQLite for lightweight, type-safe backend with single-server deployment
- TanStack for excellent API state management
- TypeScript everywhere for type safety
- Secure: AI API keys never exposed to client

### ✓ Question 12: Image Generation API

**Answer**: Dual API support - SDXL + 通义万相 wan2.6

**SDXL (Primary)**:
- Lowest cost (~$0.002/image via Replicate)
- Good quality for storyboard aesthetics
- Best for international users

**通义万相 wan2.6-t2i (Secondary)**:
- ¥0.20/image (~$0.028)
- Excellent for China-based users
- Superior text rendering and sketch control
- Native ControlNet support for line art

**Implementation**:
- Abstraction layer for easy API switching
- Auto-select based on user region
- Per-scene API override option
- Cost estimation and tracking

### ✓ Question 13: Video Generation API

**Answer**: Defer to Phase 1.1

**Decision**: Skip video generation for MVP

**Rationale**:
- Focus on core storyboard workflow for MVP
- Reduce complexity and development time
- Validate script → storyboard value proposition first
- Video generation adds significant cost and API complexity

**Phase 1.1 Plan**:
- Stable Video Diffusion (cheapest, ~¥0.14-0.36/second)
- 通义万相 wan2.6-i2v (¥0.6-1.0/second, for China users)
- Add RunwayML/Pika Labs later as premium options

## Open Questions

---

## Technical Architecture

### Tech Stack

**Frontend**:
- **Framework**: React with TypeScript
- **Build Tool**: Vite (fast dev server, optimized builds)
- **Styling**: CSS Modules or Tailwind CSS
- **State Management**: TanStack (Query for API calls, simple Zustand for local state if needed)
- **UI Components**: Consider shadcn/ui or Radix UI for accessible components
- **Functional Programming**: fp-ts behind facade pattern (see docs/fp-*.md)
- **PWA**: Service worker for offline support, installable app experience

**Backend**:
- **Runtime**: Bun
- **Web Framework**: Elysia
- **Database**: SQLite (via bun:sqlite native driver)
- **Authentication**: JWT-based
- **API Key Proxy**: Secure handling of AI service API keys on server

**Why Full-Stack with PWA?**
- **Security**: API keys stored securely on server, never exposed to client
- **Persistence**: Reliable server-side storage with offline-first local cache
- **Authentication**: User accounts with proper session management
- **Sync**: Automatic synchronization between devices
- **PWA Benefits**: Installable, works offline with sync when online
- **Simple Deployment**: Bun + Elysia + SQLite = single server deployment

### Functional Programming Workflow

**fp-ts Facade Pattern**: Business logic uses functional programming patterns for type-safe error handling and null safety:

```typescript
// ✅ RIGHT - Import from facade only
import { Option, Result, AsyncResult, AppError } from '@/lib/fp';

// Service layer - pure composition, returns AsyncResult
class ShotListService {
  static confirmShots(sceneId: string): AsyncResult<AppError, ConfirmedShots> {
    return shotListAdapter.findByScene(sceneId)
      .andThen(shots => this.validateShotCount(shots))
      .andThen(shots => shotListAdapter.confirm(sceneId, shots));
  }
}

// Component edge - execute AsyncResult at boundaries
function ShotListConfirmButton({ sceneId }: Props) {
  const handleClick = async () => {
    const result = await ShotListService.confirmShots(sceneId).run();
    result.match({
      ok: (confirmed) => onConfirm(confirmed),
      err: (error) => showError(error.message),
    });
  };
}
```

**Key Principles**:
- **Never import fp-ts directly** outside `src/lib/fp/` facade
- **AsyncResult.run() only at edges** (components, event handlers)
- **Services return AsyncResult** for composable business logic
- **Single error domain**: All operations use `AppError` type

See `docs/fp-quick-start.md` for common patterns and `docs/fp-anti-patterns.md` for mistakes to avoid.

### Architecture Decisions

**Why Full-Stack Web Application with PWA?**
- Complete application from the start with proper authentication and persistence
- Secure API key handling on the server side
- PWA enables offline use with automatic sync when online
- Single server deployment with Bun + Elysia + SQLite (no separate DB server)
- TypeScript everywhere for end-to-end type safety

**Why Bun + Elysia + SQLite?**
- **Bun**: Fast all-in-one runtime with native TypeScript, built-in test runner, bundler, and package manager
- **Elysia**: Modern, type-safe web framework built for Bun with excellent DX
- **SQLite**: Lightweight, embedded database (easy hosting, no separate DB server)
- **TypeScript everywhere**: End-to-end type safety

**Why PWA Functionality?**
- Installable on desktop and mobile devices
- Offline-first architecture with background sync
- App-like experience without app store distribution
- Automatic updates via service worker

**Why TanStack?**
- **TanStack Query**: Best-in-class data fetching, caching, state management
- **Type-safe**: Excellent TypeScript support
- **React Query**: Perfect for managing AI API calls and their states

### Key Technical Considerations

**Script Parsing**:
- Fountain format parsing library integration
- Parse scenes, characters, dialogue, action lines, transitions
- Handle Fountain format variations

**Data Model**:
- Hierarchical: Project → Script → Scenes → Shots → Storyboards → Panels
- Shot List: Per-scene shot definitions with metadata (type, angle, movement, characters, action, duration)
- Metadata: Script-level (style, mood), Scene-level (location, lighting), Shot-level (type, angle, movement)
- Character profiles with reference images
- Version history for storyboards
- Comments and notes at all levels (script, scene, shot, storyboard)

**AI API Integration**:
- Image generation APIs (for storyboard panels)
  - Shot list is the PRIMARY INPUT specification
  - Each confirmed shot → one storyboard panel
  - Shot metadata (type, angle, movement) → generation parameters
- Video generation APIs (for final output)
- Error handling, retry logic, rate limiting
- Generation progress tracking

**State Management**:
- Complex hierarchical state (project → script → scene → shots → storyboards)
- Undo/redo for shot list edits and storyboard edits
- Auto-save with conflict resolution (shot lists auto-save on every change)
- Offline-first architecture with PWA support

**Performance**:
- Lazy loading storyboard images
- Virtual scrolling for large projects
- Efficient IndexedDB queries
- Optimistic UI updates

## Technical Considerations

- Fountain format parsing library integration
- Scene metadata structure and persistence
- Shot list data model and persistence (critical for storyboard generation)
- Storyboard panel rendering/preview
- Video generation API integration(s)
- State management for hierarchical settings (script → scene → shots → storyboards)
