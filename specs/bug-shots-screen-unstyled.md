# Bug: Shots Screen Not Functioning and Unstyled

## Bug Description
The Shots screen (`/project/demo-project/shots`) has two problems:
1. **No formatting** — All shot-list components use BEM CSS class names (e.g. `shot-list-editor`, `shot-list-editor__table`, `shot-list-editor__row`) but no CSS file defines these styles. The result is an unstyled, unreadable mess of unformatted HTML elements.
2. **Not functioning** — The "Add Shot" form uses IndexedDB via TanStack Query hooks (`useShots`, `useCreateShot`, etc.), but there are pre-existing type errors in the hooks/repositories that prevent successful shot creation. The demo also has no pre-seeded shot data.

## Problem Statement
Two distinct issues:
1. **Missing CSS**: `ShotListEditor`, `ShotRow`, `ShotForm`, `ShotListStatus`, and `ConfirmationButton` all use BEM class names but no stylesheet defines them. There is no `shot-list.css` file.
2. **Type errors in hooks/services**: `ShotListStatus`, `ConfirmationButton`, and `ShotForm` have prop mismatches with their parent components, causing TypeScript errors. These may prevent the add-shot flow from working at runtime.

## Solution Statement
1. Create `app/client/src/styles/shot-list.css` with styles matching the DESIGN.md Shot List Screen specification — dark theme table layout with proper spacing, colors, and typography using existing design tokens.
2. Import the new stylesheet in `main.tsx`.
3. Fix the prop type mismatches in `ShotListStatus`, `ConfirmationButton`, and `ShotForm` so the add-shot workflow compiles and runs.

## Steps to Reproduce
1. Visit https://cutline.mekaelturner.com/project/demo-project/shots
2. Observe: unstyled layout — header, toolbar, table all render as raw unformatted blocks
3. Click "+ Add Shot"
4. Fill in shot details and click Save
5. Observe: shot may not be created due to type errors in the mutation chain

## Root Cause Analysis
**Missing CSS**: The shot-list components were built with BEM class names but no corresponding CSS file was ever created. Unlike the script editor (which uses inline styles), the shot-list components rely entirely on CSS classes. The `tokens.css` only defines design tokens and global resets — no component-specific styles for shot-list.

**Type errors**: `ShotListStatus` expects `shotCount` but doesn't define `isConfirmed`/`confirmedAt` in its props. `ConfirmationButton` doesn't define `shotCount` in its props. `ShotForm`'s `onSave` expects `ShotData` but receives `Partial<ShotData>`. These mismatches cause TypeScript compilation failures and may cause runtime errors in the mutation callbacks.

## Relevant Files

### Files to modify:
- `app/client/src/styles/shot-list.css` (NEW) — Shot list component styles using design tokens
- `app/client/src/main.tsx` — Add import for shot-list.css
- `app/client/src/components/shot-list/ShotListStatus.tsx` — Fix props to accept `isConfirmed` and `confirmedAt`
- `app/client/src/components/shot-list/ConfirmationButton.tsx` — Fix props to accept `shotCount`
- `app/client/src/components/shot-list/ShotForm.tsx` — Fix `onSave` type from `ShotData` to `Partial<ShotData>`

## Step by Step Tasks

### Create shot-list.css with table styling
- Create `app/client/src/styles/shot-list.css`
- Style `.shot-list-editor` as a full-width container with proper spacing
- Style `.shot-list-editor__table` as a grid/flex table with column widths matching: # (40px), Type (100px), Angle (100px), Movement (100px), Characters (120px), Action (1fr), Duration (70px), Actions (auto)
- Style `.shot-list-editor__row` with alternating row backgrounds, hover state
- Style `.shot-list-editor__row--header` with sticky header, bold text, muted colors
- Style `.shot-list-editor__cell` with padding, truncation, border-bottom
- Style `.shot-list-editor__header`, `.shot-list-editor__toolbar`, `.shot-list-editor__button`, `.shot-list-editor__empty`, `.shot-list-editor__summary`
- Style `.shot-form` as a card/panel with proper form layout
- Style `.shot-row` with editing state highlight
- Use existing CSS custom properties from tokens.css for colors, spacing, typography

### Import shot-list.css in main.tsx
- Add `import './styles/shot-list.css'` after the existing CSS imports

### Fix ShotListStatus props
- Add `isConfirmed` and `confirmedAt` to `ShotListStatusProps` interface
- Update the component to render confirmation status correctly

### Fix ConfirmationButton props
- Add `shotCount` to `ConfirmationButtonProps` interface
- Use it in the button label/cost calculation

### Fix ShotForm onSave type
- Change `onSave: (data: ShotData) => void` to `onSave: (data: ShotData) => Promise<void>` or align with what `handleAddShot`/`handleUpdateShot` actually accept

## Validation Commands
- `cd app/client && npx vite build` — Build succeeds
- Visual verification: start the app, navigate to shots tab, verify styled table renders, click "+ Add Shot", fill form, save, verify shot appears in list

## Notes
- The DESIGN.md has detailed ASCII wireframes for the Shot List Screen (both mobile and desktop) — use those as the layout reference.
- All colors/spacing should use the CSS custom properties from tokens.css for consistency.
- The `handleMoveShot` function in ShotListEditor is a no-op (just reorders array locally without persisting). This is fine for MVP — just note it in a brief comment if needed.
