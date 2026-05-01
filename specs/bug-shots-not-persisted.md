# Bug: Confirm Button Not Working & Storyboard Not Showing Shots

## Bug Description
- **Confirm button** on the Shots screen silently fails — clicking it produces no effect (no confirmation, no visible error)
- **Storyboard screen** shows the grid cards with shot data, but the `StoryboardGenerator` finds zero confirmed shots and cannot generate storyboards

## Problem Statement
`generateShotsFromScene()` creates in-memory Shot objects with temporary IDs (`shot-${scene.id}-${shotNumber}`). These are passed as `initialShots` to `ShotListEditor` which displays them via a fallback (`displayShots = shots.length > 0 ? shots : initialShots`). However, these shots are never persisted to IndexedDB.

The confirmation service (`ConfirmationService.confirmShotList`) queries IndexedDB via `repo.findByScene(sceneId)` — finds zero shots — returns validation error "Cannot confirm empty shot list". This error is caught by the React Query mutation but never surfaced to the user.

The `StoryboardGenerator` similarly queries `useShots(sceneId)` from IndexedDB — finds zero shots — shows zero confirmed shots.

## Root Cause Analysis
1. `ShotListEditor` receives `initialShots` (in-memory generated shots) as a prop
2. `useShots(sceneId)` queries IndexedDB — returns `[]`
3. `displayShots` falls back to `initialShots` for display only
4. Confirm handler calls `confirmShotList.mutateAsync(sceneId)` → `ConfirmationService.confirmShotList` → `repo.findByScene(sceneId)` → returns `[]` → validation error thrown
5. No auto-persist mechanism exists to seed generated shots into IndexedDB

## Solution Statement
1. **ShotListEditor**: Auto-seed `initialShots` into IndexedDB when DB is empty using `useEffect` + `useCreateShot`
2. **StoryboardScreen**: Use `useShots(sceneId)` hook internally instead of relying on the `shots` prop (which has temp IDs that don't match IndexedDB)
3. **App.tsx**: Remove `shots` prop from `StoryboardScreen` (no longer needed)

## Relevant Files

- `app/client/src/components/shot-list/ShotListEditor.tsx` — needs auto-seed logic for initialShots
- `app/client/src/components/storyboard/StoryboardScreen.tsx` — needs to get shots from IndexedDB via `useShots` hook
- `app/client/src/App.tsx` — remove `shots` prop from StoryboardScreen usage
- `app/client/src/hooks/use-shots.ts` — existing hooks (useShots, useCreateShot) — read only

## Step by Step Tasks

### Add auto-seed to ShotListEditor

- Import `useRef, useEffect` from react
- Add a `hasSeeded` ref to prevent double-seeding
- Add `useEffect` that checks: DB empty (`shots.length === 0`), not loading, `initialShots` available, not yet seeded
- If conditions met, iterate `initialShots`, extract `ShotData` fields, call `createShot.mutateAsync({ sceneId, data })` for each

### Fix StoryboardScreen to use IndexedDB shots

- Import `useShots` from hooks
- Call `useShots(sceneId)` to get persisted shots from IndexedDB
- Use the hook result as the primary shot data source (replaces `shots` prop)
- Remove `shots` from props interface (or make optional)
- Update the empty state check and paradigm gate to use the hook data

### Update App.tsx

- Remove `shots={generatedShots}` prop from both desktop and mobile `<StoryboardScreen>` instances

### Validate

- Run `npx tsc --noEmit` — zero new errors
- Run `npx vite build` — clean build
- Run existing tests — all pass

## Validation Commands

- `cd app/client && npx tsc --noEmit 2>&1 | grep -c 'error TS'` — should show same count as before (no new errors)
- `cd app/client && npx vite build` — should build successfully
- `cd app/client && npx vitest run 2>&1 | tail -5` — all tests pass

## Notes
- The `Shot` to `ShotData` conversion strips: `id`, `sceneId`, `shotNumber`, `confirmed`, `confirmedAt`, `createdAt`, `updatedAt`
- The repository generates new UUIDs for persisted shots — this is correct and expected
- `shotNumber` is auto-assigned by `getNextShotNumber()` in the repository
