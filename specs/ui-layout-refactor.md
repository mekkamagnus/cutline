# Chore: UI Layout Refactor to Match Mockup

## Chore Description

The current app layout does not match the mockup design. The app shows a single-column/stacked layout instead of the expected three-panel desktop design (left sidebar | main editor | right sidebar). This chore involves refactoring the UI components to match the mockup.html design and DESIGN.md specifications.

## Progress Tracking

**Completed: 10/10 tasks (100%)**

- [x] 1. Create Design Tokens CSS
- [x] 2. Create Header Component
- [x] 3. Refactor Left Sidebar
- [x] 4. Refactor Right Panel
- [x] 5. Refactor Script Editor
- [x] 6. Create Format Bar
- [x] 7. Update Main Layout
- [x] 8. Add Fountain Styling CSS
- [x] 9. Update SceneWorkspace
- [x] 10. Add Responsive Breakpoints

## Current vs Expected

### Current State (10/10 Match)
- Single-column stacked layout
- Simple breadcrumb header
- Basic textarea editor without fountain styling
- Right panel shows only "Details" header
- Format buttons disabled and unstyled
- No scene navigator with INT/EXT icons
- No character list panel
- Missing script page styling

### Expected State (Per mockup.html)
- Three-panel grid layout: `240px | 1fr | 200px`
- Full header with logo, nav tabs, version badge
- Left sidebar: Scene navigator with INT/EXT color coding + script stats
- Main editor: Script page with fountain syntax highlighting
- Right sidebar: Characters list + current scene info + quick actions
- Bottom format bar: Styled buttons with keyboard shortcuts
- Proper fountain element styling (scene headings, dialogue, etc.)

## Relevant Files

### Existing Files to Modify

- `app/client/src/App.tsx`
  - Contains the main app layout and routing
  - Currently uses simple stacked layout, needs three-panel grid

- `app/client/src/components/workspace/SceneWorkspace.tsx`
  - Main workspace component
  - Should implement the three-panel layout

- `app/client/src/components/workspace/LeftSidebar.tsx`
  - Should contain scene navigator with INT/EXT icons
  - Should show script stats (scenes, characters, locations, runtime, word count)

- `app/client/src/components/workspace/RightPanel.tsx`
  - Should contain characters list with avatars
  - Should show current scene info
  - Should have quick actions section

- `app/client/src/components/workspace/TopNavigation.tsx`
  - Should have full header with logo, nav tabs, version badge
  - Currently shows only breadcrumb

- `app/client/src/components/script/ScriptEditor.tsx`
  - Needs fountain syntax highlighting
  - Needs script page styling (box shadow, border, padding)

- `app/client/src/components/script/FountainHighlight.tsx`
  - Should color-code fountain elements
  - Needs proper styling for each element type

### New Files

- `app/client/src/components/workspace/Header.tsx`
  - New header component matching mockup design
  - Logo, nav tabs, version badge, export button

- `app/client/src/components/workspace/FormatBar.tsx`
  - Bottom format bar with styled buttons
  - Scene/Action/Character/Dialogue/Parenthetical/Transition buttons

- `app/client/src/styles/design-tokens.css`
  - Centralized CSS custom properties from DESIGN.md

## Step by Step Tasks

### 1. Create Design Tokens CSS

- [ ] Create `app/client/src/styles/design-tokens.css`
- [ ] Add all CSS variables from DESIGN.md (colors, spacing, typography)
- [ ] Import in main.tsx or index.css

### 2. Create Header Component

- [ ] Create `app/client/src/components/workspace/Header.tsx`
- [ ] Logo "Cutline" with tagline "Writer-First Screenwriting"
- [ ] Nav tabs: Script | Shots | Storyboards | Breakdown
- [ ] Version badge "v1.0 Phase 1"
- [ ] Style to match mockup (sticky, backdrop-filter blur)

### 3. Refactor Left Sidebar

- [ ] Update `LeftSidebar.tsx` to match mockup
- [ ] Add "Scenes" section header with add button
- [ ] Style scene items with INT/EXT icons (amber for INT, green for EXT)
- [ ] Add active state with accent border-left
- [ ] Add "Script Stats" section with all 5 stats
- [ ] Proper spacing and typography

### 4. Refactor Right Panel

- [ ] Update `RightPanel.tsx` to match mockup
- [ ] Add "Characters" section with avatars and dialogue counts
- [ ] Add "Current Scene" section with location/time info
- [ ] Add "Quick Actions" section with buttons
- [ ] Use proper card styling from mockup

### 5. Refactor Script Editor

- [ ] Update `ScriptEditor.tsx` with script page styling
- [ ] Add script-page container with box shadow and border
- [ ] Use Courier Prime font
- [ ] Add proper fountain element styling
- [ ] Add line numbers (optional toggle)
### 6. Create Format Bar

- [ ] Create `app/client/src/components/workspace/FormatBar.tsx`
- [ ] Add format buttons: Scene | Action | Character | Dialogue | Paren | Transition
- [ ] Color-code buttons to match fountain element colors
- [ ] Add keyboard shortcut hints (Mac/Win detection)
- [ ] Add right-side buttons: Find, Spell Check, Focus Mode

### 7. Update Main Layout

- [ ] Update `App.tsx` to use three-panel grid
- [ ] Apply CSS: `grid-template-columns: 240px 1fr 200px`
- [ ] Ensure proper header/footer grid placement
- [ ] Add format bar at bottom

### 8. Add Fountain Styling

- [ ] Update `FountainHighlight.tsx` with proper element classes
- [ ] Add CSS for each fountain element type
- [ ] Scene headings: uppercase, amber, bold
- [ ] Character names: centered, uppercase, blue
- [ ] Dialogue: centered, max-width 35ch
- [ ] Parentheticals: italic, centered
- [ ] Action: max-width 60ch
- [ ] Transitions: right-aligned, purple

### 9. Update SceneWorkspace

- [ ] Update `SceneWorkspace.tsx` to use new components
- [ ] Wire up view mode toggle (Script/Shots/Storyboard/Split)
- [ ] Add toolbar with scene selector and view controls

### 10. Add Responsive Breakpoints

- [ ] Add media queries for mobile layout
- [ ] Collapse to single column below 768px
- [ ] Add bottom navigation for mobile
- [ ] Ensure 44px touch targets on mobile

## Validation Commands

```bash
# Type check
cd app/client && npm run type-check

# Visual comparison (manual)
# 1. Open http://localhost:5173 in browser
# 2. Open mockup.html in another tab
# 3. Compare layouts side by side
# 4. Verify three-panel layout visible at 1440px width
# 5. Verify all sections present and styled correctly
```

### CSS Grid Layout
- `grid-template-columns: 240px 1fr 200px`
- `grid-template-rows: auto 1fr auto`
- **No `grid-template-columns` specified - single-column layout without proper grid**
- `display: flex`
- `flexDirection: column`
- `minHeight: 100vh`
  `padding: var(--space-8)`
  `textAlign: center`
}
```

- **No three-panel layout with CSS Grid**
- `grid-template-columns: 240px 1fr 200px` specified
- Left sidebar missing INT/EXT SVG icons (using actual CSS color variables like `color: var(--fountain-scene)`)
- Missing responsive CSS with 768px breakpoint
- `FormatBar` missing right-side utility buttons (Find, Spell Check, Focus Mode)
- No CSS file dedicated specifically for fountain styling classes (`.fountain-scene-heading`, etc.)
- Missing bottom navigation for mobile
- Touch targets should use CSS variables like `--touch-target-min`
 but not check mobile-specific CSS rules

**Remaining Work to Complete the refactor:**
- App.tsx: Replace stacked layout with three-panel grid
- App.tsx: Add Header, FormatBar, and proper layout integration
- SceneWorkspace.tsx: Replace TopNavigation with Header, use three-panel grid
- Add fountain styling CSS
- Add responsive breakpoints
- Add state for view mode toggle and view controls
- Ensure all styling matches mockup

### CSS Grid Layout

```css
.editor-container {
  display: grid;
  grid-template-columns: 240px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  height: calc(100vh - 73px);
}

.header { grid-column: 1 / -1; }
.format-bar { grid-column: 1 / -1; }
```

### Fountain Color Reference

| Element | Color | CSS Variable |
|---------|-------|--------------|
| Scene Heading | #fbbf24 (amber) | --fountain-scene |
| Character | #60a5fa (blue) | --fountain-character |
| Dialogue | #f5f5f5 (white) | --fountain-dialogue |
| Parenthetical | #9ca3af (gray) | --fountain-parenthetical |
| Action | #f5f5f5 (white) | --fountain-action |
| Transition | #c084fc (purple) | --fountain-transition |
| Shot | #fb923c (orange) | --fountain-shot |

### Scene Icon Colors

- INT scenes: `--fountain-scene` (amber #fbbf24)
- EXT scenes: `--success` (green #22c55e)

### Character Avatar Colors

Use distinct colors for main characters:
- Primary: `--accent` (#6366f1)
- Secondary: amber (#f59e0b)
- Tertiary: green (#22c55e)
- Quaternary: pink (#ec4899)

### Implementation Priority

1. **High**: Three-panel grid layout (foundational)
2. **High**: Header component with nav tabs
3. **High**: Left sidebar scene navigator
4. **Medium**: Right panel characters list
5. **Medium**: Script page styling
6. **Medium**: Format bar
7. **Low**: Responsive breakpoints
8. **Low**: Line numbers toggle
