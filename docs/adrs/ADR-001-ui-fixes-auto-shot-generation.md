# ADR 001: UI Bug Fixes and Auto Shot Generation

## Status

Accepted

## Date

2026-05-01

## Context

The demo project workspace had three blocking UI bugs and a missing core feature:

1. **Empty scenes sidebar** — `LeftSidebar` passes `projectId` to `useScenes()` which expects a `scriptId` for an IndexedDB query. The demo has no seeded data, so the sidebar always shows "No scenes yet."

2. **Dead navbar tabs** — `Header` used `<NavLink>` for view switching, causing URL navigation that remounts `ProjectWorkspace` with `viewMode` reset to `'script'`.

3. **Script text overflow** — `ScriptEditor` created a nested scroll container (`height: 100%` + `overflowY: auto`) inside the parent's scroll container, causing content to spill outside the gray page container.

4. **Empty shots screen** — The Shots view showed "No shots yet" with no auto-generated starting point. The fountain parser already extracts structured scene data but nothing converted it into shot suggestions.

Spec: `specs/feature-ui-fixes-auto-shots.md`

## Decision

### Bug fixes

- **Scenes**: Add a `scenes?: Scene[]` prop override to `LeftSidebar`. When provided, bypass the `useScenes` hook and skip loading state. In `App.tsx`, parse script content with `fountainParser` and map `ParsedScene[]` to `Scene[]` for the sidebar.

- **Navbar**: Replace `<NavLink>` with `<button>` elements in `Header`. View switching is managed via URL-based state (`useLocation` + `useNavigate`) rather than local `useState`. The `onNavigate` callback calls `navigate()` to update the URL, and `deriveViewMode()` reads the URL to determine the active view.

- **Overflow**: Remove `height: '100%'` and `overflowY: 'auto'` from `ScriptEditor`'s `editorContainerStyles`. The parent `editorAreaStyles` in `App.tsx` is the sole scroll container.

### Auto shot generation

- Create a pure `generateShotsFromScene(scene: ParsedScene): Shot[]` function in `services/shot-generator.ts` with no side effects or DB access.

- Generation rules are deterministic and element-type-based:
  - First action at scene start → establishing shot (3s) + wide shot for grouped actions
  - Subsequent action groups → wide or two-shot (if 2+ characters)
  - Character + dialogue + parenthetical blocks → alternating over-the-shoulder / close-up
  - Transitions → skipped (implicit cuts)
  - Duration calculated from word count, capped at 2–10 seconds

- `ShotListEditor` receives an `initialShots` prop and uses it as fallback when the DB query returns empty (`displayShots = shots.length > 0 ? shots : (initialShots ?? [])`).

- All rendering, confirmation, reordering, and summary logic in `ShotListEditor` uses `displayShots` instead of raw `shots`.

## Consequences

### Positive
- Demo workspace is immediately functional: scenes display, navigation works, overflow fixed, shots auto-generated
- Shot generation is pure and testable — 9 unit tests cover all rules
- `initialShots` approach avoids needing to seed IndexedDB; mutations flow through normal hooks once users start editing
- URL-based view switching enables deep linking and back/forward navigation

### Negative
- `generateShotsFromScene` uses heuristic rules, not AI — suggestions are basic (wide/OTS/close-up patterns). AI-powered suggestions are deferred to a future enhancement.
- `initialShots` are synthetic (no DB persistence). If a user navigates away and returns, the DB still returns empty and synthetic shots regenerate. Edits are lost until persisted via the mutation hooks.
- The `scenes` prop override in `LeftSidebar` means two data paths (prop vs hook). This is acceptable for the demo but should converge when real DB seeding is implemented.

## Files Changed

| File | Change |
|------|--------|
| `services/shot-generator.ts` | New — pure shot generation function |
| `services/__tests__/shot-generator.test.ts` | New — 9 unit tests |
| `App.tsx` | Parse script, generate shots, pass `initialShots` and `scenes` props |
| `components/shot-list/ShotListEditor.tsx` | Add `initialShots` prop, derive `displayShots` |
| `components/workspace/LeftSidebar.tsx` | Fix `isLoading` when `scenes` prop provided |
| `components/workspace/Header.tsx` | NavLink → button (done externally) |
| `components/script/ScriptEditor.tsx` | Remove double scroll (done externally) |

## References

- Feature spec: `specs/feature-ui-fixes-auto-shots.md`
- Bug analysis: `specs/bug-ui-scenes-nav-overflow.md`
- Fountain parser: `app/client/src/services/fountain-parser.ts`
- Shot types: `app/client/src/types/index.ts`
