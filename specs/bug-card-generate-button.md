# Bug: Card Generate Button Does Nothing

## Problem
When a storyboard card has no generated image (placeholder state showing "Shot N" + "Generate"), clicking the card does nothing. The card-level `onClick` handler in `StoryboardScreen.tsx:123` only fires when a storyboard already exists:

```tsx
onClick={() => storyboard && setSelectedStoryboard(storyboard)}
```

When `storyboard` is `undefined` (placeholder state), the click is a no-op. There is no per-card generate handler.

## Root Cause
The card's placeholder area (lines 134-137) is purely presentational — it shows "Generate" text but has no click handler. The only generation path is the batch `StoryboardGenerator` at the bottom of the page, which generates all ungenerated shots at once.

## Solution
Add a per-card generate action. When a user clicks a placeholder card, generate a single image for that shot using the currently selected provider/model.

## Relevant Files

### Existing Files to Modify
- `app/client/src/components/storyboard/StoryboardScreen.tsx` — Add single-shot generation handler; pass it to cards; handle loading/error state per card; update `storyboardMap` on success
- `app/client/src/styles/storyboard.css` — Add hover/active states to placeholder to indicate it's clickable; add a loading state style for in-progress generation

### No New Files

## Implementation Plan

### Step 1: Add per-card generation state to StoryboardScreen
- Add `generatingShotId: string | null` state to track which card is generating
- Add `cardError: string | null` state for per-card errors
- Read the currently-selected provider/model from `useSettingsStore` (same defaults as StoryboardGenerator: Google / gemini-3.1-flash)

### Step 2: Add `handleCardGenerate` callback
- Builds a prompt from the shot data using the same `buildShotPrompt` logic from StoryboardGenerator
- Calls `api.post('/api/ai/generate/dynamic/single', { shotId, prompt, style, providerId, model, endpoint, apiKey, costPerImage })`
- On success: creates a `StoryboardPanel` object and adds it to `storyboardMap`
- On error: sets `cardError`
- Sets `generatingShotId` during the request for loading state

### Step 3: Wire the card onClick to call handleCardGenerate for placeholder cards
- Change the card `onClick` to:
  - If `storyboard` exists → `setSelectedStoryboard(storyboard)` (open refinement, current behavior)
  - If no storyboard → `handleCardGenerate(shot)` (generate single image)
- Add `e.stopPropagation()` to prevent event bubbling issues

### Step 4: Update placeholder UI for loading state
- When `generatingShotId === shot.id`, show a spinner/loading indicator instead of "Generate"
- When `cardError` is set for this shot, show the error inline

### Step 5: Add CSS for interactive placeholder
- `storyboard-card__placeholder` should show hover effect (brighten, scale)
- Add `.storyboard-card__placeholder--loading` style with a subtle animation
- Add `.storyboard-card__placeholder--error` style

## Acceptance Criteria
1. Clicking a placeholder card generates a single image for that shot
2. Loading spinner shows on the card while generating
3. On success, the image replaces the placeholder without page reload
4. On error, error shows inline on the card (no alert)
5. Clicking a card that already has an image opens the refinement panel (existing behavior preserved)
6. Cards with images are unaffected
7. Type-check passes with zero new errors

## Validation Commands
- `cd app/client && npx tsc --noEmit` — Zero new errors
- `cd app/client && npm run build` — Build succeeds
- `playwright-cli open http://localhost:5175/project/demo-project/storyboards` — Click a placeholder card, verify image loads
