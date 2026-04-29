# Feature: Mobile Responsiveness

## Feature Description
Implement full mobile responsiveness across the Cutline application, matching the designs in `mockup.html` (desktop) and `mockup-mobile.html` (mobile). The mobile experience uses a single-column layout with bottom navigation, slide-over panels, a FAB for quick formatting, and card-based views for shots/breakdown — replacing the desktop three-panel grid.

## User Story
As a filmmaker on the go
I want to use Cutline on my phone or tablet
So that I can write, review shots, and check storyboards anywhere

## Problem Statement
The current app uses a fixed three-panel CSS grid (`240px 1fr 200px`) with no responsive breakpoints. On screens under 768px, the sidebars and main content crush together making the app unusable. Components use inline styles with no media query support, preventing any viewport-based adaptation.

## Solution Statement
1. Create a `useBreakpoint` hook to detect mobile/tablet/desktop viewports
2. Create a `BottomNav` component (mobile-only) with Script/Shots/Boards/Breakdown tabs
3. Create a `MobileTopBar` component replacing the desktop header on small screens
4. Create a `SceneSlidePanel` component that slides over from left on mobile
5. Create a `MobileFormatBar` with scrollable format buttons + FAB trigger
6. Refactor `App.tsx` and `SceneWorkspace.tsx` to conditionally render mobile vs desktop layouts based on breakpoint
7. Add responsive CSS to `tokens.css` and component-level media queries

## Relevant Files

### Existing Files to Modify
- `app/client/src/App.tsx` — Entry point; needs mobile vs desktop routing, ProjectListScreen responsive
- `app/client/src/components/workspace/SceneWorkspace.tsx` — Main workspace; needs conditional single-column vs three-panel layout
- `app/client/src/components/workspace/Header.tsx` — Desktop header; hidden on mobile, replaced by MobileTopBar
- `app/client/src/components/workspace/LeftSidebar.tsx` — Desktop sidebar; becomes slide-over panel on mobile
- `app/client/src/components/workspace/RightPanel.tsx` — Desktop right panel; hidden on mobile, content in bottom sheet
- `app/client/src/components/workspace/FormatBar.tsx` — Desktop format bar; becomes scrollable mobile format bar
- `app/client/src/components/workspace/ViewModeToggle.tsx` — Desktop toggle; hidden on mobile (replaced by BottomNav)
- `app/client/src/components/workspace/index.ts` — Barrel export; add new components
- `app/client/src/components/workspace/TopNavigation.tsx` — Breadcrumbs; simplified on mobile
- `app/client/src/stores/ui-store.ts` — Add mobile-specific state (panelOpen, slidePanelOpen)
- `app/client/src/styles/tokens.css` — Already has responsive breakpoint skeleton; extend with mobile-specific tokens
- `app/client/src/types/index.ts` — May need MobileViewMode type

### New Files
- `app/client/src/hooks/use-breakpoint.ts` — Viewport detection hook with `isMobile`, `isTablet`, `isDesktop` booleans
- `app/client/src/components/workspace/BottomNav.tsx` — Fixed bottom navigation bar (Script/Shots/Boards/Breakdown)
- `app/client/src/components/workspace/MobileTopBar.tsx` — Compact header with hamburger, title, view toggle
- `app/client/src/components/workspace/SceneSlidePanel.tsx` — Full-screen slide-over scene list with stats
- `app/client/src/components/workspace/MobileFormatBar.tsx` — Scrollable format buttons with FAB + quick-format grid overlay
- `app/client/src/styles/mobile.css` — Mobile-specific CSS (slide panels, FAB, bottom nav, card layouts, touch targets)

## Implementation Plan

### Phase 1: Foundation
Create the breakpoint detection hook, mobile CSS foundation, and extend the UI store with mobile state. These are prerequisites that all mobile components depend on.

### Phase 2: Core Mobile Components
Build the four key mobile UI components: BottomNav, MobileTopBar, SceneSlidePanel, and MobileFormatBar. These are self-contained and can be built in parallel.

### Phase 3: Integration
Wire mobile components into the existing SceneWorkspace and App. Add conditional rendering based on breakpoint. Ensure desktop layout is completely untouched when viewport is >= 1024px.

## Step by Step Tasks

### Step 1: Create `useBreakpoint` Hook
- Create `app/client/src/hooks/use-breakpoint.ts`
- Define breakpoints: mobile (<768px), tablet (768-1023px), desktop (>=1024px)
- Use `window.matchMedia` with `addEventListener` for reactive updates
- Return `{ isMobile, isTablet, isDesktop, width }`
- Export from `app/client/src/hooks/index.ts`

### Step 2: Extend UI Store with Mobile State
- Add to `app/client/src/stores/ui-store.ts`:
  - `slidePanelOpen: boolean` (scene slide-over)
  - `quickFormatOpen: boolean` (FAB quick-format overlay)
  - `mobileView: 'script' | 'shots' | 'storyboards' | 'breakdown'` (active bottom nav tab)
  - Actions: `toggleSlidePanel`, `setQuickFormatOpen`, `setMobileView`
- Persist `mobileView` preference

### Step 3: Create Mobile CSS Foundation
- Create `app/client/src/styles/mobile.css`
- Import it in `app/client/src/main.tsx`
- Define mobile-specific classes:
  - `.bottom-nav` — fixed bottom bar, 64px height, flex row
  - `.slide-panel` — absolute positioned, transform translateX, transition
  - `.fab` — fixed bottom-right, 56px, accent bg, shadow
  - `.quick-format` — bottom sheet with 4-column grid
  - `.shot-card` — card layout for mobile shot list
  - `.stats-grid` — 2-column stat cards
  - `.scene-chip` — compact scene jump buttons
- Enforce 44px minimum touch targets on all interactive elements via `@media (max-width: 767px)`
- Set `--bottom-nav-height: 64px` in mobile breakpoint override

### Step 4: Create `BottomNav` Component
- Create `app/client/src/components/workspace/BottomNav.tsx`
- Fixed position at bottom, 4 tabs: Script, Shots, Boards, Breakdown
- Each tab: SVG icon + label, active state with accent color
- Props: `activeView`, `onViewChange`
- Import icons from mockup-mobile.html SVGs (document, image, circle, grid)

### Step 5: Create `MobileTopBar` Component
- Create `app/client/src/components/workspace/MobileTopBar.tsx`
- Layout: hamburger button | script title | view toggle (script/cards)
- Hamburger triggers `toggleSlidePanel` from UI store
- Scene navigation bar below: `← Scene 1 of 12 →`
- Props: `title`, `currentScene`, `totalScenes`, `onPrevScene`, `onNextScene`

### Step 6: Create `SceneSlidePanel` Component
- Create `app/client/src/components/workspace/SceneSlidePanel.tsx`
- Full-screen slide-over from left, triggered by hamburger
- Header: close button, "Scenes" title, "+" add button
- Content: scene list items with INT/EXT icons, active state with accent border
- Footer: script stats in 2-column grid
- Uses `slidePanelOpen` from UI store

### Step 7: Create `MobileFormatBar` Component
- Create `app/client/src/components/workspace/MobileFormatBar.tsx`
- Scrollable horizontal format buttons (Scene, Char, Dial, Act, Paren, More)
- Each button: 44px min-height, accent active state
- FAB button (floating bottom-right above bottom nav) that opens quick-format overlay
- Quick-format overlay: 4-column grid of all format types, color-coded to fountain colors
- Close button on overlay

### Step 8: Refactor `SceneWorkspace.tsx` for Responsive Layout
- Import `useBreakpoint` hook
- When `isMobile`:
  - Render `MobileTopBar` instead of `Header`
  - Render `BottomNav` instead of `ViewModeToggle`
  - Render single-column layout (no grid, sidebars hidden)
  - Render `SceneSlidePanel` as overlay
  - Render `MobileFormatBar` instead of `FormatBar`
  - Main content area gets `padding-bottom: var(--bottom-nav-height)` for bottom nav clearance
- When `isTablet`:
  - Same three-panel grid but with narrower sidebars (200px/180px) — already in tokens.css
- When `isDesktop`:
  - Current layout unchanged
- Use CSS classes instead of inline styles for responsive properties that need media queries

### Step 9: Refactor `App.tsx` for Responsive Project List
- `ProjectListScreen`: Add responsive padding and font sizing
- `ProjectWorkspace`: Use `useBreakpoint` to select layout strategy

### Step 10: Update Barrel Exports
- Add all new components to `app/client/src/components/workspace/index.ts`

### Step 11: Migrate Critical Inline Styles to CSS Classes
- The existing components use React inline styles which cannot be overridden by media queries
- For `SceneWorkspace.tsx`, `Header.tsx`, `LeftSidebar.tsx`, `RightPanel.tsx`, `FormatBar.tsx`:
  - Keep inline styles for desktop
  - Add CSS class names alongside styles
  - In `mobile.css`, override those classes at mobile breakpoint
- Priority: `editorContainerStyles` grid (most impactful), sidebar widths, header height

### Step 12: Validate
- Run all validation commands below

## Testing Strategy

### Unit Tests
- `useBreakpoint` hook: test mobile/tablet/desktop detection, window resize reactivity
- `BottomNav`: renders 4 tabs, fires onViewChange on click
- `MobileTopBar`: renders title, fires hamburger click
- `SceneSlidePanel`: renders scene list, toggles open/closed
- `MobileFormatBar`: renders scrollable buttons, FAB opens quick-format

### Integration Tests
- SceneWorkspace renders mobile layout when viewport < 768px
- SceneWorkspace renders desktop layout when viewport >= 1024px
- Bottom navigation switches between view modes
- Slide panel opens/closes correctly
- Quick format overlay opens/closes correctly

### Edge Cases
- Viewport resize from desktop to mobile mid-session (layout reflows correctly)
- Landscape orientation on mobile (still single-column)
- Very small screens (320px width) — format bar scrollable, no overflow
- Bottom nav + FAB + quick-format z-index stacking
- Focus mode hides bottom nav and FAB on mobile
- Scene list with 50+ scenes still scrolls in slide panel

## Acceptance Criteria
1. On viewport < 768px: three-panel grid hidden, single-column layout shown
2. Mobile bottom nav with 4 tabs (Script/Shots/Boards/Breakdown) replaces desktop nav
3. Mobile top bar shows script title + hamburger (no desktop header)
4. Scene navigator accessible via slide-over panel from hamburger
5. Format bar is horizontally scrollable with 44px touch targets
6. FAB opens quick-format 4-column grid overlay
7. All interactive elements meet 44px minimum touch target
8. Desktop layout (>= 1024px) is completely unchanged
9. Tablet layout (768-1023px) uses narrower sidebars
10. Focus mode hides bottom nav and FAB on mobile
11. No horizontal scroll on any mobile viewport
12. TypeScript compiles with zero errors

## Validation Commands
- `cd app/client && npx tsc --noEmit` — TypeScript compilation with zero errors
- `cd app/client && npm run build` — Production build succeeds
- `cd app/client && npm run test` — All existing tests pass (zero regressions)
- `cd app/client && npm run type-check` — Type checking passes
- Open browser dev tools at 375px width and visually verify: single-column, bottom nav, hamburger, format bar scrolls, FAB present
- Open browser dev tools at 1440px width and visually verify: three-panel grid unchanged from current behavior

## Notes
- The existing components use **inline styles** (React.CSSProperties) which cannot be overridden by CSS media queries. The strategy is to add CSS class names alongside inline styles and use `mobile.css` with `@media (max-width: 767px)` overrides that use `!important` for critical layout properties. Over time, these should be migrated to CSS modules or a styling solution that natively supports responsive design.
- The `mockup-mobile.html` defines 12 screens total. This plan covers the 4 primary screens (Script Editor, Focus Mode, Scene Navigator, Breakdown/Shot List). Secondary screens (Characters, Settings, Notes, Project List) should be addressed in a follow-up.
- The FAB quick-format grid is a mobile-only pattern — it does not exist in the desktop mockup.
- `useBreakpoint` should debounce resize events to avoid excessive re-renders.
- Consider using `ResizeObserver` on `#root` instead of `window` for more accurate container-based breakpoints if the app is ever embedded.
