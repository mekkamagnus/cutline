# ADR 003: Shot List Styling and Component Refactoring

## Status

Accepted

## Date

2026-05-02

## Context

The Shots screen had two blocking problems:

1. **No CSS**: All shot-list components used BEM class names (`shot-list-editor`, `shot-list-editor__row`, etc.) but no stylesheet defined them. The result was an unstyled, unreadable HTML dump.
2. **Prop type mismatches**: `ShotListStatus` queried hooks internally instead of receiving data via props. `ConfirmationButton` didn't accept `shotCount`. `ShotForm`'s `onSave` type didn't match its callers. These mismatches prevented the add/confirm workflow from compiling correctly.

Additionally, `ShotRow` rendered `<table>`/`<tr>`/`<td>` elements but the parent `ShotListEditor` used div-based layout, causing invalid HTML.

Specs: `specs/bug-shots-screen-unstyled.md`, `specs/bug-shots-not-persisted.md`

## Decision

### Create shot-list.css

- Full dark-theme stylesheet for all shot-list components using existing design tokens from `tokens.css`
- Grid-based table layout with column widths: `#` (40px), Type (100px), Angle (100px), Movement (100px), Characters (120px), Action (1fr), Duration (70px), Actions (auto)
- Alternating row backgrounds, hover states, sticky header, form panel styling
- Import in `main.tsx`

### Convert to presentational props

- **`ShotListStatus`**: Remove internal `useShots` and `useShotListConfirmationStatus` hooks. Accept `shotCount`, `isConfirmed`, `confirmedAt` as props. Remove `totalDuration` (moved to `ShotListEditor` summary).
- **`ConfirmationButton`**: Accept `shotCount`, `isConfirmed`, `onConfirm`, `onUnlock`, `isConfirming`, `isUnlocking` as props. Remove internal state management and modal. Simplify to two button variants (confirm/unlock).
- **`ShotForm`**: Fix `onSave` type to `ShotData` (not `Partial<ShotData>`). Add `shotNumber` and `isCreating` props.

### Switch table to divs

- **`ShotRow`**: Replace `<tr>`/`<td>` with `<div>` elements using `shot-list-editor__row` and `shot-list-editor__cell` classes
- Import `ShotForm` directly in `ShotRow` for inline editing

### Auto-seed initial shots

- **`ShotListEditor`**: Add `initialShots` prop and auto-seed logic using `useEffect` + `useCreateShot`. When IndexedDB returns empty and `initialShots` are provided, persist them via `createShot.mutateAsync`.
- Use `displayShots` (hook data or `initialShots` fallback) for all rendering, confirmation, and summary logic
- Use `hasSeeded` ref to prevent double-seeding

## Consequences

### Positive

- Shot list is fully styled and functional
- Components are presentational and testable — no hidden hook calls in leaf components
- Auto-seeding makes the demo immediately usable without manual DB setup
- Div-based rows are valid HTML and work with the parent's flex/grid layout

### Negative

- `handleMoveShot` in `ShotListEditor` is still a no-op (reorders array locally without persisting). This is acceptable for MVP.
- Auto-seed creates new UUIDs for persisted shots, so temp IDs from `generateShotsFromScene` are replaced. This is correct but means any references to the temp IDs are lost.
- The confirmation modal was replaced with a simpler `window.confirm()` dialog — less polished but functional.

## Files Changed

| File | Change |
|------|--------|
| `styles/shot-list.css` | New — full shot list component stylesheet |
| `components/shot-list/ConfirmationButton.tsx` | Simplify to presentational props, remove modal |
| `components/shot-list/ShotForm.tsx` | Fix onSave type, add shotNumber/isCreating props |
| `components/shot-list/ShotListEditor.tsx` | Add initialShots prop, auto-seed logic, switch to displayShots |
| `components/shot-list/ShotListStatus.tsx` | Remove hooks, accept presentational props |
| `components/shot-list/ShotRow.tsx` | Switch tr/td to divs, import ShotForm inline |
| `main.tsx` | Import shot-list.css |

## References

- Spec: `specs/bug-shots-screen-unstyled.md`
- Spec: `specs/bug-shots-not-persisted.md`
- Design tokens: `app/client/src/styles/tokens.css`
