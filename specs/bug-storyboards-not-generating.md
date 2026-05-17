# Bug: Storyboards Are Not Generating

## Bug Description
When users click "Generate" on a storyboard card or use the batch "Generate Storyboards" button, the generation fails silently or shows an error like "No API key configured for [provider]". No storyboard images are produced. The user expects clicking Generate to produce AI-generated images for their confirmed shots.

## Problem Statement
The UI components hardcode a default model ID (`gemini-3.1-flash`) that does not exist in the settings store's provider configuration (which defines `gemini-2.0-flash-image` and `imagen-4`). This causes model lookup to fail, falling back to the first available model from any provider — which likely has no API key configured, resulting in a generation failure.

## Solution Statement
Update the `DEFAULT_MODEL_ID` constants in both `StoryboardScreen.tsx` and `StoryboardGenerator.tsx` to match the actual model ID defined in the Google provider configuration in `settings-store.ts` (`gemini-2.0-flash-image`).

## Steps to Reproduce
1. Open the app and navigate to a project's storyboard screen for a scene with confirmed shots
2. Ensure no API key is stored for whatever provider the fallback model resolves to
3. Click "Generate" on an empty storyboard card, or click "Generate Storyboards" in the batch generator
4. Observe: generation fails with "No API key configured" error, or fails silently — no storyboard images are produced

## Root Cause Analysis

**Stale default model ID.** Two UI components define a default model:
- `StoryboardScreen.tsx:16` — `const DEFAULT_MODEL_ID = 'gemini-3.1-flash'`
- `StoryboardGenerator.tsx:29` — `const DEFAULT_MODEL_ID = 'gemini-3.1-flash'`

But the settings store (`settings-store.ts:40-42`) defines Google's models as:
```ts
{ id: 'gemini-2.0-flash-image', pricePerImage: 0.02 },
{ id: 'imagen-4', pricePerImage: 0.04 },
```

There is no model with ID `gemini-3.1-flash`. The lookup `models.find(m => m.providerId === 'google' && m.modelId === 'gemini-3.1-flash')` always returns `undefined`, causing fallback to `models[0]` (first model from any provider). If the user hasn't configured an API key for that fallback provider, generation fails.

This happened because a previous bug fix (`bug-real-image-generation.md`) updated the settings store model IDs but forgot to update the corresponding UI default constants.

## Relevant Files

- `app/client/src/components/storyboard/StoryboardScreen.tsx` — Contains `DEFAULT_MODEL_ID = 'gemini-3.1-flash'` at line 16 (stale)
- `app/client/src/components/storyboard/StoryboardGenerator.tsx` — Contains `DEFAULT_MODEL_ID = 'gemini-3.1-flash'` at line 29 (stale)
- `app/client/src/stores/settings-store.ts` — Defines actual Google models: `gemini-2.0-flash-image` and `imagen-4` at lines 40-42

## Step by Step Tasks

### Fix DEFAULT_MODEL_ID in StoryboardScreen
- In `StoryboardScreen.tsx`, change `const DEFAULT_MODEL_ID = 'gemini-3.1-flash'` to `const DEFAULT_MODEL_ID = 'gemini-2.0-flash-image'`

### Fix DEFAULT_MODEL_ID in StoryboardGenerator
- In `StoryboardGenerator.tsx`, change `const DEFAULT_MODEL_ID = 'gemini-3.1-flash'` to `const DEFAULT_MODEL_ID = 'gemini-2.0-flash-image'`

### Type-check and build verification
- Run `cd app/client && npx tsc --noEmit` — zero errors
- Run `cd app/client && npm run build` — build succeeds

## Validation Commands
- `cd app/client && npx tsc --noEmit` — Zero errors
- `cd app/client && npm run build` — Build succeeds
- Manual verification: Start the app, navigate to storyboards for a scene with confirmed shots, ensure the Google provider's `gemini-2.0-flash-image` model is auto-selected in the generator dropdown and that clicking Generate attempts real API generation (succeeds with valid key, shows clear error without key)

## Notes
- This is a regression from the previous `bug-real-image-generation` fix which updated model IDs in the settings store but missed updating the UI default constants.
- The `DEFAULT_PROVIDER_ID = 'google'` is correct and does not need to change.
- Consider removing hardcoded defaults entirely and deriving them from the settings store, but that's a refactor — the minimal fix is updating the model ID strings.
