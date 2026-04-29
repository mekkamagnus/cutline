# Bug: UI Bugs - Empty Scenes, Dead Navbar Links, Script Text Overflow

## Bug Description
Three UI bugs visible on the demo project workspace:

1. **Scenes not listing**: The left sidebar "Scenes" panel shows "No scenes yet" even though script content contains scenes (INT. COFFEE SHOP - DAY).
2. **Navbar links do nothing**: Clicking Script/Shots/Storyboards/Breakdown tabs in the top header does nothing — the view doesn't change.
3. **Script text overflows**: When scrolling the script editor, text falls outside the gray container boundary.

## Problem Statement

### Bug 1: Empty Scenes Panel
`LeftSidebar` calls `useScenes(projectId)` but `useScenes` expects a `scriptId` and queries `SceneRepository.findByScriptId()` against IndexedDB. The demo passes `"demo-project"` as projectId, which is treated as a scriptId. No scenes exist in IndexedDB under that key, so the list is empty. The fountain parser already parses scenes from the inline content, but that data is never passed to the sidebar.

### Bug 2: Dead Navbar Links
`Header` renders `<NavLink>` components with paths like `/project/${projectId}/script`. The router only defines `/project/:projectId/*` pointing to `ProjectWorkspace`, which manages view mode via local `useState` initialized to `'script'`. Clicking a NavLink navigates the URL but `ProjectWorkspace` doesn't read the URL to determine view mode — it remounts with the default state. The `onViewModeChange` callback fires but the navigation causes a re-render that resets state.

### Bug 3: Script Text Overflow
`ScriptEditor`'s outermost div (`editorContainerStyles`) sets `height: '100%'` and `overflowY: 'auto'`, creating a nested scroll container inside the parent `editorAreaStyles` (which also has `overflow: 'auto'`). The `scriptPageStyles` child has `minHeight: 1100px` with no overflow containment. This double-scroll setup causes the gray page container to scroll within the parent while its text content overflows the scriptPage boundary.

## Solution Statement

### Bug 1: Add scenes prop override to LeftSidebar
- Add an optional `scenes` prop to `LeftSidebar` that bypasses the `useScenes` hook when provided
- In `App.tsx`, parse the demo script content using the existing `fountainParser` to extract `ParsedScene[]`
- Map `ParsedScene[]` to `Scene[]` (the DB type the sidebar expects) and pass it down

### Bug 2: Replace NavLinks with buttons in Header
- Replace `<NavLink>` elements with `<button>` elements styled identically
- Use the `viewMode` prop to determine active state styling
- Keep the `onViewModeChange` callback — now it actually works since there's no navigation interference

### Bug 3: Fix scroll containment in ScriptEditor
- Remove `height: '100%'` and `overflowY: 'auto'` from `ScriptEditor`'s `editorContainerStyles`
- Let the parent `editorAreaStyles` (in App.tsx) be the sole scroll container
- The ScriptEditor content flows naturally, preventing the double-scroll that causes overflow

## Steps to Reproduce
1. Start the app (`cd app/client && npm run dev`)
2. Click "Open Demo Project"
3. Observe: Left sidebar shows "No scenes yet" (Bug 1)
4. Click "Shots" tab in the top nav bar (Bug 2 — nothing happens)
5. Scroll down in the script editor (Bug 3 — text overflows the gray container)

## Root Cause Analysis

**Bug 1**: Semantic mismatch between `projectId` and `scriptId`. `LeftSidebar` is designed for DB-backed scenes but the demo uses inline content. The fountain parser already extracts scenes from content but they're never surfaced to the sidebar.

**Bug 2**: `NavLink` causes URL navigation which triggers component remount, resetting the local `viewMode` state. The `onViewModeChange` callback fires before navigation, so the state change is lost on remount.

**Bug 3**: Two nested elements both set `overflow: auto` with constrained heights. The inner container (`ScriptEditor`) constrains to `100%` height but contains a `minHeight: 1100px` child. This creates a scroll context inside another scroll context, and the inner content overflows its visual bounds.

## Relevant Files

### Files to modify:
- `app/client/src/App.tsx` — Parse script content and pass scenes to LeftSidebar
- `app/client/src/components/workspace/LeftSidebar.tsx` — Add `scenes` prop override
- `app/client/src/components/workspace/Header.tsx` — Replace NavLink with buttons
- `app/client/src/components/script/ScriptEditor.tsx` — Fix overflow styles

## Step by Step Tasks

### Fix Bug 1: Scenes not listing

- In `LeftSidebar.tsx`, add an optional `scenes` prop of type `Scene[]` to the interface. When provided, use it instead of calling `useScenes()`:
  ```
  interface LeftSidebarProps {
    ...
    scenes?: Scene[];  // When provided, bypasses useScenes hook
  }
  ```
  In the component body, use: `const { data: fetchedScenes = [], isLoading } = useScenes(projectId);` and `const scenes = props.scenes ?? fetchedScenes;`

- In `App.tsx`, import `fountainParser` and `Result` from fp lib. Parse the `content` state to extract `ParsedScene[]`. Map to `Scene[]` with synthetic IDs and pass to `<LeftSidebar scenes={parsedScenes} />`.

### Fix Bug 2: Dead navbar links

- In `Header.tsx`, replace each `<NavLink>` with a `<button>` element. Remove the `to` prop and `NavLink` import. Style the active button using the existing `viewMode` prop comparison. Keep the `onClick` calling `onViewModeChange`.

### Fix Bug 3: Script text overflow

- In `ScriptEditor.tsx`, remove `height: '100%'` and `overflowY: 'auto'` from `editorContainerStyles`. This lets the content flow naturally within the parent scroll container in App.tsx.

## Validation Commands
- `cd app/client && npx tsc --noEmit` — Type check passes with zero errors
- `cd app/client && npm run build` — Build succeeds
- Visual verification: start the app, verify scenes list in sidebar, navbar tab switching works, script text stays within gray container on scroll

## Notes
- The demo uses hardcoded content in `App.tsx` state. The fountain parser is already imported and functional.
- `ParsedScene` and `Scene` have slightly different shapes — `ParsedScene` has `elements` and `characterAppearances`, while `Scene` has `scriptId` and timestamps. The mapping needs to bridge these.
- The `NavLink` → `button` change in Header means URL won't reflect the active view. This is acceptable for the MVP since view switching is state-based. Route-based view switching can be added later.
