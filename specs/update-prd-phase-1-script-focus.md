# Chore: Update PRD Phase 1 - Shot-List-First Architecture

## Chore Description
Update `docs/prd.md` to restructure Phase 1 around a **shot-list-first architecture**. The shot list is the critical bridge between script and storyboards - it tells the AI what storyboards to generate.

**Core Workflow:**
```
Script → Script Breakdown → Shot List Creation → Shot List Confirmation
  → AI Storyboard Generation → Storyboard Refinement → Export
```

**Key insight:** The shot list is the INPUT specification for AI storyboard generation. Without an approved shot list, the AI doesn't know what to generate.

## Relevant Files
Use these files to resolve the chore:

### Existing Files
- `docs/prd.md` - The main PRD file that needs to be updated

### New Files
- None - This is a documentation-only update

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Update Core Workflow Section

**Location**: Lines 11-21 in `docs/prd.md` (Core Workflow)

**Changes to make**:
- Update the workflow diagram to include Shot List as a distinct step
- Current: `Script Input → AI Script Parsing → Storyboard Creation → Video Generation`
- New: `Script Input → AI Script Parsing → Shot List Creation → AI Storyboard Generation → Video Generation`

### 2. Add Shot List Editor Feature (NEW - Critical)

**Location**: Add as Feature #1.7, after Script Breakdown & Analysis (around line 85)

**Content to add**:
```markdown
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
```

### 3. Add AI-Assisted Shot Suggestions Feature (NEW)

**Location**: Add as Feature #1.8, after Shot List Editor (around line 110)

**Content to add**:
```markdown
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
```

### 4. Add Shot List Confirmation Feature (NEW)

**Location**: Add as Feature #1.9, after AI-Assisted Shot Suggestions (around line 130)

**Content to add**:
```markdown
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
```

### 5. Update AI Storyboard Generation Feature

**Location**: Feature #6 (lines 132-156) in `docs/prd.md`

**Changes to make**:
- Update to explicitly state it takes the CONFIRMED SHOT LIST as input
- Add: "Only available after shot list is confirmed"
- Remove: AI auto-breaking script into scenes (now handled by shot list)
- Update acceptance criteria to reference shot list fields

**Updated content**:
```markdown
### 6. AI Storyboard Generation (Updated)

**User Story**: As a filmmaker, I want the AI to generate storyboard panels based on my confirmed shot list so that I get visual representations of my planned shots.

**Acceptance Criteria**:
- Requires confirmed shot list (Feature #1.9)
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
- Progress indicator: "Generating storyboard 3 of 12 for Scene 5"
- Cost tracking: show API cost per panel and running total
- Batch generation: generate all storyboards for a scene at once
- Individual regeneration: regenerate specific panels after viewing
```

### 6. Update Script Editor Feature Specification

**Location**: Add as Feature #1.5, after Script Input & Parsing (around line 48)

**Content to add**:
```markdown
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
```

### 7. Update Script Breakdown & Analysis Feature Specification

**Location**: Add as Feature #1.6, after Script Editor (around line 70)

**Content to add**:
```markdown
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
```

### 8. Add Local Collaboration Features

**Location**: Add as Feature #1.10, after Shot List Confirmation (around line 150)

**Content to add**:
```markdown
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
```

### 9. Add Progressive Web App (PWA) Feature

**Location**: Add as Feature #1.11, after Local Collaboration (around line 175)

**Content to add**:
```markdown
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
```

### 10. Update Project Management Features

**Location**: Features #12-13 (lines 230-252) in `docs/prd.md`

**Changes to make**:
- Add that project data now includes shot lists
- Update auto-save to include shot list changes

### 11. Update Phase 1 Section in Development Phases & MVP Scope

**Location**: Lines 382-429 in `docs/prd.md`

**Changes to make**:
- Update Phase 1 goal: "Enable script creation, breakdown, shot list planning, and AI storyboard generation"
- Update Core Features list to include all new features
- Update Success Criteria to reflect shot-list-first workflow

**New Phase 1 Core Features**:
1. Script Input & Parsing (Feature #1) - Fountain format only
2. Script Editor (Feature #1.5) - In-app editor with AV format support
3. Script Breakdown & Analysis (Feature #1.6) - Auto-tagging, reports
4. Shot List Editor (Feature #1.7) - Define shots per scene
5. AI-Assisted Shot Suggestions (Feature #1.8) - AI suggests coverage
6. Shot List Confirmation (Feature #1.9) - Confirm before generation
7. AI Storyboard Generation (Feature #6, updated) - From confirmed shot list
8. Storyboard Refinement (Feature #7) - Edit individual panels
9. Storyboard Export (simplified from Feature #10)
10. Local Collaboration (Feature #1.10) - Comments, versions, track changes
11. PWA (Feature #1.11) - Installable, offline, responsive

### 12. Update Phase 1.1, 2, 3 Sections

**Location**: Lines 431+ in `docs/prd.md`

**Changes to make**:
- Phase 1.1: Remove basic storyboard creation (now in Phase 1)
- Phase 2: Move character management with AI visual references, video generation
- Phase 3: Collaboration, cloud sync

### 13. Update Core Workflow Section (Top of PRD)

**Location**: Lines 11-21 in `docs/prd.md`

**Changes to make**:
```markdown
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
```

### 14. Update Technical Considerations

**Location**: Lines 706-742 in `docs/prd.md`

**Changes to make**:
- Add shot list data model to Data Model section
- Add shot list persistence considerations
- Note that shot list is primary input to storyboard generation API

**Add to Data Model**:
```markdown
- Hierarchical: Project → Script → Scenes → Shots → Storyboards
- Shot List: Per-scene shot definitions with metadata
- Metadata: Script-level (style, mood), Scene-level (location, lighting), Shot-level (type, angle, movement)
```

### 15. Update Product Philosophy Section

**Location**: Lines 23-29 in `docs/prd.md`

**Changes to make**:
- Emphasize director control through shot list
- AI suggests shots, director confirms
- Shot list is the contract between director and AI

**Updated content**:
```markdown
### Product Philosophy

**Shot-List-First Approach**:
- The AI is a powerful assistant that suggests shot coverage
- The director maintains creative control through the shot list
- AI suggests → Director edits → Director confirms → AI generates
- The confirmed shot list is the specification for storyboard generation
- No surprise storyboards: every storyboard panel corresponds to an approved shot
```

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `grep -n "Shot List Editor" docs/prd.md` - Verify Shot List Editor feature was added
- `grep -n "AI-Assisted Shot Suggestions" docs/prd.md` - Verify AI Shot Suggestions feature was added
- `grep -n "Shot List Confirmation" docs/prd.md` - Verify Shot List Confirmation feature was added
- `grep -A 5 "### Core Workflow" docs/prd.md | grep -i "shot list"` - Verify workflow includes shot list
- `grep -c "### 1\.[0-9]" docs/prd.md` - Verify new features are numbered correctly (should be 1.5, 1.6, etc.)
- `grep -A 30 "### Phase 1:" docs/prd.md | grep -i "shot list"` - Verify Phase 1 includes shot list features
- `grep -A 10 "### 6. AI Storyboard Generation" docs/prd.md | grep -i "confirmed shot list"` - Verify storyboard generation references shot list

## Notes

**Critical Architectural Change**:
The shot list is now the BRIDGE between script and storyboards. This is a fundamental shift from the original PRD where AI would auto-generate storyboards directly from the script.

**Why this matters**:
1. **Director Control**: The director explicitly decides WHAT shots are needed
2. **Cost Control**: No wasted API credits on unwanted storyboards
3. **Predictability**: Each shot in the shot list = exactly one storyboard panel
4. **Iteration**: Easy to adjust shot list before committing to generation
5. **Teaching**: Helps filmmakers think visually before generating

**Phase Structure After This Change**:
- **Phase 1**: Script → Breakdown → Shot List → AI Storyboards (complete shot-to-visual workflow)
- **Phase 1.1**: Character visual references, enhanced scene configuration
- **Phase 2**: Video generation, advanced storyboard features
- **Phase 3**: Cloud sync, multi-user collaboration

**Adobe Story Features Selected**:
From Adobe Story analysis, Phase 1 now includes:
- ✅ Script editor with auto-formatting
- ✅ Script breakdown (all features)
- ✅ Shot lists (NEW - core feature)
- ✅ Local collaboration (comments, versions, track changes)
- ✅ PWA with mobile editing
- ❌ Production scheduling - deferred
- ❌ Integration with other tools - skipped
- ❌ Cloud collaboration - deferred to Phase 3
