# Bug: Script Screen Formatting

## Status: In Progress

## Bug Description
The Script screen has multiple formatting issues that prevent it from matching the Hollywood Standard screenplay format. While the initial bug (missing CSS import) is fixed, element dimensions and indentation do not match professional screenplay specifications.

## Issues Found

### Issue 1: Missing fountain.css Import — FIXED
**Status:** Fixed in `main.tsx` (added `import './styles/fountain.css'`)
The fountain syntax highlighting stylesheet existed but was never loaded, causing all elements to render unstyled.

### Issue 2: Text Duplication — FIXED
**Status:** Fixed in `ScriptEditor.tsx` (changed textarea `color` to `transparent`)
After importing fountain.css, both the textarea (white text) and overlay (colored text) rendered simultaneously, making text illegible.

### Issue 3: Element Dimensions Don't Match Hollywood Standard
**Status:** Needs Fix

Current vs. standard measurements (at 10-pitch Courier, chars per inch):

| Element | Standard Width | Current Width | Gap |
|---|---|---|---|
| Action | 60ch (6.0") | 60ch | OK |
| Dialogue | 35ch (3.5") | 35ch | OK |
| Parenthetical | 20ch (2.0") | 25ch (2.5") | **25% too wide** |
| Character | ~20ch (2.0") | No max-width | Unconstrained |

The parenthetical max-width of `25ch` exceeds the Hollywood Standard by 5 characters. Character cues have no max-width constraint.

### Issue 4: Indentation via Text Whitespace (Fragile)
**Status:** Known Limitation

Character cues, dialogue, and parentheticals use leading whitespace in the raw Fountain text for indentation, combined with CSS `text-align: center`. This approach:

- Works visually for most cases
- Causes parser misclassification (e.g., `MARK enters, shaking off his umbrella...` parsed as dialogue instead of action due to leading whitespace)
- Cannot be easily changed to CSS margins without breaking textarea/overlay alignment (both share the same text content)

The textarea overlay pattern requires identical text in both layers, so stripping whitespace from the overlay would break cursor positioning.

## Root Cause Analysis

1. **Issue 1 & 2:** `main.tsx` did not import `fountain.css`, and textarea had visible text color
2. **Issue 3:** `fountain.css` parenthetical max-width was set to `25ch` instead of the standard `20ch`
3. **Issue 4:** Fountain format uses whitespace for element detection; the overlay must render the same text as the textarea

## Relevant Files

- `app/client/src/main.tsx` — Entry point; fountain.css import added
- `app/client/src/styles/fountain.css` — Fountain element styles (widths need correction)
- `app/client/src/styles/tokens.css` — Design tokens (needs Hollywood Standard tokens)
- `app/client/src/components/script/ScriptEditor.tsx` — Main editor (textarea color fixed)
- `app/client/src/components/script/FountainHighlight.tsx` — Syntax overlay renderer

## Step by Step Tasks

### Fix parenthetical max-width
- In `fountain.css`, change `.fountain-parenthetical` max-width from `25ch` to `20ch`

### Add Hollywood Standard tokens
- In `tokens.css`, add width tokens: `--script-character-width`, `--script-parenthetical-width`
- Update existing `--script-action-max-chars` and `--script-dialogue-max-chars` for reference

### Use token variables in fountain.css
- Update fountain.css to reference token variables for element widths

### Verify visually
- Take screenshot and confirm proportions match Hollywood Standard

## Validation Commands
- `cd app/client && npm run build` — Verify build succeeds
- Screenshot comparison before/after

## Reference
See `docs/hollywood-standard.md` for the full Hollywood Standard specification.
