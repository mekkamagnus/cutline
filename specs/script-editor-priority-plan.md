# Chore: Prioritize Fountain Script Editor (Fade In-style)

## Chore Description

Update the mockup screens to make the Fountain script editor the primary focus, similar to the professional screenwriting application "Fade In". The script editor should be the central/main screen, while the breakdown, shot list, and storyboard features should be accessible via navigation to separate screens. This reflects a writer-first workflow where script editing is the core activity.

## Relevant Files

Use these files to resolve the chore:

### Existing Files to Modify
- `mockup.html` - Desktop mockup that needs restructuring to prioritize script editor
- `mockup-mobile.html` - Mobile mockup that needs restructuring to prioritize script editor

### Reference Files
- `docs/prd.md` - Feature #1.5 (Script Editor) specifications for Fountain format editing requirements

### New Files
- None (updating existing mockups)

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Redesign Desktop Mockup with Script Editor as Main Screen

**Restructure `mockup.html` to prioritize script editor:**

- Create new "Main Script Editor" screen as the primary/dashboard screen
- Script editor should take up 80%+ of the viewport with minimal chrome
- Include Fade In-style elements:
  - Full-screen Fountain editor with proper screenplay formatting (Courier font, standard margins)
  - Scene navigator sidebar (collapsible) showing scene list with quick jump
  - Character quick-list sidebar (collapsible)
  - Bottom toolbar with formatting shortcuts (Scene, Character, Dialogue, Action, etc.)
  - Top bar with: Script title, page count, save indicator, view mode toggle
  - Line numbers (optional, toggleable)
  - Auto-formatting preview as you type

**Separate screens for other features:**

- Move Script Breakdown to its own dedicated screen (accessible via navigation)
- Move Shot List Editor to its own dedicated screen (per-scene access)
- Move Storyboard View to its own dedicated screen (per-scene access)
- Add clear navigation between screens:
  - Top-level tabs: Script | Breakdown | Shots | Storyboards
  - Or sidebar navigation for switching between modes

**Screen order in mockup (new priority):**

1. **Main Script Editor** (new, prominent - full featured)
2. Scene Navigator / Script Outline (inline panel or modal)
3. Script Breakdown (separate screen)
4. Shot List Editor (separate screen, per-scene)
5. Storyboard View (separate screen, per-scene)
6. Shot Suggestions (modal/panel within shot list)
7. Other screens (collaboration, settings, etc.)

### Step 2: Design Fade In-Style Script Editor Interface

**Script Editor UI Components:**

**Top Bar:**
- Project/script name (editable)
- Scene indicator: "Scene 1 of 12" with dropdown for quick navigation
- Page count: "Page 3 of 27"
- Save status indicator with unsaved changes badge
- Export/Share buttons
- View mode: Script View / Scene Cards / Outline

**Main Editor Area:**
- Clean, distraction-free Fountain editor
- Standard screenplay margins (1.5" left/right, Courier Prime 12pt)
- Auto-formatting:
  - Force CAPS after Scene Heading (INT./EXT.)
  - Auto-center Character names
  - Auto-center Dialogue under characters
  - Auto-identify Parentheticals
  - Tab navigation between elements (Scene → Action → Character → Dialogue → Action)
- Scene headings highlighted/distinct styling
- Character names with auto-complete from character roster
- Fountain syntax highlighting (subtle, not code-editor style)
- Soft wrap at standard screenplay line length
- Page break indicators

**Left Sidebar (collapsible):**
- Scene Navigator / Scene List
- Click scene heading to jump to that scene
- Scene color coding (optional)
- Scene icons for INT/EXT identification

**Right Sidebar (collapsible):**
- Character Roster (speaking characters in this script)
- Scene notes for current scene
- Quick stats: scenes, characters, locations

**Bottom Toolbar:**
- Format buttons: [Scene] [Character] [Dialogue] [Action] [Parenthetical] [Transition]
- Keyboard shortcut hints
- Zoom controls (text size)

**Keyboard Shortcuts Display:**
- Tab: Next element type
- Enter: New line of current type
- Ctrl/Cmd + Enter: New scene
- Cmd/Ctrl + S: Save
- Cmd/Ctrl + F: Find & Replace

### Step 3: Redesign Mobile Mockup with Script Editor as Main Screen

**Restructure `mockup-mobile.html` to prioritize script editor:**

- Mobile script editor as the primary landing after opening a project
- Full-width script editor with mobile-optimized controls
- Bottom navigation bar: [Script] [Breakdown] [Shots] [Storyboards] [Settings]
- Floating action button for quick format shortcuts
- Slide-out panels for scene navigator and character list
- Mobile-specific: swipe gestures for scene navigation

**Mobile Script Editor Features:**
- Clean typography optimized for mobile reading
- Pull-to-refresh save indicator
- Scene jumper (tap scene header to navigate)
- Format toolbar slides up from bottom
- Landscape mode support with extended toolbar

### Step 4: Update Navigation Flow

**Desktop Navigation:**

```
Project Dashboard
    ↓ (select project)
Main Script Editor ← PRIMARY LANDING
    ↓ (via top navigation)
    ├─→ Script Breakdown (dedicated screen)
    ├─→ Shot List Editor (dedicated screen, per scene)
    ├─→ Storyboard View (dedicated screen, per scene)
    └─→ Settings/Export
```

**Mobile Navigation:**

```
Project List
    ↓ (select project)
Script Editor ← PRIMARY LANDING (bottom nav: Script tab)
    ↓ (bottom nav bar)
    ├─→ Breakdown tab
    ├─→ Shots tab
    ├─→ Storyboards tab
    └─→ Settings tab
```

### Step 5: Implement the Changes

**Update `mockup.html`:**
1. Reorder screens to put Script Editor first and most prominent
2. Expand Script Editor screen with Fade In-style interface elements
3. Add Scene Navigator sidebar
4. Add formatting toolbar
5. Make other features navigable via clear navigation
6. Add proper Fountain syntax highlighting example

**Update `mockup-mobile.html`:**
1. Reorder screens to put Script Editor first
2. Expand mobile script editor interface
3. Add bottom navigation bar
4. Add slide-out panels for navigation
5. Make other features accessible via tabs

### Step 6: Validation

**Review completed mockups:**
- Script editor is now the primary, most prominent screen
- Fade In-style interface elements are visible
- Navigation to other features is clear and intuitive
- Mobile version has appropriate bottom navigation
- All screens are accessible and properly styled

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `open mockup.html` - Verify desktop mockup opens and displays script editor as primary screen
- `open mockup-mobile.html` - Verify mobile mockup opens and displays script editor as primary screen
- `grep -i "script editor" mockup.html` - Verify script editor content exists
- `grep -i "script editor" mockup-mobile.html` - Verify mobile script editor content exists

## Notes

**Fade In Reference:**
- Fade In is a professional screenwriting software with a clean, writer-focused interface
- The script editor is the main workspace; other features (breakdowns, scheduling) are in separate panels/windows
- Emphasis on distraction-free writing with proper screenplay formatting

**Key Changes:**
- Script editor is no longer "just one of many screens" — it's the primary workspace
- Breakdown, shots, storyboards become "tools around the script" rather than equals
- Navigation flow: Script → Tools (as needed) → Back to Script
- This aligns with writer's actual workflow: write first, plan shots later

**Design Philosophy:**
- Writer-first, not storyboard-first
- Script is the source of truth; everything else derives from it
- Minimize cognitive load for the writing task
- Make production planning tools available but not intrusive
