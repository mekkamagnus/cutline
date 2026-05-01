# ADR 002: Script Editor Infinite Scroll and Hollywood Standard Formatting

## Status

Accepted

## Date

2026-05-02

## Context

The script editor rendered inside a fixed-size "page card" (`minHeight: 1100px`, dark background, box-shadow, border-radius). This created nested scrollbars — one inside the grey card, one on the parent — and clipped content for longer scripts. The textarea had a fixed `minHeight: 1000px` and never grew beyond it, so typing at the bottom was impossible. The FountainHighlight overlay had `overflow: hidden`, further clipping the syntax highlighting.

Additionally, element widths in `fountain.css` didn't match the Hollywood Standard screenplay format. The parenthetical max-width was `25ch` (standard: `20ch`), character cues had no max-width, and centered elements (character, dialogue, parenthetical) had leading whitespace in the raw text that conflicted with CSS centering.

Specs: `specs/bug-script-infinite-scroll.md`, `specs/bug-script-formatting.md`

## Decision

### Infinite scroll layout

- Remove the "page card" pattern entirely: strip `background`, `boxShadow`, `borderRadius`, `border`, and `minHeight` from `scriptPageStyles`
- Auto-resize the textarea to fit its content via a `useEffect` that syncs `textarea.style.height` to `scrollHeight` whenever `content` changes
- Remove `overflow: hidden` from `.fountain-highlight` so the overlay expands with content
- Remove `minHeight: 1000px` from `textareaStyles`
- Let the single parent scroll container (`editorAreaStyles` with `overflow: auto`) handle all scrolling

### Page delineation

- Add dashed page dividers every 55 lines (industry standard: ~55 lines per screenplay page)
- Line numbers reset to 1 at each page boundary (per-page numbering)
- `FountainHighlight` receives a `linesPerPage` prop (default 55) and renders `.fountain-page-divider` elements

### Hollywood Standard formatting

- Add design tokens in `tokens.css`: `--script-character-width`, `--script-dialogue-width`, `--script-parenthetical-width`, `--script-action-width`
- Update `fountain.css` to reference these tokens instead of hardcoded `ch` values
- Strip leading whitespace from centered elements in `FountainHighlight` so CSS centering works correctly

### Text visibility fix

- Set textarea `color: transparent` so only the syntax-highlighted overlay is visible
- Set `caret-color: var(--accent)` so the cursor remains visible

## Consequences

### Positive

- Single continuous scroll with no nested scrollbars — feels like a document editor
- Per-page line numbers match how screenwriters reference locations ("page 3, line 12")
- Element widths match the Hollywood Standard: parenthetical `20ch`, character cues constrained, action `60ch`
- Auto-resize ensures the textarea always shows all content

### Negative

- Page dividers are visual-only (55-line boundaries) — not tied to actual page breaks that would occur in print
- The textarea overlay pattern requires identical text in both layers, so CSS-based indentation (margins/padding) cannot differ between textarea and highlight. Centered elements must still use `text-align: center` with the same text content.
- Very long scripts (1000+ lines) may have performance implications since the entire textarea is a single DOM element with auto-height

## Files Changed

| File | Change |
|------|--------|
| `components/script/ScriptEditor.tsx` | Auto-resize textarea, remove page card styling, add page dividers to line numbers |
| `components/script/FountainHighlight.tsx` | Add `linesPerPage` prop, render page dividers, strip whitespace from centered elements |
| `styles/fountain.css` | Reorganize base styles, use token variables, add `.fountain-page-divider`, remove `overflow: hidden` from highlight |
| `styles/tokens.css` | Add Hollywood Standard width tokens |
| `vite.config.d.ts` | Removed (stale generated file) |

## References

- Spec: `specs/bug-script-infinite-scroll.md`
- Spec: `specs/bug-script-formatting.md`
- Hollywood Standard reference: `docs/hollywood-standard.md`
