# Hollywood Standard Screenplay Format

Reference specification for professional screenplay formatting. Used as the target for Cutline's Fountain editor and rendering.

## Page Setup

| Property | Value |
|---|---|
| Paper | US Letter (8.5" x 11"), portrait |
| Left margin | 1.5" (3.7" from left edge in most word processors, which measure from the text boundary) |
| Right margin | 1.0" |
| Top margin | 1.0" |
| Bottom margin | 1.0" |
| Font | Courier or Courier New, 12pt |
| Line spacing | Single-spaced |
| Approximate screen time | ~1 minute per page |

## Element Specifications

All measurements are from the left edge of the page.

| Element | Indent | Width | Alignment | Style |
|---|---|---|---|---|
| Scene Heading (Slug) | 1.5" | 6.0" | Left | UPPERCASE, bold |
| Action | 1.5" | 6.0" | Left | Normal |
| Character Cue | 3.7" | ~2.0" | Centered | UPPERCASE |
| Parenthetical | 3.1" | ~2.0" | Left | Lowercase, italic, wrapped in () |
| Dialogue | 2.5" | 3.5" | Left | Normal |
| Transition | 1.5" | 6.0" | Right | UPPERCASE |
| Shot | 1.5" | 6.0" | Left | UPPERCASE |

### CSS Pixel Equivalents (96 dpi)

| Element | Indent (px) | Width (px) |
|---|---|---|
| Scene Heading | 144px | 576px |
| Action | 144px | 576px |
| Character Cue | 355px | ~192px |
| Parenthetical | 298px | ~192px |
| Dialogue | 240px | 336px |
| Transition | 144px | 576px |

## Spacing Rules

- **1 blank line** between distinct elements (scene heading → action, action → character cue, dialogue → action, etc.)
- **No blank line** between character cue and its dialogue
- **No blank line** between dialogue and its parenthetical
- **No blank line** between parenthetical and continuing dialogue
- Action blocks are **double-spaced** (blank line between paragraphs)

## Casing Rules

- **UPPERCASE**: Scene headings, character cues (on cue lines), transitions, shots
- **UPPERCASE on first mention**: Character names when first introduced in action text
- **Mixed case**: Dialogue, action descriptions, parentheticals

## Page Break Rules (Orphan/Widow Prevention)

- **No orphans**: A character cue must not appear alone at the bottom of a page without at least one line of dialogue
- **No widows**: A single line of dialogue must not appear alone at the top of a new page
- **Minimum 2 lines** of any element must appear together before a page break
- Scene headings should not appear as the last line of a page (push to next page)

## Element Order

Typical element sequence in a scene:

```
SCENE HEADING
(blank line)
ACTION
(blank line)
CHARACTER CUE
(PARENTHETICAL)
DIALOGUE
(blank line)
ACTION
(blank line)
TRANSITION
```

## Common Scene Heading Prefixes

- `INT.` — Interior
- `EXT.` — Exterior
- `INT./EXT.` — Both (e.g., a car interior seen from outside)
- `I/E.` — Alternate form

## Common Transitions

- `CUT TO:`
- `FADE IN:`
- `FADE OUT.`
- `FADE TO BLACK.`
- `DISSOLVE TO:`
- `SMASH CUT TO:`
- `MATCH CUT TO:`
- `TIME CUT:`
- `END CREDITS.`

## Notes for Implementation

- The Fountain format maps directly to these conventions; the parser should enforce element detection rules
- Character introductions in action (first UPPERCASE name) should be tracked for the characters list
- Page breaks in the digital editor can be approximated at ~55 lines per page (12pt Courier single-spaced on US Letter)
- The editor overlay should replicate these indentation/alignment rules for authentic screenplay appearance
