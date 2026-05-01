# ADR 005: Storyboard Card Grid Sizing Fix

## Status

Accepted

## Date

2026-05-02

## Context

After implementing the storyboard screen (ADR-004), the card grid had two sizing failures:

1. **Width**: The original CSS used `repeat(3, 1fr)` with hardcoded breakpoints at 1023px and 767px. Between breakpoints, `1fr` columns shrank proportionally with no floor — cards could become too narrow for annotation text to be legible.

2. **Height**: Even after fixing width to `repeat(auto-fill, 280px)`, cards were being compressed vertically to ~70px. CSS Grid auto-sized rows to fit within the viewport, and `.storyboard-card { overflow: hidden }` clipped all content. The image area and annotations were invisible.

The width fix was verified via Playwright measurements showing all cards at exactly 280px. The height failure was only visible when cards had actual content (after confirming shots) — the earlier test showed only the paradigm warning, which hid the bug.

Spec: `specs/bug-storyboard-cards-shrink.md`

## Decision

### Fixed-width columns with auto-fill

```css
.storyboard-grid {
  grid-template-columns: repeat(auto-fill, 280px);
}
```

Cards are exactly 280px. Only the number of columns changes with viewport size — cards never resize. Removed all hardcoded column-count media queries.

### Max-content rows

```css
.storyboard-grid {
  grid-auto-rows: max-content;
  align-items: start;
  align-content: start;
}
```

- `grid-auto-rows: max-content` — each row sizes to its card's natural height instead of being compressed to fit the grid container
- `align-items: start` — prevents grid from stretching cards vertically
- `align-content: start` — packs rows at the top; grid scrolls via `overflow-y: auto`

### Card height

```css
.storyboard-card {
  height: max-content;
}
```

Ensures each card reports its full content height to the grid, so `max-content` rows have correct measurements.

## Consequences

### Positive

- Cards render at consistent 280px width at all viewport sizes
- Cards show full image and annotation content (354–399px tall) instead of being clipped to ~70px
- Grid scrolls vertically when content exceeds viewport — no content is hidden
- Eliminates all hardcoded breakpoint media queries for column counts

### Negative

- On narrow viewports (600px), the 280px cards may cause horizontal overflow if the grid container doesn't have `overflow-x: hidden`. Currently mitigated by the parent layout constraining width.
- `max-content` row sizing means the grid cannot "fill" the viewport vertically with empty space at the bottom. This is the correct tradeoff — cards should never be stretched.

## Files Changed

| File | Change |
|------|--------|
| `styles/storyboard.css` | Grid: fixed 280px columns, max-content rows, align-items/align-content start, card height max-content |

## References

- Spec: `specs/bug-storyboard-cards-shrink.md`
- ADR-004: Storyboard screen implementation
- Verified via Playwright at 1920px (4 cols), 1280px (2 cols), 800px (1 col), 600px (1 col)
