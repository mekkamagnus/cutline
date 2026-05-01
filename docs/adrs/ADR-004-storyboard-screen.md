# ADR 004: Storyboard Screen Implementation

## Status

Accepted

## Date

2026-05-02

## Context

The Storyboards tab existed in navigation but rendered an empty `<StoryboardStrip>` with `storyboards={[]}` and `shots={[]}`. The existing storyboard components (`StoryboardStrip`, `StoryboardPanel`, `StoryboardGenerator`, `RefinementPanel`) were fully built but not connected to real data. Users could not view, generate, or refine storyboard panels.

The app enforces a shot-list-first paradigm: storyboards can only be generated after the shot list is confirmed.

Spec: `specs/feature-storyboard-screen.md`

## Decision

### Create StoryboardScreen orchestrator

A new `StoryboardScreen` component that:

1. Fetches shots for the current scene via `useShots(sceneId)`
2. Checks confirmation status via `useShotListConfirmationStatus(sceneId)`
3. Fetches existing storyboards for those shots
4. Renders the appropriate view based on state:
   - No shots → empty state with link to Shots tab
   - Shots not confirmed → paradigm gate warning
   - Shots confirmed, panels missing → card grid with placeholders + generator
   - All panels generated → card grid only

### Batch storyboard query

The initial implementation called `useStoryboardForShot(shotId)` inside a `.map()` loop over `displayShots`. This violated React's Rules of Hooks — when the shot count changed between renders, the number of hook calls changed, causing 9 console errors and a blank screen.

**Fix**: Created `useStoryboardsForShots(shotIds: string[])` — a single `useQuery` hook that fetches all storyboards for an array of shot IDs in one IndexedDB query using `repo.findByShotIds(shotIds)`. Returns a `Map<string, StoryboardPanel>` keyed by `shotId`.

### Card grid layout

Instead of the horizontal `StoryboardStrip` filmstrip, `StoryboardScreen` renders a responsive grid of annotated cards. Each card shows:

- 16:9 image area (generated image or "Shot N / Generate" placeholder)
- Annotation rows: Scene | Frame | Time, Description, Script/Camera, Sound | Music

### Refinement overlay

When a user clicks a generated card, a `RefinementPanel` slides in from the right (desktop) or bottom (mobile). The panel supports prompt-based refinement and version history.

### Wiring in App.tsx

- Replace empty storyboard view with `<StoryboardScreen sceneId={currentSceneId} />`
- StoryboardScreen manages its own data fetching — no need for App to pass shots or confirmation status
- Auto-seed initial shots into IndexedDB (same pattern as ShotListEditor) for offline-first behavior

## Consequences

### Positive

- Storyboards tab is fully functional with generate/view/refine workflow
- Batch hook eliminates Rules of Hooks violation and reduces queries from N to 1
- Cards display rich annotations alongside images, more useful than a plain filmstrip
- Paradigm gate prevents confusion about why generation is disabled

### Negative

- `StoryboardScreen` doesn't use the existing `StoryboardStrip` and `StoryboardPanel` components — it renders its own card layout. Those components are kept in the codebase for potential future use but are currently dead code.
- Auto-seed duplicates the seeding logic from `ShotListEditor`. A shared utility would reduce duplication, but the two components have slightly different seeding contexts (ShotListEditor seeds per-scene, StoryboardScreen seeds all shots for the scene).
- The refinement panel's `onRefined` callback updates local state optimistically. If the IndexedDB write fails, the UI shows stale data until the next query refresh.

## Files Changed

| File | Change |
|------|--------|
| `components/storyboard/StoryboardScreen.tsx` | New — orchestrator component with card grid, generator, and refinement |
| `components/storyboard/index.ts` | Export StoryboardScreen |
| `hooks/use-storyboards.ts` | Add `useStoryboardsForShots` batch hook |
| `hooks/index.ts` | Export `useStoryboardsForShots` |
| `styles/storyboard.css` | New — storyboard screen and card styles |
| `App.tsx` | Replace empty storyboard view with StoryboardScreen |
| `main.tsx` | Import storyboard.css |

## References

- Spec: `specs/feature-storyboard-screen.md`
- Batch hook: `app/client/src/hooks/use-storyboards.ts`
- Repository: `app/client/src/services/repositories/storyboard-repository.ts`
