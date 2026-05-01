# Feature: Storyboard Screen

## Feature Description
Wire up the existing Storyboards tab (currently a shell rendering empty arrays) into a fully functional storyboard screen. The screen reads shots from the current scene's shot list, displays placeholder panels for each shot, and provides a generate/view/refine workflow. It enforces the shot-list-first paradigm: storyboards can only be generated after the shot list is confirmed.

## User Story
As a filmmaker
I want to view and generate storyboard panels for each shot in my confirmed shot list
So that I can see visual representations of my planned shots and refine them iteratively

## Problem Statement
The "Storyboards" tab exists in navigation but renders `<StoryboardStrip>` with empty `storyboards={[]}` and `shots={[]}` props. None of the existing storyboard components (`StoryboardStrip`, `StoryboardPanel`, `StoryboardGenerator`, `RefinementPanel`) are connected to real data. Users cannot view, generate, or refine storyboard panels.

## Solution Statement
Create a `StoryboardScreen` component that orchestrates the existing storyboard components, connects them to the current scene's shots via the `useShots` hook, and wires the `StoryboardGenerator` and `RefinementPanel` into the generation flow. The screen will pass shots and storyboards to `StoryboardStrip`, show the `StoryboardGenerator` when the shot list is confirmed but panels are not yet generated, and open the `RefinementPanel` when a user selects an existing panel for refinement. Update `App.tsx` to pass real data to the storyboard view for both desktop and mobile layouts.

## Relevant Files
Use these files to implement the feature:

### Existing Files to Modify
- `app/client/src/App.tsx` — Replace the empty `<StoryboardStrip storyboards={[]} shots={[]} .../>` calls in both desktop and mobile layouts with the new `<StoryboardScreen>` component, passing `sceneId`, `shots` (from `generatedShots`), and `confirmationStatus`
- `app/client/src/main.tsx` — Import the new storyboard CSS file
- `app/client/src/components/storyboard/index.ts` — Export the new `StoryboardScreen` component

### New Files
- `app/client/src/components/storyboard/StoryboardScreen.tsx` — Main orchestrator component that composes `StoryboardStrip`, `StoryboardGenerator`, and `RefinementPanel` together with real data
- `app/client/src/styles/storyboard.css` — Styles for the storyboard screen layout, generation panel, and refinement sidebar

## Implementation Plan
### Phase 1: Foundation
Create the `StoryboardScreen` component shell that accepts props, manages panel selection state, and renders the `StoryboardStrip` with real shot data.

### Phase 2: Core Implementation
Add the generation workflow: show `StoryboardGenerator` when shots are confirmed but panels are missing, wire up `useGenerateStoryboards` to create panels, and fetch generated storyboards from IndexedDB via `useStoryboardForShot`.

### Phase 3: Integration
Add the `RefinementPanel` flow: when a user clicks a generated panel, show the refinement sidebar. Wire up the `useAddStoryboardVersion` hook for regeneration. Update `App.tsx` to replace the empty storyboard view with `StoryboardScreen` on both desktop and mobile.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Create StoryboardScreen Component
- Create `app/client/src/components/storyboard/StoryboardScreen.tsx`
- Accept props: `sceneId: string`, `shots: Shot[]`, `confirmationStatus: { isConfirmed: boolean; confirmedAt?: Date }`
- Manage state: `selectedPanelId`, `selectedStoryboard`, `isRefining`, `generatedStoryboards` (Map<shotId, StoryboardPanel>)
- On mount and when shots change, fetch existing storyboards for each shot using `useStoryboardForShot`
- Render `StoryboardStrip` with `shots` and fetched `storyboards`
- Show empty state message when no shots exist ("Go to the Shots tab to create your shot list first")
- Show paradigm gate warning when shots exist but are not confirmed ("Confirm your shot list before generating storyboards")

### Step 2: Add StoryboardGenerator Integration
- Inside `StoryboardScreen`, when `confirmationStatus.isConfirmed` is true, render `StoryboardGenerator` below the strip
- On generation complete, refresh the storyboards map by re-fetching from IndexedDB
- Track generation status (progress bar) from `StoryboardGenerator`'s internal state
- After generation, hide the generator and show only the strip with populated panels
- Calculate and display summary stats: X/Y panels generated, total cost

### Step 3: Add RefinementPanel Integration
- When a user clicks a panel in `StoryboardStrip`, set `selectedStoryboard` state
- Render `RefinementPanel` as a sidebar overlay (right side on desktop, bottom sheet on mobile) when a panel is selected
- Wire `RefinementPanel`'s `onRefined` callback to update the storyboards map and close the panel
- Wire `RefinementPanel`'s `onClose` to clear selection state
- Support keyboard: Escape key closes refinement panel

### Step 4: Create Storyboard CSS
- Create `app/client/src/styles/storyboard.css`
- Style `.storyboard-screen` as a flex column layout filling available space
- Style `.storyboard-screen__strip-section` for the filmstrip area
- Style `.storyboard-screen__generator-section` for the generator controls area (collapsible)
- Style `.storyboard-screen__refinement-section` for the refinement panel overlay
- Style `.storyboard-screen__empty-state` for empty/placeholder messages
- Style `.storyboard-screen__paradigm-warning` for the confirmation gate warning
- Use existing design tokens from `tokens.css` (same pattern as `shot-list.css`)
- Add mobile-responsive adjustments at 768px breakpoint
- Add loading skeleton animation for panels being generated

### Step 5: Update Storyboard Barrel Export
- Add `export { StoryboardScreen } from './StoryboardScreen'` to `app/client/src/components/storyboard/index.ts`

### Step 6: Update App.tsx
- Import `StoryboardScreen` from `@/components/storyboard`
- Replace the desktop `case 'storyboards':` block with `<StoryboardScreen sceneId={currentSceneId ?? 'demo-scene'} shots={generatedShots} confirmationStatus={confirmationStatus} />`
- Derive `confirmationStatus` from the existing `useShotListConfirmationStatus` hook (already imported via `useShots`)
- Replace the mobile `viewMode === 'storyboards'` block similarly
- Remove the direct `StoryboardStrip` import if no longer used directly

### Step 7: Update main.tsx
- Add `import './styles/storyboard.css'` after the existing CSS imports

### Step 8: Run Validation Commands
- Run all validation commands listed below to confirm zero regressions

## Testing Strategy
### Unit Tests
- `StoryboardScreen` renders empty state when no shots provided
- `StoryboardScreen` renders paradigm warning when shots are unconfirmed
- `StoryboardScreen` renders `StoryboardGenerator` when shots are confirmed but no storyboards exist
- `StoryboardScreen` renders `StoryboardStrip` with fetched storyboards
- `StoryboardScreen` opens `RefinementPanel` on panel click
- `StoryboardScreen` closes `RefinementPanel` on Escape key

### Integration Tests
- End-to-end: confirmed shots → generate storyboards → panels appear in strip
- End-to-end: click panel → refinement panel opens → refine → panel updates
- Navigation: switch between Shots and Storyboards tabs preserves state

### Edge Cases
- No scenes selected (sceneId is null)
- Empty shot list
- All shots confirmed, some storyboards generated, some not
- Storyboard generation fails mid-batch (partial results)
- Offline mode: placeholder generation fallback
- Mobile layout: refinement panel as bottom sheet

## Acceptance Criteria
1. Storyboards tab shows real shot data from the current scene's shot list
2. Placeholder panels appear for each shot that doesn't have a generated storyboard
3. Paradigm gate: "Confirm your shot list" warning shown when shots are unconfirmed; generator is disabled
4. `StoryboardGenerator` appears when shots are confirmed, with style selector and generate button
5. Clicking "Generate Storyboards" creates panels for all confirmed shots
6. Generated panels display in the horizontal filmstrip with shot numbers and metadata
7. Clicking a generated panel opens `RefinementPanel` for that panel
8. Refinement creates a new version of the storyboard panel
9. Summary stats show X/Y panels generated and total cost
10. Works on both desktop (3-panel layout) and mobile (single column with bottom nav)
11. Existing Script, Shots, and Breakdown tabs continue to work with zero regressions
12. No TypeScript errors; `npm run type-check` passes
13. No test failures; `npm run test` passes

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- `cd app/client && npm run type-check` - TypeScript type checking must pass with zero errors
- `cd app/client && npm run test` - All existing and new tests must pass
- `cd app/client && npm run build` - Production build must succeed with zero errors
- `cd app/server && bun run dev &` then `curl -s http://localhost:3001/api/health` - Backend starts and responds (manual check)
- Visual check: Navigate to Storyboards tab on desktop and mobile layouts - panels, generator, and refinement should render correctly

## Notes
- The existing `StoryboardStrip`, `StoryboardPanel`, `StoryboardGenerator`, and `RefinementPanel` components are fully built and just need orchestration. This feature is primarily a wiring/integration task, not a greenfield build.
- The `useGenerateStoryboards` hook already handles online/offline modes and progress tracking.
- The `useStoryboardForShot` hook already fetches from IndexedDB via the repository pattern.
- The shot-list-first paradigm is enforced by `StoryboardGenerator` internally (it checks `isConfirmed`), but `StoryboardScreen` adds a UX-level gate (warning message + disabled state) for clarity.
- No new npm packages are required.
- The `RefinementPanel` uses the API client for real AI generation; offline fallback is not implemented for refinement (only initial generation has offline placeholder support).
- The server-side storyboard routes (`app/server/src/routes/storyboards.ts`) are already implemented with paradigm gates, version history, and cost tracking. No server changes are needed.
