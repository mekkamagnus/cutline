# Bug: Duplicate Navigation Bars

## Bug Description
The application displays two navigation bars instead of one. The expected behavior (per mockup.html) is a single header navigation with tabs for Script, Shots, Storyboards, and Breakdown. Currently, there's a duplicate set of view toggle buttons rendered inside the main content area below the header.

**Expected**: One nav bar in the header (matching mockup.html)
**Actual**: Two nav bars - one in Header component, another in main content area

## Problem Statement
The `ProjectWorkspace` component in App.tsx renders both:
1. `Header` component with navigation tabs (correct)
2. An inline view toggle section inside `mainContentStyles` div (duplicate, incorrect)

## Solution Statement
Remove the duplicate view toggle section (lines 141-165) from the `ProjectWorkspace` component. The `Header` component already provides the navigation functionality.

## Steps to Reproduce
1. Start the development server (`npm run dev` in app/client)
2. Navigate to `http://localhost:5173`
3. Click "Open Demo Project"
4. Observe two navigation bars:
   - Top: Header with "Cutline" logo + nav tabs + Export button
   - Below: Duplicate "Script | Shots | Storyboards" buttons

## Root Cause Analysis
The view toggle buttons inside `mainContentStyles` (lines 141-165 of App.tsx) were added as a redundant navigation mechanism. The `Header` component already handles view mode switching via `onViewModeChange` callback and NavLink routing.

**Why this happened**: Likely added during development as a placeholder or test code that was never removed.

## Relevant Files
Use these files to fix the bug:

- `app/client/src/App.tsx` - Contains the duplicate view toggle code that needs to be removed (lines 141-165 in `ProjectWorkspace` component)
- `app/client/src/components/workspace/Header.tsx` - The correct navigation component (no changes needed)

### New Files
None required.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Remove Duplicate View Toggle Section
- In `app/client/src/App.tsx`, locate the `ProjectWorkspace` component
- Find the view toggle section inside `mainContentStyles` div (approximately lines 141-165):
  ```tsx
  {/* View Mode Toggle */}
  <div style={viewToggleStyles}>
    <button ...>Script</button>
    <button ...>Shots</button>
    <button ...>Storyboards</button>
  </div>
  ```
- Delete this entire view toggle section

### 2. Remove Unused Styles
- Remove `viewToggleStyles` constant (no longer used)
- Remove `viewButtonStyles` constant (no longer used)
- Remove `viewButtonActiveStyles` constant (no longer used)

### 3. Remove Unused State Handler
- The `handleViewModeChange` function is still used by Header, so keep it

### 4. Verify No Other Duplicates
- Confirm `Header` component is the only navigation element
- Verify the layout matches mockup.html structure

### 5. Visual Validation
- Start the dev server
- Navigate to demo project
- Confirm only one nav bar appears (in header)

## Validation Commands
Execute every command to validate the bug is fixed with zero regressions.

- `cd app/client && npm run type-check` - TypeScript compilation must pass with no errors
- `cd app/client && npm run test` - Run frontend tests (if any)
- Visual inspection: Start dev server and confirm single nav bar in header

## Notes
- This is a simple UI cleanup - no backend changes required
- The Header component already handles navigation via React Router's NavLink
- The viewMode state is still useful for future conditional rendering based on active view
