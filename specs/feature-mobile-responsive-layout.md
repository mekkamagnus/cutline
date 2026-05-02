# Feature: Responsive Mobile Layout

## Feature Description
Create a responsive mobile layout for all 12 screens defined in `mockup-mobile.html`. The current mobile implementation renders desktop components in a single column, resulting in poor mobile UX. This feature builds dedicated mobile views with proper touch targets (44px min), card-based layouts, slide-over panels, and mobile-optimized navigation patterns.

## User Story
As a filmmaker on location
I want to use Cutline on my phone to write scripts, review shots, and manage storyboards
So that I can iterate on my project from anywhere without needing a laptop

## Problem Statement
The current mobile layout is a stripped-down desktop layout: sidebars are hidden, components render in a single column, and several screens (breakdown, characters, scene cards, notes, AI suggestions, project list) either don't exist on mobile or render as unstyled placeholders. The mockup defines 12 screens with proper mobile patterns (bottom nav, slide panels, FABs, filmstrips, card grids) but only ~4 of them are partially implemented.

## Solution Statement
Implement all 12 mobile screens from the mockup as dedicated React components with BEM CSS classes in `mobile.css`. Reuse existing store logic (`useUIStore`, `useSettingsStore`) and data hooks (`useScenes`, `useShots`). Leverage the existing design tokens in `tokens.css` and the mobile CSS foundation in `mobile.css`. Each screen gets its own mobile-optimized component or a mobile-specific render path within existing components.

## Relevant Files

### Existing Files to Modify
- `app/client/src/App.tsx` - Main app with `ProjectListScreen` and `ProjectWorkspace`; needs mobile routing and new screen components
- `app/client/src/styles/mobile.css` - All mobile CSS; needs new classes for cards, filmstrips, character list, scene cards, notes, project list
- `app/client/src/components/workspace/MobileTopBar.tsx` - Already exists; needs back-navigation variant for sub-screens
- `app/client/src/components/workspace/BottomNav.tsx` - Already exists with 4 tabs; may need "Projects" tab
- `app/client/src/components/workspace/SceneSlidePanel.tsx` - Already exists; works well
- `app/client/src/components/workspace/MobileFormatBar.tsx` - Already exists; works well
- `app/client/src/stores/ui-store.ts` - Already has `mobileView`, `focusMode`, `slidePanelOpen`, `quickFormatOpen`; may need new mobile sub-view state
- `app/client/src/components/shot-list/ShotListEditor.tsx` - Needs mobile card layout render path
- `app/client/src/components/storyboard/StoryboardScreen.tsx` - Needs mobile filmstrip + detail layout
- `app/client/src/components/settings/SettingsPanel.tsx` - Needs mobile full-screen variant
- `app/client/src/styles/tokens.css` - Design tokens (complete, no changes needed)
- `app/client/src/styles/shot-list.css` - Needs mobile card overrides
- `app/client/src/styles/storyboard.css` - Already has mobile adjustments; may need filmstrip additions

### New Files to Create
- `app/client/src/components/mobile/MobileBreakdownScreen.tsx` - Screen 4: Stats grid + scene list
- `app/client/src/components/mobile/MobileCharacterPanel.tsx` - Screen 8: Character list with avatars
- `app/client/src/components/mobile/MobileSceneCards.tsx` - Screen 10: Card-based scene overview
- `app/client/src/components/mobile/MobileNotesScreen.tsx` - Screen 11: Comments/notes list
- `app/client/src/components/mobile/MobileProjectList.tsx` - Screen 12: Project landing with cards
- `app/client/src/components/mobile/MobileShotCards.tsx` - Screen 5: Card-based shot list
- `app/client/src/components/mobile/MobileStoryboardView.tsx` - Screen 7: Filmstrip + detail view
- `app/client/src/components/mobile/MobileAISuggestions.tsx` - Screen 6: AI shot suggestion cards
- `app/client/src/components/mobile/MobileSettingsScreen.tsx` - Screen 9: Full-screen settings
- `app/client/src/components/mobile/index.ts` - Barrel exports

## Implementation Plan

### Phase 1: Foundation - Mobile Routing & Layout Shell
Update `App.tsx` to support mobile-specific routing. Add a `MobileShell` wrapper component that provides the top bar + content + bottom nav pattern used by every screen. Extend `ui-store.ts` with any new state needed for mobile sub-screens.

### Phase 2: Screen-by-Screen Implementation
Implement each of the 12 screens from the mockup, either as new mobile components or by adding mobile render paths to existing components. Order by priority (screens 1-5 are core workflow, screens 6-12 are supporting features).

### Phase 3: Polish & Integration
Wire up navigation between screens. Add transitions (slide-in for sub-screens). Ensure all touch targets meet 44px minimum. Test on 320px-428px viewport widths (iPhone SE to iPhone 15 Pro Max).

## Step by Step Tasks

### Step 1: Extend UI Store for Mobile
- Add `mobileSubView` to `ui-store.ts` to track sub-screens (e.g., `'characters' | 'notes' | 'settings' | 'scene-cards' | 'ai-suggestions' | null`)
- Add `setMobileSubView` action
- This allows the bottom nav to remain while sub-screens slide over content

### Step 2: Create Mobile Shell Component
- Create `app/client/src/components/mobile/MobileShell.tsx`
- Provides consistent layout: top bar slot, scrollable content area, bottom nav
- Handles padding for safe areas (notch, home indicator)
- Accepts `showBottomNav`, `showFormatBar`, `showSceneNav` props for screen-specific customization

### Step 3: Enhance Project List Screen (Screen 12)
- Create `app/client/src/components/mobile/MobileProjectList.tsx`
- New Project card (gradient accent background) + Import card (dashed border)
- Recent Projects list with thumbnail, title, scene count, timestamp, status badge
- Bottom nav with "Projects" and "Settings" tabs
- CSS: `.mobile-project-card`, `.mobile-project-card--new`, `.mobile-project-list`

### Step 4: Enhance Main Script Editor Screen (Screen 1)
- Already mostly working via `MobileTopBar` + `ScriptEditor` + `MobileFormatBar` + `BottomNav`
- Verify scene navigation bar renders correctly
- Ensure script page background matches mockup (`#1e1e1e` with border)
- Verify format bar buttons match mockup (Scene, Char, Dial, Act, Paren, More)

### Step 5: Implement Focus Mode Screen (Screen 2)
- Already partially implemented via `focusMode` in UI store and CSS `.focus-mode` class
- Add minimal bottom bar: Scene Up, Scene Down, Exit Focus buttons
- Verify back button and "Focus Mode" label in top bar
- CSS: Focus mode bottom bar with centered controls

### Step 6: Implement Scene Navigator Screen (Screen 3)
- Already implemented as `SceneSlidePanel` (slides from left)
- Add the "Scene Navigator" variant from mockup: inline scene jump chips above script content
- CSS: `.scene-chip`, `.scene-chip.active` already exist in `mobile.css`
- Add "Jump to Scene" row with numbered chip buttons

### Step 7: Implement Mobile Breakdown Screen (Screen 4)
- Create `app/client/src/components/mobile/MobileBreakdownScreen.tsx`
- Tab bar: Scenes | Characters | Locations
- Stats grid (2x2): Scenes, Characters, Locations, Minutes
- Scene list with INT/EXT icons and character counts
- CSS: `.mobile-breakdown-tabs`, `.mobile-breakdown-scene-item`

### Step 8: Implement Mobile Shot List Screen (Screen 5)
- Create `app/client/src/components/mobile/MobileShotCards.tsx`
- Replace desktop table with card layout: shot number badge + type + description
- Scene header: "Scene 1" + "INT. COFFEE SHOP - DAY"
- Bottom sheet with "Confirm Shot List" button
- Status badge (e.g., "5/5")
- CSS: `.shot-card` classes already exist in `mobile.css`; reuse and extend

### Step 9: Implement AI Suggestions Screen (Screen 6)
- Create `app/client/src/components/mobile/MobileAISuggestions.tsx`
- Suggestion cards with: shot type badges, description, AI reasoning, Accept/Edit buttons
- "Accept All" batch action
- Accent-bordered cards for new suggestions
- CSS: `.mobile-suggestion-card`, `.mobile-suggestion-card--new`

### Step 10: Implement Mobile Storyboard Screen (Screen 7)
- Create `app/client/src/components/mobile/MobileStoryboardView.tsx`
- Horizontal filmstrip thumbnails at top (scrollable)
- Large storyboard image below filmstrip
- Detail card: shot name, status badge, description, Edit/Regenerate buttons
- CSS: `.mobile-filmstrip`, `.mobile-filmstrip-thumb`, `.mobile-storyboard-detail`

### Step 11: Implement Characters Panel (Screen 8)
- Create `app/client/src/components/mobile/MobileCharacterPanel.tsx`
- Character list: avatar (colored circle with initial), name, role/description, line count
- "+ Add" button in top bar
- CSS: `.mobile-character-item`, `.mobile-character-avatar`

### Step 12: Implement Settings Screen (Screen 9)
- Create `app/client/src/components/mobile/MobileSettingsScreen.tsx`
- Project card with progress bar (scenes confirmed)
- Editor section: Auto-save toggle, Font Size row
- Export section: JSON and Fountain buttons
- Storyboard Style grid: Pencil/Ink/Manga/Watercolor
- CSS: `.mobile-settings-section`, `.mobile-settings-toggle`, `.mobile-settings-row`

### Step 13: Implement Scene Cards View (Screen 10)
- Create `app/client/src/components/mobile/MobileSceneCards.tsx`
- View toggle (Script/Cards) in top bar
- Scene cards: INT/EXT badge, location, synopsis, stats (dialogue lines, characters, pages)
- CSS: `.mobile-scene-card`, `.mobile-scene-card__badge`

### Step 14: Implement Notes Screen (Screen 11)
- Create `app/client/src/components/mobile/MobileNotesScreen.tsx`
- Tab bar: Comments | Versions
- Note cards: author, timestamp, message
- Add note textarea + submit button at bottom
- CSS: `.mobile-note-card`, `.mobile-note-input`

### Step 15: Add CSS for All New Components
- Add all new BEM classes to `app/client/src/components/mobile/mobile.css` (or extend `app/client/src/styles/mobile.css`)
- Ensure all interactive elements have 44px minimum touch targets
- Add `@media (pointer: coarse)` overrides
- Use existing design tokens from `tokens.css`

### Step 16: Wire Up Navigation
- Connect bottom nav tabs to mobile views
- Add slide-in transitions for sub-screens (characters, notes, settings, scene cards, AI suggestions)
- Top bar back button closes sub-screens
- Hamburger opens `SceneSlidePanel`
- Ensure `MobileTopBar` can render both the main view (hamburger + title + view toggle) and sub-screen variant (back + title + action)

### Step 17: Validation
- Run TypeScript type check: `cd app/client && bunx tsc --noEmit`
- Run build: `cd app/client && bun run build`
- Start dev server and test all 12 screens at mobile viewport widths (320px, 375px, 428px)
- Verify all touch targets >= 44px
- Verify bottom nav and format bar don't overlap content
- Test slide panel open/close transitions
- Test focus mode entry/exit

## Testing Strategy

### Unit Tests
- `MobileBreakdownScreen` renders stats grid and scene list from mock data
- `MobileShotCards` renders shot cards with correct types and descriptions
- `MobileCharacterPanel` renders character list with avatars and line counts
- `MobileSceneCards` renders scene cards with location and stats
- `MobileNotesScreen` renders note list and handles add note
- `MobileProjectList` renders project cards and new/import actions

### Integration Tests
- Bottom nav switches between Script/Shots/Boards/Breakdown views
- Top bar hamburger opens SceneSlidePanel
- Back button on sub-screens returns to main view
- Format bar scrolls horizontally without breaking layout
- Focus mode hides bottom nav and format bar

### Edge Cases
- Empty states: no shots, no characters, no notes
- Single scene script (scene nav disabled)
- Very long scene headings (truncated with ellipsis)
- Many shots requiring scroll in shot list
- Project list with zero projects
- Very long character names or scene names

## Acceptance Criteria
1. All 12 screens from `mockup-mobile.html` render correctly on viewports 320px-428px
2. Every interactive element has a minimum 44px touch target
3. Bottom nav correctly switches between Script, Shots, Boards, Breakdown views
4. Scene slide panel opens from hamburger and allows scene selection
5. Format bar scrolls horizontally and opens quick-format overlay
6. Focus mode hides bottom nav and format bar, shows exit button
7. Shot list renders as cards (not table) on mobile
8. Storyboard view shows filmstrip + detail layout on mobile
9. Breakdown screen shows stats grid + scene list with tabs
10. Characters panel shows list with avatars, roles, and line counts
11. Settings screen shows project info, toggles, export buttons, style selector
12. Project list shows new/import actions and recent project cards
13. Scene cards view shows card-based scene overview
14. Notes screen shows comment list with add note input
15. All screens use existing design tokens (no hardcoded colors/spacing)
16. TypeScript compiles with zero errors
17. Build succeeds with no errors

## Validation Commands
- `cd app/client && bunx tsc --noEmit` - TypeScript type check
- `cd app/client && bun run build` - Production build
- `cd app/client && bun run dev` - Start dev server for visual testing
- `bunx playwright test --config=playwright.config.ts` - Run any existing E2E tests

## Notes
- The mockup uses iPhone 15 Pro frames (320px content width) as reference
- All screens use the dark theme (`--bg-primary: #0f0f0f`) as default
- The existing `useBreakpoint` hook uses 768px as the mobile/desktop threshold
- CSS custom properties from `tokens.css` should be used exclusively - no hardcoded values
- The shot-list-first paradigm (confirmed shots before storyboard generation) must be preserved in mobile views
- The existing barrel export at `app/client/src/components/workspace/index.ts` needs updating to include new mobile components
- Sub-screens (characters, notes, settings, etc.) should use a slide-in animation matching the existing `.slide-panel` pattern
- The duplicate `view-mode-toggle.tsx` file should be cleaned up during implementation
