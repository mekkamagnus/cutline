# Design System: Cutline

**Writer-First Screenwriting Tool**

A comprehensive design system for Cutline, a screenwriting application that prioritizes the writing experience above all else. Inspired by professional tools like Fade In, with modern interface patterns and accessibility-first design.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing Scale](#spacing-scale)
5. [Layout Patterns](#layout-patterns)
6. [Components](#components)
7. [Fountain Format Styling](#fountain-format-styling)
8. [Screen Architecture](#screen-architecture)
9. [Accessibility](#accessibility)
10. [Interaction Patterns](#interaction-patterns)

---

## Design Philosophy

### Writer-First Approach

Cutline's design is built around the writer's workflow:

- **Script as Primary**: The script editor is the main workspace, not one feature among many
- **Distraction-Free Writing**: Focus mode hides UI chrome when writing
- **Tools Around, Not In The Way**: Breakdown, shots, and storyboards are accessible via navigation but never intrude on the writing experience
- **Professional Formatting**: Industry-standard Fountain format with proper screenplay margins and typography

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Clarity** | Interface elements communicate their purpose without ambiguity |
| **Efficiency** | Common tasks are accessible via keyboard shortcuts and quick actions |
| **Consistency** | Patterns repeat across desktop and mobile experiences |
| **Accessibility** | WCAG AA compliance with proper contrast ratios and touch targets |

---

## Color System

### Dark Mode Palette (Default)

Cutline uses a dark theme optimized for long writing sessions with reduced eye strain.

```css
/* Primary Colors */
--bg-primary: #0f0f0f      /* Main background */
--bg-secondary: #1a1a1a    /* Panels, cards */
--bg-tertiary: #242424     /* Inputs, nested elements */
--bg-hover: #2a2a2a        /* Hover states */

/* Borders & Lines */
--border-color: #333       /* Standard borders */
--border-light: #404040    /* Subtle dividers */

/* Text */
--text-primary: #f5f5f5    /* Primary text */
--text-secondary: #a0a0a0  /* Secondary text */
--text-muted: #999         /* Disabled/hint text */

/* Accent */
--accent: #6366f1          /* Primary actions, focus states */
--accent-hover: #818cf8    /* Hover state */
--accent-light: rgba(99, 102, 241, 0.2)  /* Backgrounds */

/* Semantic */
--success: #22c55e         /* Saved, confirmed */
--warning: #f59e0b         /* Unsaved, draft */
--error: #ef4444           /* Errors, destructive actions */
```

### Fountain Element Colors

Syntax highlighting for Fountain script elements uses industry-standard colors:

```css
--fountain-scene: #fbbf24        /* Scene headings (amber) */
--fountain-character: #60a5fa    /* Character names (blue) */
--fountain-dialogue: #f5f5f5     /* Dialogue text */
--fountain-parenthetical: #9ca3af  /* Parentheticals (gray) */
--fountain-action: #f5f5f5       /* Action/description */
--fountain-transition: #c084fc   /* Transitions (purple) */
--fountain-shot: #fb923c         /* Shot headings (orange) */
```

### Color Usage Guidelines

- **Accent Color**: Use for primary actions, active states, focus indicators
- **Scene Colors**: INT scenes use amber, EXT scenes use green for quick visual distinction
- **Character Avatars**: Use distinct colors (accent, amber, green, pink) for main characters
- **Shot Badges**: Wide (red), Medium (amber), Close-up (purple), Two-shot (pink)

---

## Typography

### Font Families

```css
/* UI Font */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Script Font (Fountain) */
font-family: 'Courier Prime', 'Courier New', monospace;
```

**Rationale**: Inter provides excellent legibility at small sizes for UI elements. Courier Prime is designed specifically for screenwriting, with proper character widths for screenplay formatting.

### Typography Scale

```css
--font-size-xs: 12px     /* Labels, metadata, hints */
--font-size-sm: 14px     /* Body text, buttons */
--font-size-base: 16px   /* Base text */
--font-size-lg: 18px     /* Subheadings */
--font-size-xl: 24px     /* Section headings */
--font-size-2xl: 32px    /* Page headings, stats */
```

### Script Editor Typography

```css
/* Desktop */
.script-editor {
    font-size: 13pt;
    line-height: 1.2;
}

/* Mobile */
.script-editor {
    font-size: 1rem (16px);
    line-height: 1.4;
}
```

**Note**: Desktop uses 13pt (vs industry standard 12pt) for improved screen readability. Mobile uses 1rem to respect user's font size preferences.

### Font Weights

```css
300  /* Light - rare usage */
400  /* Regular - body text */
500  /* Medium - buttons, labels */
600  /* Semibold - headings, emphasis */
700  /* Bold - titles, important elements */
```

---

## Spacing Scale

Cutline uses an 8px-based spacing scale for consistency.

```css
--space-1: 4px    /* Tight spacing, icon padding */
--space-2: 8px    /* Small gaps */
--space-3: 12px   /* Compact padding */
--space-4: 16px   /* Standard padding */
--space-5: 20px   /* Medium spacing */
--space-6: 24px   /* Large padding */
--space-8: 32px   /* XL spacing */
--space-10: 40px  /* XXL spacing */
--space-12: 48px  /* Section gaps */
--space-16: 64px  /* Major sections */
```

### Mobile-Specific Spacing

Mobile uses a 4px base for tighter layouts on small screens:

```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
```

### Spacing Guidelines

- **Padding**: Use `--space-3` (12px) for compact elements, `--space-4` (16px) for standard
- **Gaps**: Use `--space-2` (8px) between related elements, `--space-4` (16px) between groups
- **Section Margins**: Use `--space-8` (32px) or `--space-10` (40px) between major sections

---

## Layout Patterns

### Desktop Layout: Three-Column Editor

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo | Script | Shots | Storyboards | Breakdown       │
├──────────┬──────────────────────────────────────────┬───────────┤
│          │  Toolbar: Title | Scene 1/12 | View | Zoom │ Save │ Export│
│          ├──────────────────────────────────────────┤           │
│ Scenes  │                                          │ Character  │
│          │  ┌────────────────────────────────────┐ │           │
│ - Coffee│  │                                    │ │ JANE      │
│ - Apt   │  │   INT. COFFEE SHOP - DAY           │ │ MARK      │
│ - Train │  │                                    │ │ SARAH     │
│          │  │   JANE sits at corner table...     │ │           │
│ Stats   │  │                                    │ │ Current   │
│ 12 scns │  │   MARK                             │ │ Scene     │
│ 6 chars │  │   (quietly)                        │ │           │
│          │  │   Mind if I join?                 │ │ Actions   │
│          │  │                                    │ │ - Edit    │
│          │  └────────────────────────────────────┘ │ - Export  │
│          │                                          │ - Focus   │
├──────────┴──────────────────────────────────────────┴───────────┤
│  Format: [Scene] [Action] [Char] [Dial] [Paren] [Trans] │ Find │ Focus │
└──────────────────────────────────────────────────────────────────┘
```

**Grid Definition**:
```css
.editor-container {
    display: grid;
    grid-template-columns: 240px 1fr 200px;
    grid-template-rows: auto 1fr auto;
    height: calc(100vh - 73px);
}
```

### Mobile Layout: Single Column

```
┌─────────────────┐
│ ☰  The Last Train │
├─────────────────┤
│ ◀ Scene 1 of 12 ▶│
├─────────────────┤
│                 │
│ INT. COFFEE     │
│ SHOP - DAY      │
│                 │
│ JANE sits...    │
│                 │
│ MARK           │
│ (quietly)      │
│ Mind if I join?│
│                 │
├─────────────────┤
│ [Scene][Char][...]│
├─────────────────┤
│ [Script][Break][Shots]│
└─────────────────┘
```

**Key Mobile Patterns**:
- **Bottom Navigation**: 4 tabs (Script, Breakdown, Shots, Storyboards)
- **Slide-Over Panels**: Scene navigator slides in from left
- **FAB**: Floating action button for quick format access
- **Touch Targets**: Minimum 44px per Apple HIG

---

## Components

### Buttons

```css
/* Primary Button */
.btn-primary {
    background: var(--accent);
    color: white;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--space-2);
}

/* Secondary Button */
.btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

/* Small Button */
.btn-sm {
    padding: var(--space-1) var(--space-3);
    font-size: var(--font-size-xs);
}
```

### Navigation Tabs

```css
.nav-tabs {
    display: flex;
    gap: var(--space-1);
    background: var(--bg-tertiary);
    padding: var(--space-1);
    border-radius: var(--space-2);
}

.nav-tab {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--space-2);
    background: transparent;
    color: var(--text-secondary);
}

.nav-tab.active {
    background: var(--accent);
    color: white;
}
```

### Format Buttons

```css
.format-btn {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--space-2);
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid transparent;
    min-height: 36px; /* Desktop */
}

.format-btn.active {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
}
```

**Mobile**: `min-height: 44px` for touch compliance

### Cards

```css
.card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--space-3);
    overflow: hidden;
}

.card-header {
    background: var(--bg-tertiary);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-color);
}

.card-body {
    padding: var(--space-4);
}
```

### Scene Items (Sidebar)

```css
.scene-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--space-2);
    border-left: 3px solid transparent;
    cursor: pointer;
}

.scene-item:hover {
    background: var(--bg-hover);
}

.scene-item.active {
    background: var(--accent-light);
    border-left-color: var(--accent);
}
```

### Character Avatars

```css
.character-avatar {
    width: var(--space-6);
    height: var(--space-6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
}
```

### Badges

```css
.badge {
    display: inline-flex;
    align-items: center;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--space-1);
    font-size: var(--font-size-xs);
    font-weight: 600;
}

.badge-success {
    background: rgba(34, 197, 94, 0.2);
    color: var(--success);
}

.badge-warning {
    background: rgba(245, 158, 11, 0.2);
    color: var(--warning);
}
```

### Filmstrip (Storyboards)

```css
.filmstrip {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-4);
    overflow-x: auto;
}

.filmstrip-panel {
    flex-shrink: 0;
    width: 160px;
    border-radius: var(--space-2);
    border: 2px solid transparent;
    cursor: pointer;
}

.filmstrip-panel:hover,
.filmstrip-panel.selected {
    border-color: var(--accent);
}
```

**Mobile**: `width: 70px` thumbnails

---

## Fountain Format Styling

### Element Formatting

```css
/* Scene Heading */
.fountain-scene {
    color: var(--fountain-scene);
    font-weight: bold;
    text-transform: uppercase;
    margin: 1.5rem 0 0.75rem;
}

/* Action */
.fountain-action {
    color: var(--fountain-action);
    margin: 0.5rem 0;
    max-width: 60ch;
}

/* Character */
.fountain-character {
    color: var(--fountain-character);
    text-align: center;
    margin: 1.25rem 0 0;
    font-weight: bold;
    text-transform: uppercase;
}

/* Parenthetical */
.fountain-parenthetical {
    color: var(--fountain-parenthetical);
    font-style: italic;
    text-align: center;
    font-size: 0.95em;
}

/* Dialogue */
.fountain-dialogue {
    color: var(--fountain-dialogue);
    text-align: center;
    max-width: 35ch;
    margin: 0 auto;
}

/* Transition */
.fountain-transition {
    color: var(--fountain-transition);
    text-align: right;
    text-transform: uppercase;
    margin: 1rem 0;
}

/* Shot */
.fountain-shot {
    color: var(--fountain-shot);
    text-transform: uppercase;
}
```

### Script Page

```css
.script-page {
    background: #1e1e1e;
    padding: var(--space-10) var(--space-16);
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    border-radius: var(--space-2);
    max-width: 850px;
}
```

### Screenplay Width Guides

Action text includes a subtle column guide at 60ch:
```css
.fountain-action::after {
    content: '';
    position: absolute;
    right: -50px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--border-color);
    opacity: 0.3;
}
```

---

## Screen Architecture

### Desktop Screens

| # | Screen | Description |
|---|--------|-------------|
| 1 | **Script Editor** | Primary workspace. Three-column layout with scene navigator, editor, and character panel |
| 2 | **Shot List** | Table view per scene with shot type, angle, movement, duration |
| 3 | **Storyboards** | Filmstrip + panel detail view with edit/regenerate actions |
| 4 | **Script Breakdown** | Four-column stats + scene/character/location cards |

### Mobile Screens (12 total)

| # | Screen | Key Features |
|---|--------|--------------|
| 1 | **Main Script Editor** | Format bar, FAB, scene nav, bottom nav |
| 2 | **Focus Mode** | Distraction-free, minimal chrome |
| 3 | **Scene Navigator** | Jump buttons, scene quick-jump |
| 4 | **Shots** | Card-based shots, bottom sheet confirm |
| 5 | **Shot List** | Card-based shots, bottom sheet confirm |
| 6 | **AI Suggestions** | Suggestion cards with accept/edit/reject |
| 7 | **Storyboards** | Filmstrip carousel, panel detail |
| 8 | **Characters** | Avatar list with dialogue counts |
| 9 | **Settings** | Toggles, export options, storyboard style |
| 10 | **Scene Cards** | Alternative view mode, card-based scenes |
| 11 | **Notes** | Comments, versions, note input |
| 12 | **Project List** | Landing, recent projects, new/import |

### Navigation Flow

```
Desktop:                    Mobile:
┌─────────────┐            ┌─────────────┐
│   Header    │            │   Header    │
└──────┬──────┘            └──────┬──────┘
       │                          │
       ▼                          ▼
┌─────────────────┐      ┌─────────────────┐
│  Script Editor  │      │  Script Editor  │
│  (Primary)      │      │  (Primary)      │
└─────────────────┘      └────────┬────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐
│  Top Nav Tabs   │      │  Bottom Nav Bar │
│  - Script       │      │  - Script       │
│  - Shots        │      │  - Shots        │
│  - Storyboards  │      │  - Storyboards  │
│  - Breakdown    │      │  - Breakdown    │
└─────────────────┘      └─────────────────┘
```

---

## Accessibility

### WCAG AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Contrast Ratio** | All text meets 4.5:1 minimum. `--text-muted: #999` on `--bg-primary: #0f0f0f` = 12.6:1 |
| **Touch Targets** | Mobile interactive elements min 44px × 44px (Apple HIG) |
| **Focus Indicators** | Branded cursor (`caret-color: var(--accent)`), visible focus states |
| **Keyboard Navigation** | Full keyboard support with visible focus |
| **Semantic HTML** | Proper heading hierarchy, button/link semantics |

### Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save |
| `Cmd/Ctrl + Enter` | New scene heading |
| `Cmd/Ctrl + F` | Find & replace |
| `Tab` | Next element type |
| `Enter` | New line of current type |
| `Escape` | Exit focus mode |

### Platform-Specific Shortcuts

The UI detects the user's platform and displays appropriate shortcuts:

```javascript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
// Mac: ⌘ (Cmd)
// Windows/Linux: Ctrl
```

### Focus Mode

Hides sidebars and reduces chrome for distraction-free writing:

```css
.focus-mode .sidebar {
    display: none;
}

.focus-mode .bottom-nav {
    display: none; /* Mobile */
}
```

---

## Interaction Patterns

### Save States

```css
.save-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--success);
}

.save-dot.unsaved {
    background: var(--warning);
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
```

### Scene Navigation

- **Desktop**: Click scene in left sidebar to jump
- **Mobile**: Slide-over panel with scene list + quick-jump chips

### Format Selection

- **Desktop**: Bottom toolbar with visual shortcuts
- **Mobile**: Horizontal format bar + FAB for quick format panel

### Zoom Controls

```css
.zoom-controls {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    background: var(--bg-tertiary);
    border-radius: var(--space-2);
}

.zoom-level {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    min-width: 40px;
    text-align: center;
}
```

Range: 75% - 150%, increments of 5%

### View Toggle

Script view vs Scene Cards vs Focus mode:

```css
.view-toggle {
    display: flex;
    background: var(--bg-tertiary);
    border-radius: var(--space-2);
    padding: var(--space-1);
}

.view-toggle button.active {
    background: var(--bg-secondary);
    color: var(--text-primary);
}
```

---

## Implementation Notes

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Custom Properties

All design tokens are CSS custom properties for easy theming and runtime modification.

### Contenteditable

The script editor uses `contenteditable="true"` with `spellcheck="false"` for Fountain editing.

---

## Design Tokens Reference

### Complete Token List

```css
/* Spacing */
--space-1 through --space-16

/* Colors */
--bg-primary, --bg-secondary, --bg-tertiary, --bg-hover
--border-color, --border-light
--text-primary, --text-secondary, --text-muted
--accent, --accent-hover, --accent-light
--success, --warning, --error

/* Fountain Colors */
--fountain-scene, --fountain-character, --fountain-dialogue
--fountain-parenthetical, --fountain-action
--fountain-transition, --fountain-shot

/* Typography */
--font-size-xs through --font-size-2xl
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-28 | Initial design system based on mockups |
