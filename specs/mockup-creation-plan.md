# Chore: Create HTML Mockups for Phase 1 Screens

## Chore Description

Create two HTML mockup files (`mockup.html` and `mockup-mobile.html`) that visually demonstrate all Phase 1 screens from the PRD. The desktop mockup will show full-screen layouts, while the mobile mockup will display 3 screens per row inside iPhone frames with bevel styling.

## Relevant Files

### New Files to Create
- `mockup.html` - Desktop mockup showing all Phase 1 screens in full-width layout
- `mockup-mobile.html` - Mobile mockup showing 3 screens per row in iPhone frames with bevel styling

### Reference Files
- `docs/prd.md` - Contains all Phase 1 feature specifications and UI/UX requirements (Features #1, #1.5, #1.6, #1.7, #1.8, #1.9, #6, #7, #18, #19, #20)

## Step by Step Tasks

### Step 1: Create Desktop Mockup (mockup.html)

**Create the base HTML structure with embedded CSS:**

- Use semantic HTML5 with viewport meta tag
- Embed all CSS in `<style>` tag for self-contained file
- Use modern CSS variables for theming (colors, spacing, fonts)
- Include Google Fonts (Inter for UI, Courier Prime for script elements)
- Set up grid/flexbox layouts for screen containers

**Define screen sections for Phase 1 features:**

1. **Landing/Project Selection Screen**
   - Project list with thumbnails
   - "New Project" CTA button
   - Recent projects section

2. **Script Input Screen** (Feature #1)
   - Two input options: Paste text or Upload file
   - Fountain format indicator
   - Parse button with loading state preview

3. **Script Editor Screen** (Feature #1.5)
   - Fountain format editor with syntax highlighting
   - AV format toggle (two-column Video | Audio)
   - Toolbar with format shortcuts (Tab for character, Enter for dialogue)
   - Scene heading detection preview
   - Word count and page estimate
   - Save indicator

4. **Script Breakdown Dashboard** (Feature #1.6)
   - Four-column layout:
     - Scene list with INT/EXT indicators
     - Character roster with dialogue counts
     - Location list grouped by interior/exterior
     - Props summary
   - Statistics panel (total scenes, characters, locations, duration)
   - Export CSV/PDF buttons

5. **Shot List Editor Screen** (Feature #1.7)
   - Tabular interface per-scene
   - Columns: Shot #, Type, Angle, Movement, Characters, Action, Duration, Notes
   - Dropdowns for shot type/angle/movement
   - Character selector (populated from script breakdown)
   - Copy, reorder, delete actions per row
   - Shot count display

6. **AI Shot Suggestions Screen** (Feature #1.8)
   - Suggested shots table with AI reasoning
   - "Accept All" / "Accept Individual" / "Reject" buttons
   - Regenerate suggestions button
   - Cost estimate preview

7. **Shot List Confirmation Screen** (Feature #1.9)
   - Review mode showing all locked shots
   - Summary stats: shot count, estimated cost
   - "Confirm Shot List" button (primary)
   - "Unlock for Editing" button
   - Visual confirmation indicator (green checkmark)

8. **Scene-Focused Main View** (Feature #18)
   - Left Sidebar:
     - Project name and settings
     - Scene list with headings
     - Character quick access
     - Global settings
   - Main Content:
     - Current scene heading
     - Scene settings panel (collapsible)
     - Storyboard filmstrip
     - Script text panel
   - Right Panel (contextual):
     - Edit prompt input
     - Generation parameters

9. **Storyboard View with Filmstrip** (Feature #19)
   - Horizontal scrollable filmstrip
   - Selected panel in detail view
   - Panel actions: Edit, Regenerate, Duplicate, Delete, Move
   - Panel metadata overlay (shot type, characters)
   - Keyboard navigation hint

10. **Storyboard Edit/Refinement Screen** (Feature #7)
    - Large panel preview
    - Edit prompt textarea
    - Refinement suggestions chips
    - Previous version thumbnail
    - Save/Cancel buttons

11. **Script View Integration** (Feature #20)
    - Three view mode tabs: Storyboard / Script / Split
    - Fountain format highlighting in script view
    - Click-to-navigate scene headings
    - Synced scrolling indicator

12. **Local Collaboration Screen** (Feature #1.10)
    - Comments panel per scene
    - Version history timeline
    - Track changes toggle
    - Save version modal preview

13. **Export/Project Management Screen** (Features #12-13)
    - Auto-save indicator
    - Manual save button
    - Export as JSON option
    - Import project option
    - Unsaved changes badge

**Styling approach:**
- Dark/light mode toggle (default dark for filmmaker aesthetic)
- Sidebar width: 280px
- Right panel width: 320px
- Filmstrip panel size: 200x150px
- Accent color: #6366f1 (indigo)
- Use CSS Grid for main layouts, Flexbox for components

### Step 2: Create Mobile Mockup (mockup-mobile.html)

**Create base structure with iPhone frame CSS:**

- Same HTML5 boilerplate as desktop
- iPhone frame CSS with bevel styling:
  - Rounded corners (border-radius: 40px)
  - Border with gradient for metallic bevel effect
  - Notch/dynamic island placeholder
  - Home indicator bar
  - Shadow for depth
- Grid layout: 3 screens per row
- Responsive: 2 screens per row on tablet, 1 on very small screens

**Create mobile versions of all screens:**

1. **Mobile Landing**
   - Simplified project list as cards
   - FAB (floating action button) for new project

2. **Mobile Script Input**
   - Stacked paste/upload options
   - Full-width textarea
   - Bottom-sheet style parse button

3. **Mobile Script Editor**
   - Full-screen editor with bottom toolbar
   - Formatting tools as icon buttons
   - Collapsible scene navigator (slide-out)

4. **Mobile Breakdown Dashboard**
   - Tab-based navigation (Scenes/Characters/Locations/Props)
   - Card-based lists
   - Swipeable scene cards

5. **Mobile Shot List Editor**
   - Card-based shot cards (not table)
   - Swipe actions (edit/delete)
   - Bottom sheet for adding shots
   - Quick-add button fixed at bottom

6. **Mobile Shot Suggestions**
   - Card-based suggestions with expandable reasoning
   - Action buttons at bottom of each card
   - Bulk actions in sticky header

7. **Mobile Storyboard Filmstrip**
   - Horizontal scrolling snap carousel
   - Tap to expand modal
   - Thumbnail grid view option

8. **Mobile Storyboard Edit**
   - Full-screen panel preview
   - Bottom sheet for edit prompt
   - Swipe to compare versions

9. **Mobile Scene View**
   - Bottom navigation bar
   - Collapsible top header
   - Pull-to-refresh indicator

10. **Mobile Script View**
    - Full-width script text
    - Floating action button for view toggle
    - Slide-over navigation

11. **Mobile Collaboration**
    - Comments as overlay modal
    - Version history as bottom sheet
    - Inline comment markers

12. **Mobile Project Management**
    - Settings as list screen
    - Export/Import as action cards
    - Sync status indicator

**iPhone frame styling specifications:**
```css
.iphone-frame {
  width: 320px;
  height: 650px;
  border-radius: 40px;
  border: 12px solid #1a1a1a;
  box-shadow:
    inset 0 0 0 2px #3a3a3a,
    0 10px 40px rgba(0,0,0,0.4);
  position: relative;
  overflow: hidden;
}
.iphone-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 28px;
  background: #1a1a1a;
  border-radius: 0 0 16px 16px;
}
```

**Mobile layout grid:**
```css
.mobile-screens-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  padding: 40px;
}
@media (max-width: 1200px) {
  grid-template-columns: repeat(2, 1fr);
}
@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

### Step 3: Add Interactive Elements

**Add minimal JavaScript for demo interactions:**

- Tab switching between screen sections (desktop)
- View mode toggles (Storyboard/Script/Split)
- Expand/collapse panels
- Hover states and focus indicators
- Sample data populated in all fields

**Sample content to include:**
- Demo script: Short 2-scene screenplay
- Characters: "JANE" (30s, filmmaker), "MARK" (30s, protagonist)
- Location: "INT. COFFEE SHOP - DAY"
- 4-6 storyboard panels with placeholder imagery
- Sample shot list with variety of shot types

### Step 4: Validation

**Open both files in browser to verify:**
- Desktop: All screens visible, proper spacing, no horizontal overflow
- Mobile: 3 screens per row, iPhone frames render correctly with bevel
- All interactive elements show hover states
- Responsive behavior works on window resize
- No console errors

## Validation Commands

Execute these commands to validate the mockups are complete:

- `open mockup.html` - Opens desktop mockup in default browser for visual review
- `open mockup-mobile.html` - Opens mobile mockup in default browser for visual review
- Check that all 13+ screen sections are present and properly styled
- Verify iPhone frames have proper bevel effect in mobile version
- Confirm 3 screens per row layout in mobile mockup

## Notes

**Design considerations:**
- Use placeholder images from https://placehold.co for storyboard panels
- Use SVG icons for UI elements (Lucide or Heroicons style inline SVGs)
- Color palette should reflect filmmaker aesthetic (dark mode by default)
- Typography: Inter for UI, Courier Prime for script elements
- All mockup content is static HTML/CSS - no backend required

**Screen count:**
- Desktop: ~13 screen sections as single-page showcase
- Mobile: ~12 mobile screen variants in iPhone frames
- Total: 25+ distinct screen mockups across both files

**iPhone frame detail:**
- Bevel effect created with CSS border and inset shadows
- Dynamic island/notch at top center
- Home indicator at bottom (small pill shape)
- Metallic gradient on border for realistic device look
