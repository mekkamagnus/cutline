# Feature: UI Bug Fixes + Auto Shot Generation

## Feature Description
Fix three critical UI bugs that make the workspace unusable, and add automatic shot list generation from parsed Fountain script content. The auto-generated shot list serves as a starting point — the creator can then freely update, add, or delete shots before confirming.

## User Story
As a filmmaker using the demo project
I want to see my script's scenes listed in the sidebar, switch between views via the navbar, and have an auto-generated shot list waiting for me on the Shots screen
So that I can immediately start refining shot decisions instead of building from scratch

## Problem Statement
Three bugs block all workspace functionality:
1. **Scenes sidebar is empty** — `LeftSidebar` passes `projectId` to `useScenes()` which expects a `scriptId`. No scenes exist in IndexedDB for the demo.
2. **Navbar tabs do nothing** — `Header` uses `<NavLink>` for tab switching. Clicking navigates the URL but `ProjectWorkspace` remounts with `viewMode` reset to `'script'`, so the view never changes.
3. **Script text overflows** — `ScriptEditor` creates a nested scroll container (`height: 100%` + `overflowY: auto`) inside the parent's scroll container. Content spills outside the gray page container.

Additionally, the Shots screen has no auto-generation — it shows "No shots yet" even when a script with parseable scenes exists.

## Solution Statement

### Bug Fixes
1. **Scenes**: Add a `scenes` prop override to `LeftSidebar`. In `App.tsx`, parse the demo script content with `fountainParser` and pass extracted `ParsedScene[]` (mapped to `Scene[]`) directly to the sidebar, bypassing the empty IndexedDB.
2. **Navbar**: Replace `<NavLink>` with `<button>` elements in `Header`. View switching is state-based, so navigation links are inappropriate. The active tab is styled via the `viewMode` prop.
3. **Overflow**: Remove `height: '100%'` and `overflowY: 'auto'` from `ScriptEditor`'s `editorContainerStyles`. Let the parent `editorAreaStyles` in `App.tsx` be the sole scroll container.

### Auto Shot Generation
Add a `generateShotsFromScene()` function that takes a `ParsedScene` and produces `Shot[]` suggestions based on scene elements:
- Opening action → establishing/wide shot
- Character introductions → medium or two-shot
- Dialogue blocks → over-the-shoulder or close-up per character
- Transitions → implicit cuts between shots
- Closing action → wide or medium to end the scene

The generated shots are passed to `ShotListEditor` via an `initialShots` prop, used only when the DB query returns empty. The creator can then edit, add, or delete before confirming.

## Relevant Files

### Files to modify:
- `app/client/src/App.tsx` — Parse script content, generate scenes & shots, pass to child components. Fix view mode state management.
- `app/client/src/components/workspace/LeftSidebar.tsx` — Add `scenes` prop override to bypass `useScenes` hook when data is provided
- `app/client/src/components/workspace/Header.tsx` — Replace `<NavLink>` with `<button>` elements
- `app/client/src/components/script/ScriptEditor.tsx` — Remove double scroll container styles
- `app/client/src/components/shot-list/ShotListEditor.tsx` — Add `initialShots` prop for auto-generated shots

### New Files:
- `app/client/src/services/shot-generator.ts` — Pure function that converts `ParsedScene` elements into `Shot[]` suggestions

## Implementation Plan

### Phase 1: Bug Fixes (Foundation)
Fix the three blocking UI bugs so the workspace is navigable and functional.

### Phase 2: Shot Generator (Core)
Build the shot generation logic as a pure, testable function. It reads `ParsedScene.elements` and produces sensible `Shot[]` defaults based on element types and content.

### Phase 3: Integration (Wiring)
Wire the shot generator into `App.tsx`. Pass auto-generated shots to `ShotListEditor` as initial data. Ensure the full flow works: script → parse → generate shots → display → edit → confirm.

## Step by Step Tasks

### Fix Bug 1: Scenes sidebar empty

- In `LeftSidebar.tsx`, add an optional `scenes?: Scene[]` prop to `LeftSidebarProps`. When provided, skip the `useScenes` hook and use the prop directly:
  ```
  const { data: fetchedScenes = [], isLoading } = useScenes(projectId);
  const scenes = props.scenes ?? fetchedScenes;
  ```
  When `props.scenes` is provided, set `isLoading = false`.

- In `App.tsx`, import `fountainParser` and `Result` from `@/lib/fp`. Parse `content` state in a `useMemo`:
  ```
  const parsedScript = useMemo(() => {
    const result = fountainParser.parse(content);
    return Result.isOk(result) ? result.right : null;
  }, [content]);
  ```

- Map `ParsedScene[]` to `Scene[]` for the sidebar:
  ```
  const sidebarScenes = useMemo(() =>
    parsedScript?.scenes.map((s, i) => ({
      id: s.id,
      scriptId: 'demo-script',
      heading: s.heading,
      location: s.location,
      interior: s.interior,
      timeOfDay: s.timeOfDay,
      order: s.order,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) ?? [], [parsedScript]);
  ```

- Pass to `LeftSidebar`: `<LeftSidebar projectId={projectId} scenes={sidebarScenes} ... />`

### Fix Bug 2: Navbar links do nothing

- In `Header.tsx`, remove `NavLink` import from react-router-dom (keep `useParams` if still needed). Replace each `<NavLink>` with a `<button type="button">`:
  ```
  {navTabs.map((tab) => (
    <button
      key={tab.id}
      type="button"
      style={{
        ...navTabStyles,
        ...(viewMode === tab.id ? activeTabStyles : {}),
      }}
      onClick={() => onViewModeChange?.(tab.id)}
    >
      {tab.label}
    </button>
  ))}
  ```

- Remove the `path` property from `navTabs` array since navigation is no longer URL-based.

### Fix Bug 3: Script text overflow

- In `ScriptEditor.tsx`, modify `editorContainerStyles`:
  ```
  const editorContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    // REMOVED: height: '100%' — parent handles scroll containment
    // REMOVED: overflowY: 'auto' — parent is the scroll container
    padding: 'var(--space-6)',
    background: 'var(--bg-primary)',
  };
  ```

### Create shot generator service

- Create `app/client/src/services/shot-generator.ts` with a pure function:
  ```
  export function generateShotsFromScene(scene: ParsedScene): Shot[]
  ```

- Generation rules (element-type to shot mapping):
  - **Scene heading** → `establishing` shot, `eye-level`, `static`, 3s, description = scene heading text
  - **Action elements** (first in scene) → `wide` or `medium`, `eye-level`, `static`, duration based on word count (1 word ≈ 0.5s, min 3s, max 10s)
  - **Character + Dialogue pairs** → `over-the-shoulder` or `close-up` (alternate), `eye-level`, `static`, duration from dialogue word count
  - **Parentheticals** → merge into parent dialogue shot's action description
  - **Transitions** → no separate shot (implied cut between adjacent shots)
  - **Multiple characters in one block** → `two-shot`

- Each generated shot gets:
  - Synthetic ID: `shot-${scene.id}-${index}`
  - `sceneId`: scene.id
  - `shotNumber`: sequential
  - `confirmed: false`
  - `createdAt`/`updatedAt`: new Date()

### Integrate auto-shot generation

- In `App.tsx`, generate shots from the first parsed scene:
  ```
  const generatedShots = useMemo(() => {
    if (!parsedScript?.scenes.length) return [];
    const scene = parsedScript.scenes[0];
    return generateShotsFromScene(scene);
  }, [parsedScript]);
  ```

- Add `initialShots` prop to `ShotListEditor`:
  ```
  interface ShotListEditorProps {
    sceneId: string;
    onShotSelect?: (shot: Shot) => void;
    selectedShotId?: string;
    initialShots?: Shot[];  // Auto-generated shots for demo
  }
  ```

- In `ShotListEditor`, when DB returns empty and `initialShots` is provided, use those instead of showing "No shots yet":
  ```
  const displayShots = shots.length > 0 ? shots : (initialShots ?? []);
  ```

- In `App.tsx`, pass to `ShotListEditor`:
  ```
  <ShotListEditor
    sceneId="demo-scene"
    selectedShotId={selectedShotId ?? undefined}
    onShotSelect={(shot) => setSelectedShotId(shot.id)}
    initialShots={viewMode === 'shots' ? generatedShots : undefined}
  />
  ```

### Add shot generator tests

- Create `app/client/src/services/__tests__/shot-generator.test.ts`
- Test cases:
  - Empty scene → empty shots
  - Scene with only action → one wide shot
  - Scene with heading + action + dialogue → establishing + wide + close-up
  - Dialogue with parenthetical → parenthetical text merged into shot description
  - Multiple character dialogues → alternating over-the-shoulder shots
  - Two characters in same block → two-shot

### Validate all changes

- Run type check: `cd app/client && npx tsc --noEmit`
- Run build: `cd app/client && npm run build`
- Run tests: `cd app/client && npm run test`
- Visual: start app, verify scenes list, navbar switching, overflow, and auto-generated shots

## Testing Strategy

### Unit Tests
- `shot-generator.test.ts` — All generation rules (heading, action, dialogue, multi-character, empty)
- Existing test suite passes with no regressions

### Integration Tests
- Manual browser test: open demo project → scenes appear → click Shots tab → auto-generated shots displayed → add/edit/delete shots works

### Edge Cases
- Script with no scene headings → parser wraps all content as action → generator still produces sensible shots
- Script with only dialogue (no action) → shots generated from dialogue blocks
- Very long dialogue block → duration capped at 10s
- Empty script → empty shot list, no errors

## Acceptance Criteria
1. Left sidebar lists scenes parsed from the demo script content (INT. COFFEE SHOP - DAY visible)
2. Clicking "Shots" tab in the navbar switches the view to the shot list
3. Clicking "Script", "Storyboards", "Breakdown" tabs all switch views correctly
4. Script text stays within the gray container boundary when scrolling
5. Shots screen shows auto-generated shots based on script content (not empty)
6. Auto-generated shots can be edited via the edit button
7. New shots can be added via "+ Add Shot" button
8. Shots can be deleted via the delete button
9. Shot list confirmation workflow still works (confirm → lock editing → unlock)
10. Type check passes with zero errors
11. Build succeeds with zero errors

## Validation Commands
- `cd app/client && npx tsc --noEmit` — Type check passes
- `cd app/client && npm run build` — Build succeeds
- `cd app/client && npm run test` — All tests pass including new shot-generator tests
- `cd app/server && bun test` — Server tests pass (unchanged)

## Notes
- The auto-shot generation is client-side only (no AI). It uses deterministic rules based on element types. This is intentional for the MVP — AI-powered suggestions are a future enhancement.
- The `initialShots` prop approach avoids needing to seed IndexedDB. When the user edits/adds shots, those mutations go through the normal DB hooks, so the flow transitions naturally from "suggested" to "user-owned".
- The bug fixes in Phase 1 are independent of each other and can be implemented in parallel.
- The existing bug plan at `specs/bug-ui-scenes-nav-overflow.md` has additional root cause analysis detail.
