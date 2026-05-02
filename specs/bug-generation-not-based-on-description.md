# Bug: Generated Images Are Random, Not Based on Shot Description

## Bug Description
When generating a storyboard image (via card click or batch generator), the resulting image is a random placeholder photo, not a visualization of the shot's description, characters, camera angle, or selected style. The user expects to see an image that reflects the shot's action description, scene context, and chosen visual style (defaulting to manga/comic).

## Problem Statement
Two issues:

1. **Mock provider ignores the prompt entirely.** The `mockGenerate()` function in `openai-image.provider.ts` returns `https://picsum.photos/seed/${Date.now()}/1024/576` — a random stock photo. The prompt (which contains the shot description, camera angle, characters, and style) is built correctly but never passed to any image generation logic. Since `USE_REAL_AI_API` is not set (and most users have no API key configured), the mock is the only path exercised.

2. **Default style is `pencil-sketch`, not manga.** Both `StoryboardGenerator.tsx` (line 49) and `StoryboardScreen.tsx` (lines 94, 98, 120) default to `'pencil-sketch'`. The user wants `'manga'` as the default. There is also a type mismatch: the `StoryboardStyle` type in `types/index.ts` includes `'manga-comic'` but the generator's `STORYBOARD_STYLES` array uses value `'manga'`.

## Solution Statement

1. **Fix the mock to produce style-aware placeholder images.** Instead of a random picsum photo, generate a data-URL placeholder image (or use a deterministic picsum seed based on the prompt hash) so different shots produce visually distinct placeholders. The mock should also return a prompt-representative result when possible.

2. **Change default style to manga.** Update the `useState` defaults in both `StoryboardGenerator` and `StoryboardScreen` from `'pencil-sketch'` to `'manga'`.

3. **Fix the style value mismatch.** The `STORYBOARD_STYLES` array in `StoryboardGenerator.tsx` uses `'manga'` but the type system uses `'manga-comic'`. Align on `'manga'` in the type definition since that's what the prompt builder uses and what image models understand.

## Steps to Reproduce
1. Open the app at `/project/demo-project/storyboards`
2. Confirm the shot list (if not already confirmed)
3. Click a storyboard card's "Generate" button, or use the batch "Generate Storyboards" at the bottom
4. Observe: a random stock photo appears (picsum), not an image reflecting the shot description
5. Observe: style defaults to "Pencil Sketch" instead of "Manga/Comic"

## Root Cause Analysis

### Issue 1: Mock ignores prompt
`openai-image.provider.ts:103` — `mockGenerate()` uses `Date.now()` as the picsum seed, ignoring `params.prompt` entirely. The prompt IS correctly built by `buildShotPrompt()` in both `StoryboardGenerator.tsx:18` and `StoryboardScreen.tsx:17` — it includes style, shot type, camera angle, action description, and characters. But the mock discards it.

### Issue 2: Default style
- `StoryboardGenerator.tsx:49` — `useState('pencil-sketch')`
- `StoryboardScreen.tsx:94` — hardcoded `'pencil-sketch'` in `handleCardGenerate`

### Issue 3: Type mismatch
- `types/index.ts:74` defines `'manga-comic'`
- `StoryboardGenerator.tsx:38` uses `value: 'manga'`
- The prompt builder passes the style value directly to the prompt string, so `'manga'` is correct for image models

## Relevant Files

- `app/server/src/services/openai-image.provider.ts` — `mockGenerate()` returns random picsum image, ignoring the prompt
- `app/client/src/components/storyboard/StoryboardGenerator.tsx` — Default style `'pencil-sketch'` on line 49; style list value `'manga'` on line 38
- `app/client/src/components/storyboard/StoryboardScreen.tsx` — Hardcoded `'pencil-sketch'` on lines 94, 98, 120; duplicate `buildShotPrompt` function
- `app/client/src/types/index.ts` — `STORYBOARD_STYLES` array has `'manga-comic'` on line 74

## Step by Step Tasks

### Step 1: Fix default style to manga in StoryboardGenerator
- In `StoryboardGenerator.tsx`, change `useState('pencil-sketch')` to `useState('manga')`

### Step 2: Fix default style to manga in StoryboardScreen
- In `StoryboardScreen.tsx`, change all `'pencil-sketch'` references to `'manga'` in `handleCardGenerate` (lines 94, 98, 120)

### Step 3: Fix StoryboardStyle type mismatch
- In `types/index.ts`, change `'manga-comic'` to `'manga'` in the `STORYBOARD_STYLES` array (line 74)
- This makes the type match what the UI actually uses

### Step 4: Make mock generate deterministic, prompt-aware images
- In `openai-image.provider.ts`, change `mockGenerate()` to use a deterministic seed based on hashing the prompt string, so the same prompt always produces the same placeholder
- Use `https://picsum.photos/seed/{hashOfPrompt}/1024/576` instead of `Date.now()`

### Step 5: Extract shared `buildShotPrompt` to avoid duplication
- Both `StoryboardGenerator.tsx` and `StoryboardScreen.tsx` have identical `buildShotPrompt` functions
- Move to a shared utility, e.g. `app/client/src/lib/build-shot-prompt.ts`
- Import from both components

### Step 6: Type-check and validate
- `cd app/client && npx tsc --noEmit` — zero new errors
- `cd app/client && npm run build` — build succeeds
- Verify default style is "Manga/Comic" in browser
- Verify different shots produce different placeholder images

## Validation Commands
- `cd app/client && npx tsc --noEmit` — Zero new errors
- `cd app/client && npm run build` — Build succeeds
- `playwright-cli open http://localhost:5175/project/demo-project/storyboards` — Check style dropdown defaults to "Manga/Comic"
- `curl -s -X POST http://localhost:3001/api/ai/generate/dynamic/single -H "Content-Type: application/json" -d '{"shotId":"test","prompt":"manga style storyboard, close-up shot, eye-level camera angle, Jane looks anxious","style":"manga","providerId":"google","providerName":"Google","model":"gemini-3.1-flash","endpoint":"https://generativelanguage.googleapis.com/v1beta/openai","apiKey":""}'` — Verify mock returns deterministic image based on prompt

## Notes
- The real fix for production is connecting to actual image generation APIs (Google Imagen, OpenAI DALL-E, etc.) which will naturally produce prompt-based images. The mock fix is for development/testing.
- The `manga` vs `manga-comic` mismatch would cause runtime issues if code tries to compare a `StoryboardStyle` value with a style string. Aligning on `'manga'` is the right call since image models understand "manga" not "manga-comic".
- When a real API key is configured and `USE_REAL_AI_API=true`, the prompt-based generation already works correctly — the `generateViaOpenAICompat` function passes the prompt to the provider. This bug only affects the mock development path.
