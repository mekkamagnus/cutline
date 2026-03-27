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

### 1.5. Script Editor

**User Story**: As a filmmaker, I want to write and edit scripts directly in the application so that I can work on my screenplay without switching tools.

**Acceptance Criteria**:
- In-app Fountain format script editor with syntax highlighting
- Auto-formatting as you type (sluglines, character names, dialogue)
- Fountain format autocomplete
- Scene heading detection and formatting
- Character name caching and autocomplete
- Standard screenplay formatting (Courier font, proper margins/spacing)
- **AV Format Support**: Two-column script format (Video | Audio columns)
- Keyboard shortcuts for common script elements (Tab for character, Enter for dialogue, etc.)
- Word count and page count estimation
- Save indicator for unsaved changes
- Responsive design: editing works on desktop, tablet, and mobile

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

### 1.7. Shot List Editor

**User Story**: As a filmmaker, I want to define shots for each scene so that the AI knows exactly what storyboards to generate.

**Acceptance Criteria**:
- Per-scene shot list editor with tabular interface
- For each shot, define:
  - **Shot Number**: Sequential (1, 2, 3...)
  - **Shot Type**: Wide / Medium / Close-up / Extreme CU / Two-shot / Over-the-shoulder / Establishing / Insert
  - **Camera Angle**: Eye level / High angle / Low angle / Dutch angle / Bird's eye / Worm's eye
  - **Camera Movement**: Static / Pan / Tilt / Dolly / Truck / Pedestal / Arc / Handheld / Steadicam
  - **Characters in Frame**: Select from script's character roster
  - **Action Description**: Brief description of what happens in shot
  - **Duration**: Suggested length (seconds)
  - **Notes**: Director's additional notes
- Keyboard shortcuts: Tab to next field, Enter to add new shot, Ctrl+Z undo
- Copy/duplicate shot functionality
- Reorder shots (drag and drop or move up/down buttons)
- Delete shot with confirmation
- Shot count display per scene
- Auto-save shot list changes

### 1.8. AI-Assisted Shot Suggestions

**User Story**: As a filmmaker, I want the AI to suggest appropriate shots for my scenes so that I have a starting point rather than starting from blank.

**Acceptance Criteria**:
- AI analyzes scene content and suggests initial shot list
- Suggestions based on:
  - **Dialogue scenes**: Suggest establishing wide, two-shot medium, close-ups on speaking characters
  - **Action scenes**: Suggest dynamic coverage with multiple angles
  - **Montage sequences**: Suggest quick-cut shots with variety
  - **Reveal moments**: Suggest specific close-up or insert shots
- AI provides reasoning: "Suggest close-up on JANE because this is her emotional reaction"
- Director can:
  - Accept all suggestions
  - Accept individual shots
  - Edit any suggested shot
  - Delete suggestions and add own shots
- "Regenerate suggestions" button with different prompt options
- Suggestions use scene context (characters, location, mood from breakdown)

### 1.9. Shot List Confirmation

**User Story**: As a filmmaker, I want to explicitly confirm my shot list before AI generation so that I don't waste credits on unwanted storyboards.

**Acceptance Criteria**:
- Review mode showing all shots in the scene
- Summary statistics: shot count, estimated storyboard generation cost
- "Confirm Shot List" button that:
  - Locks the shot list (prevents accidental edits)
  - Enables AI storyboard generation for this scene
  - Shows confirmation with estimated cost
- "Unlock for Editing" button to make changes after confirmation
- Visual indicator showing confirmed vs. unconfirmed scenes
- Bulk confirmation: confirm multiple scenes at once

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

### 6. AI Storyboard Generation (From Confirmed Shot List)

**User Story**: As a filmmaker, I want the AI to generate storyboard panels based on my confirmed shot list so that I get visual representations of my planned shots.

**Acceptance Criteria**:
- **Requires confirmed shot list** (Feature #1.9)
- For each confirmed shot in shot list, generates ONE storyboard panel
- Uses shot list fields as generation parameters:
  - Shot Type → influences framing and composition
  - Camera Angle → influences perspective in generated image
  - Camera Movement → hints at motion within static image
  - Characters in Frame → ensures correct characters appear
  - Action Description → main prompt content
- **Visual Style**: Static AI images with sketch/illustrated/manga aesthetic
  - Style options: Pencil sketch, Ink drawing, Manga/comic, Watercolor storyboard
  - Style selection at script or scene level
  - Consistent style within a scene
- Progress indicator: "Generating storyboard 3 of 12 for Scene 5"
- Cost tracking: show API cost per panel and running total
- Batch generation: generate all storyboards for a scene at once
- Individual regeneration: regenerate specific panels after viewing
- Fast generation (~2-5 seconds per panel)

### 7. Storyboard Refinement (Edit Mode)

**User Story**: As a filmmaker, I want to selectively edit individual storyboard panels with targeted prompts so that I can refine the AI's rough drafts without starting from scratch.

**Acceptance Criteria**:
- Each storyboard panel has an "Edit" button
- Edit mode opens prompt input for that specific panel
- Director enters refinement prompt:
  - "Make it a medium shot instead of close-up"
  - "Show character from behind, looking out window"
  - "Add dramatic side lighting"
- AI regenerates that single panel based on prompt
- Previous version saved (undo/redo capability)
- Non-destructive editing (can always revert to rough draft)

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
- Main view displays current scene with its storyboard panels
- **Left Sidebar**:
  - Project name and settings
  - Script overview (scene list with scene headings)
  - Character list (quick access to character profiles)
  - Scene navigation (previous/next, jump to scene)
  - Global settings (script-level config)
- **Main Content Area**:
  - Current scene heading (slugline)
  - Scene-level settings panel (collapsible)
  - Storyboard panels displayed in sequence
  - Timeline/filmstrip view of panels
  - Script text for this scene (action lines, dialogue)
- **Right Panel** (contextual, collapsible):
  - When editing storyboard: Edit prompt input, regeneration options
  - When configuring scene: Scene settings form
  - When generating video: Generation parameters and progress
- **Top Navigation**:
  - Breadcrumb: Project > Scene > Current Panel
  - View mode toggles: Storyboard view / Script view / Split view
  - Export / Save / Share buttons
- Navigation between scenes:
  - Previous/Next scene buttons
  - Scene dropdown for quick navigation
  - Click scene in left sidebar

### 19. Storyboard Panel Interaction

**User Story**: As a filmmaker, I want to interact with individual storyboard panels naturally so that I can review and refine them efficiently.

**Acceptance Criteria**:
- Storyboard panels displayed in horizontal scrollable strip (filmstrip style)
- Click panel to select/focus it
- Selected panel shows in larger detail view
- **Panel Actions**:
  - Edit button (opens edit prompt panel)
  - Regenerate button (create new version)
  - Duplicate button (copy panel)
  - Delete button (remove panel)
  - Move/reorder buttons (shift left/right)
- **Panel Detail View**:
  - Large preview of storyboard image
  - Associated script text (action lines, dialogue)
  - Panel metadata (shot type, characters in frame, location)
  - Version history (if edited multiple times)
- Keyboard navigation: Arrow keys to move between panels

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

### Phase 1: MVP (Minimum Viable Product)

**Goal**: Validate core value proposition - script → shot list → storyboard workflow

**Core Features**:
1. **Script Input & Parsing** (Feature #1)
   - Fountain format upload/paste only (other formats deferred)
   - Parse scenes, characters, dialogue, action lines
   - Display parsed structure

2. **Script Editor** (Feature #1.5)
   - In-app Fountain editor with syntax highlighting
   - Auto-formatting as you type
   - AV format support (two-column Video | Audio)
   - Responsive design: desktop, tablet, mobile editing

3. **Script Breakdown & Analysis** (Feature #1.6)
   - Auto-tag scenes, characters, locations, props
   - Scene breakdown reports (CSV/PDF export)
   - Character dialogue tracking
   - Location management (INT/EXT grouping)
   - Click-through navigation

4. **Shot List Editor** (Feature #1.7)
   - Per-scene shot definition with tabular interface
   - Shot type, angle, movement, characters, action, duration
   - Keyboard shortcuts, copy/duplicate, reorder shots

5. **AI-Assisted Shot Suggestions** (Feature #1.8)
   - AI suggests coverage based on scene analysis
   - Director accepts/edits/rejects suggestions
   - Contextual reasoning for each suggestion

6. **Shot List Confirmation** (Feature #1.9)
   - Review and lock shot list before generation
   - Estimated cost display
   - Visual confirmation indicators

7. **AI Storyboard Generation** (Feature #6, updated)
   - Generates from CONFIRMED SHOT LIST only
   - One storyboard per confirmed shot
   - Static AI images with sketch/illustrated aesthetic
   - Cost tracking per panel

8. **Storyboard Refinement** (Feature #7)
   - Edit button per panel
   - Text prompts to refine panels
   - Regenerate individual panels
   - Undo/redo

9. **Storyboard Export** (simplified from Feature #10)
   - Export storyboard images as files
   - Organized by scene
   - Include metadata

10. **Local Collaboration** (Feature #1.10)
    - Comments/notes on scenes, shots, storyboards
    - Version history (local snapshots)
    - Track changes

11. **Progressive Web App** (Feature #1.11)
    - Installable PWA
    - Offline mode
    - Responsive design (desktop, tablet, mobile)

**UI/UX**:
- Scene-focused navigation (Features #18-20)
- Shot list editor as central workflow
- Script, shot list, storyboard, and split view modes

**Project Management**:
- Local auto-save (Feature #12)
- Manual export/import as project file (Feature #13)
- Includes shot lists in project data

**Success Criteria**:
- Filmmaker can create/import a script
- Script breakdown auto-extracts scenes, characters, locations
- Filmmaker creates and confirms shot list
- AI generates storyboard panels based on shot list
- Filmmaker can refine panels
- Filmmaker can export storyboard images
- End-to-end workflow works for a 5-10 page script
- **NO video generation** - storyboard export is sufficient for MVP

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

### Phase 3: Cloud Collaboration & Platform

**Goal**: Multi-user workflows and cloud platform

**Additional Features**:
- **User Accounts & Authentication**
  - Sign up/login with email
  - Password reset
- **Cloud Sync** (Feature #16)
  - Projects synced to cloud storage
  - Access projects from any device
  - Real-time sync across devices
  - Offline mode with conflict resolution
- **Collaborative Editing**
  - Share projects with specific users
  - Permission levels (view, edit, admin)
  - Real-time collaboration
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

**Answer**: Modern TypeScript stack with browser-only MVP

**Frontend**: React + TypeScript, Vite, TanStack (Query/Zustand)
**MVP Storage**: IndexedDB, browser File System API
**Backend (Phases 2+)**: Bun + Elysium + SQLite

**Rationale**:
- Browser-only MVP for faster development and validation
- Bun + Elysium + SQLite for lightweight, type-safe backend when needed
- TanStack for excellent API state management
- TypeScript everywhere for type safety

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

**Frontend (All Phases)**:
- **Framework**: React with TypeScript
- **Build Tool**: Vite (fast dev server, optimized builds)
- **Styling**: CSS Modules or Tailwind CSS
- **State Management**: TanStack (Query for API calls, simple Zustand for local state if needed)
- **UI Components**: Consider shadcn/ui or Radix UI for accessible components

**MVP (Phase 1) - Browser Only**:
- **Data Storage**: IndexedDB (via Dexie.js or similar) for project data
- **File System**: Browser File System Access API for project import/export
- **API Integration**: Direct calls from browser to AI APIs
- **Authentication**: None (local-only)

**Phase 2+ - Backend (when cloud features needed)**:
- **Runtime**: Bun
- **Web Framework**: Elysium
- **Database**: SQLite (via better-sqlite3 or similar)
- **Authentication**: Will determine when needed (likely JWT-based)

### Architecture Decisions

**Why Browser-Only MVP?**
- Faster development (no backend to build/maintain)
- Lower complexity (single codebase)
- Privacy-friendly (projects stay local)
- Can validate core workflow before investing in backend

**Why Bun + Elysium + SQLite for Backend?**
- **Bun**: Fast, all-in-one toolkit (runtime, test runner, bundler)
- **Elysium**: Modern, type-safe web framework for Bun
- **SQLite**: Lightweight, embedded database (easy hosting, no separate DB server)
- **TypeScript everywhere**: End-to-end type safety

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
