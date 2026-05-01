# Bug: Script Screen Not Showing Full Content / Nested Scrollbars

## Bug Description
The script editor displays content inside a fixed-size "page card" with `#1e1e1e` background, box-shadow, border-radius, and `minHeight: 1100px`. This creates a document-within-a-document layout where:

1. Only partial script content is visible within the card's viewport
2. Nested scrollbars appear — one inside the grey page card, one on the main content area
3. The editor feels like a box rather than an infinite-scroll document like Google Docs or Final Draft

**Expected**: Full script visible in a single continuous scroll, no inner scrollbars, document editor feel.
**Actual**: Content clipped inside a grey card with its own scrollbar, nested inside a scrollable content area.

## Problem Statement
The `ScriptEditor` component renders a "page card" div (`scriptPageStyles`) with fixed dimensions and card-like styling. This card creates a secondary scroll context inside the already-scrollable main content area. The textarea has a fixed `minHeight: 1000px` and doesn't auto-resize to fit content, so longer scripts get clipped. The FountainHighlight overlay has `overflow: hidden` which further clips content.

## Solution Statement
Remove the "page card" pattern and convert the script editor to an infinite-scroll document layout:
1. Strip card styling (background, shadow, border, border-radius) from the page container
2. Auto-resize the textarea to fit its content (sync height to scrollHeight)
3. Remove `overflow: hidden` from the highlight overlay so it matches full content height
4. Let the single parent scroll container (`editorAreaStyles` with `overflow: auto`) handle all scrolling
5. Add page delineation lines every 55 lines (standard screenplay page) with dashed horizontal rules
6. Line numbers restart at 1 at each page boundary (per-page line numbering)

## Steps to Reproduce
1. Start the dev server (`npm run dev` in `app/client`)
2. Open `http://localhost:5173/project/demo-project/script` in a browser
3. Observe: the script is inside a grey rounded-corner card
4. Observe: only partial content visible, requires scrolling inside the grey card
5. Observe: scrollbar appears inside the grey card AND in the main content area
6. Scroll to bottom — content is cut off inside the card

## Root Cause Analysis
Three interacting causes:

1. **Page card styling** (`ScriptEditor.tsx:245-256`): `scriptPageStyles` has `minHeight: 1100px`, `background: '#1e1e1e'`, `boxShadow`, `borderRadius`, `border` — creates a visible "page within a page" that clips content.

2. **Fixed textarea height** (`ScriptEditor.tsx:295`): `textareaStyles` has `minHeight: 1000px` — textarea doesn't grow with content, creating internal scrolling within the transparent textarea.

3. **Clipped overlay** (`fountain.css:19-29`): `.fountain-highlight` has `overflow: hidden` — syntax highlighting clips at the container boundary, not matching full content height.

The scroll chain: `editorContainerStyles` (overflow: hidden, fixed height) > `mainContentStyles` (overflow: hidden) > `editorAreaStyles` (overflow: auto — the one useful scrollbar) > `scriptPageStyles` (the grey card) > textarea (internal scroll, transparent).

## Relevant Files

### `app/client/src/components/script/ScriptEditor.tsx`
- `scriptPageStyles` (line 245-256) — page card container with grey background, shadow, border-radius, fixed minHeight. **Must be simplified.**
- `editorContainerStyles` (line 238-242) — outer wrapper with padding and background. **Adjust to remove card padding.**
- `textareaStyles` (line 283-298) — textarea with `minHeight: 1000px`. **Must auto-resize to fit content.**
- `lineNumbersStyles` (line 258-272) — absolute-positioned line numbers. **Must grow with content height.**
- Component render (line 164-233) — needs textarea auto-resize logic via `useEffect` + `ref`.

### `app/client/src/styles/fountain.css`
- `.fountain-highlight` (line 19-29) — overlay with `overflow: hidden`. **Remove overflow: hidden so overlay expands with content.**

### `app/client/src/App.tsx`
- `editorAreaStyles` (line 460-463) — parent scroll container with `overflow: auto`. **No changes needed** — this is the single scroll container that should handle all scrolling.

## Step by Step Tasks

### Add textarea auto-resize logic
- In `ScriptEditor.tsx`, add a `useEffect` that syncs `textareaRef.current.style.height` to `textareaRef.current.scrollHeight` whenever `content` changes
- This makes the textarea always tall enough to show all content without internal scrolling
- Reset height to `auto` briefly before reading scrollHeight to handle content shrinking

### Remove page card styling
- Change `scriptPageStyles` to remove: `background: '#1e1e1e'`, `boxShadow`, `borderRadius`, `border`, `minHeight: '1100px'`
- Keep: `width: '100%'`, `maxWidth`, `margin`, `position: 'relative'` (needed for overlay positioning)
- Adjust padding for document feel — keep horizontal padding for readability

### Fix highlight overlay clipping
- In `fountain.css`, remove `overflow: hidden` from `.fountain-highlight`
- The overlay should expand to match the full textarea height

### Fix line numbers to grow with content
- Remove `bottom: 'var(--space-10)'` from `lineNumbersStyles` — this constrains height
- Line numbers should extend as far as the content goes

### Remove fixed textarea minHeight
- Remove `minHeight: '1000px'` from `textareaStyles` — the auto-resize useEffect handles height

### Update editor container for document feel
- Adjust `editorContainerStyles` in `ScriptEditor.tsx` — remove outer padding that creates extra spacing around the "page"
- The document content should flow edge-to-edge within the scroll container

### Validate in browser
- Open script screen, verify full content visible in single scroll
- Verify no nested scrollbars
- Verify line numbers align with content and restart at each page boundary
- Verify dashed page divider lines appear every 55 lines
- Verify syntax highlighting covers all content
- Verify typing at the end of the script works correctly
- Verify on both desktop and mobile viewports

## Validation Commands
- `cd app/client && npm run type-check` — TypeScript compiles without errors
- `cd app/client && npm run test` — existing tests pass (no regressions)
- Manual: open `http://localhost:5173/project/demo-project/script` and verify:
  - All 5 scenes visible without nested scrollbar
  - Only one scrollbar (the main content area)
  - No grey card background visible — uniform dark background
  - Line numbers extend to end of content
  - Typing at bottom of script works, textarea auto-expands

## Notes
- The textarea overlay pattern (transparent textarea + absolute-positioned highlight div) requires the textarea and overlay to have identical dimensions. Auto-resizing the textarea and removing `overflow: hidden` from the overlay ensures they stay in sync.
- The `editorAreaStyles` in `App.tsx` already provides the correct single-scroll behavior (`overflow: auto`). We're eliminating the nested scroll by removing the card container's constraints.
- No new dependencies needed — this is purely CSS/style changes plus a small useEffect for auto-resize.
- Page delineation uses `LINES_PER_PAGE = 55` (industry standard: ~55 lines per screenplay page). Dashed dividers render in both the line number gutter and the FountainHighlight overlay.
- Per-page line numbers reset to 1 at each page boundary, matching how screenwriters reference "page 3, line 12".
