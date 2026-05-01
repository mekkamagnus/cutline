# Bug: Storyboard Cards Shrink on Browser Resize, Obstructing Text

## Bug Description
On the Storyboard screen, storyboard cards shrink proportionally when the browser window is resized smaller. As cards narrow, the annotation text (Description, Script, Sound/Music fields) gets crushed and truncated to the point of being unreadable. The cards have no minimum width constraint, so they shrink indefinitely with the viewport.

## Problem Statement
The CSS grid uses `repeat(3, 1fr)` for column sizing with hardcoded media query breakpoints at 1023px and 767px. Between breakpoints, `1fr` columns shrink proportionally with no floor. Cards can become too narrow for annotation text to be legible. The annotation value text also uses aggressive truncation (`-webkit-line-clamp: 2`) and lacks `word-break`, causing long text to overflow its container rather than wrap.

## Solution Statement
- Replace `repeat(3, 1fr)` with `repeat(auto-fill, minmax(280px, 1fr))` so cards have a minimum width and columns wrap naturally as space decreases
- Remove the three hardcoded breakpoint media queries for column counts (no longer needed with auto-fill)
- Add `word-break: break-word` to `.storyboard-card__value` and increase line clamp from 2 to 3 so annotation text wraps instead of being aggressively truncated

## Steps to Reproduce
1. Open the app at `/project/demo-project/storyboards`
2. Navigate to Storyboards tab (shots must be confirmed first)
3. Resize browser window from full-width down to ~600px
4. Observe cards shrinking until annotation text is crushed and unreadable

## Root Cause Analysis
- `.storyboard-grid` uses `grid-template-columns: repeat(3, 1fr)` — `1fr` has no lower bound, so columns shrink to any width
- Hardcoded breakpoints at 1023px and 767px switch to 2-col and 1-col, but between those breakpoints cards are still too narrow
- `.storyboard-card__value` has `-webkit-line-clamp: 2` with no `word-break`, so text is cut off after 2 lines without wrapping long words

## Relevant Files

- `app/client/src/styles/storyboard.css` — contains the `.storyboard-grid` and `.storyboard-card__value` styles that need fixing

## Step by Step Tasks

### Fix grid column sizing

- In `.storyboard-grid`, change `grid-template-columns: repeat(3, 1fr)` to `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- Remove the three media query blocks that override column counts:
  - `@media (max-width: 1023px) and (min-width: 768px)` with `repeat(2, 1fr)`
  - `@media (max-width: 767px)` with `1fr`

### Fix annotation text wrapping

- In `.storyboard-card__value`, add `word-break: break-word`
- Change `-webkit-line-clamp` from `2` to `3` to give annotation text more room before truncation

### Validate

- `cd app/client && npx vite build` — must build successfully
- `cd app/client && npx vitest run` — all 226 tests must pass
- Manual: resize browser from full-width to narrow and confirm cards wrap to fewer columns instead of shrinking below readable width

## Validation Commands
- `cd /Users/mekael/Documents/programming/typescript/cutline/app/client && export PATH="$HOME/.nvm/versions/node/v24.13.1/bin:$PATH" && npx vite build` — must complete successfully
- `cd /Users/mekael/Documents/programming/typescript/cutline/app/client && export PATH="$HOME/.nvm/versions/node/v24.13.1/bin:$PATH" && npx vitest run` — all 226 tests pass

## Notes
- The `auto-fill` + `minmax()` pattern is the standard CSS Grid approach for responsive card layouts. It eliminates the need for hardcoded breakpoints for column counts.
- 280px is chosen as the minimum because it provides enough space for the 3-column header row (Scene | Frame | Time) and keeps annotation text legible.
