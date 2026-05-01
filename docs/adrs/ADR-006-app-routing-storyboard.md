# ADR 006: App Routing and Storyboard Route

## Status

Accepted

## Date

2026-05-02

## Context

The app used a single `ProjectWorkspace` component with an internal `viewMode` state (`'script' | 'shots' | 'storyboards' | 'breakdown'`) managed via URL hash/query params. Tab navigation updated the URL, and `deriveViewMode()` read it back to determine which view to render.

The storyboards view needed a route that:
1. Renders `StoryboardScreen` with the current scene's ID
2. Works for both desktop (sidebar layout) and mobile (stacked layout)
3. Shares the same URL pattern as other tabs (`/project/:projectId/storyboards`)

The `LeftSidebar` scene selector also needed to pass the selected scene ID down to the storyboard view.

## Decision

### Route structure

- `/project/:projectId/script` — Script editor (default)
- `/project/:projectId/shots` — Shot list editor
- `/project/:projectId/storyboards` — Storyboard screen
- `/project/:projectId/breakdown` — Breakdown view (placeholder)

All routes render within `ProjectWorkspace`, which derives the active view from `useLocation().pathname`.

### StoryboardScreen wiring

- `App.tsx` renders `<StoryboardScreen sceneId={currentSceneId} />` when the storyboards tab is active
- `StoryboardScreen` manages its own data fetching internally (shots, confirmation status, storyboards)
- No need for App to pass `shots`, `confirmationStatus`, or `initialShots` — StoryboardScreen calls the hooks directly

### LeftSidebar update

- Pass `onSceneSelect` callback that updates the current scene ID in App state
- StoryboardScreen receives the selected scene ID and fetches data accordingly

## Consequences

### Positive

- Each tab has a bookmarkable URL — users can link directly to the storyboards view
- `StoryboardScreen` is self-contained — App.tsx doesn't need to orchestrate its data
- Consistent routing pattern across all four tabs

### Negative

- `ProjectWorkspace` still derives view mode from URL path parsing in `App.tsx` rather than using React Router's nested routes. A proper nested route setup (`<Route path="storyboards" element={...}/>`) would be cleaner but requires more refactoring.
- Scene selection state lives in App component, not in the URL. Deep-linking to a specific scene's storyboards isn't possible yet.

## Files Changed

| File | Change |
|------|--------|
| `App.tsx` | Add storyboard route case, wire StoryboardScreen with sceneId |
| `main.tsx` | Import storyboard.css (moved from ADR-004 commit) |
| `components/workspace/LeftSidebar.tsx` | Minor navigation refinements |
| `docs/prd.md` | Update phase 1 scope |

## References

- ADR-004: Storyboard screen implementation
- Earlier nav fix: `3396d95 fix(nav): make navbar tabs URL-driven for proper view switching`
