# Bug: Storyboard Images Don't Generate or Don't Match Card Content

## Bug Description
When using the dev app in the browser at `http://localhost:5175/`, storyboard image generation is still failing. Clicking an individual storyboard card or "Generate Storyboards" should produce an image for each confirmed shot, but the request path is unreliable and may fail before the image provider is called.

After generation is working, the resulting images must also reflect the description and information shown on their respective shot cards. Users expect the generated image for each card to visually depict the action description, shot type framing, camera angle, and characters listed on that card.

## Updated Browser Findings

Tested from the headed Edge browser on `http://localhost:5175/project/demo-project/storyboards`:

1. Storyboard cards still do not generate through the normal UI.
2. The client defaults to `http://localhost:3001` in `app/client/src/lib/api-client.ts`.
3. On the current machine, port `3001` is not unique:
   - another Vite dev server is listening on `[::1]:3001`
   - the Cutline API is also listening on `*:3001`
4. Browser requests to `http://localhost:3001` can hit the wrong server, producing CORS failures for `/api/ai/keys` and 404s or failed preflights for `/api/ai/generate/dynamic/single`.
5. Direct requests to `http://127.0.0.1:3001` reach the Cutline API, confirming the issue is partly host/port resolution and port collision, not only app logic.
6. The Google model currently selected by default, `gemini-2.0-flash-image`, returned a Google API 404 during live testing. The current model list included `gemini-2.5-flash-image`, `gemini-3-pro-image-preview`, and `gemini-3.1-flash-image-preview` as image-capable model IDs.
7. A real paid image generation succeeded with OpenAI `gpt-image-1` using the improved Shot 5 prompt, proving the prompt shape is usable once the request reaches a valid provider/model.

## Problem Statement
There are now two related problems:

1. **Generation path is broken in local dev** — the browser runs on `http://localhost:5175/`, while the client sends API requests to `http://localhost:3001`. Because `3001` is already occupied by another dev server on the `localhost` IPv6 path, the browser can hit the wrong process. Storyboard generation therefore fails before image generation.

2. **Prompt content was too weak once generation succeeds** — the original `buildShotPrompt()` function in `app/client/src/lib/build-shot-prompt.ts` constructed image generation prompts as a flat comma-separated list of technical filmmaking terms. That format is ineffective for image generation models because:

   - **Raw technical terms** — Shot types like `"wide"`, `"close-up"`, `"over-the-shoulder"` and angles like `"eye-level"` are filmmaker jargon, not visual descriptions. Image models produce better results when given descriptive framing guidance (e.g., "wide angle showing the full scene" vs "wide shot").

   - **Dialogue text used as visual description** — For dialogue shots, `actionDescription` contains raw dialogue text (e.g., `"I've been waiting for hours."`) rather than a description of what the scene looks like. The image model receives a line of speech, not a visual scene, resulting in generic images unrelated to the card.

   - **Flat list format** — The prompt is a comma-separated string like `"manga style storyboard, wide shot, eye-level camera angle, <text>, featuring CHAR1"`. This reads as metadata, not a coherent visual scene description. Image models respond better to natural language scene descriptions.

### Example of current prompt output
For a dialogue shot card showing:
- Type: `close-up`, Angle: `eye-level`, Description: `"I've been waiting for hours."`, Characters: `["JANE"]`

Current prompt: `"manga style storyboard, close-up shot, eye-level camera angle, I've been waiting for hours., featuring JANE"`

The model has no visual information — just a line of dialogue attributed to a name.

## Solution Statement
Fix storyboard generation end to end:

1. **Use unique dev ports and explicit API URL wiring** — Do not rely on `localhost:3001` when another process can occupy that host/port. Run the Cutline API on a unique port if necessary, and point the Vite client at the exact API host with `VITE_API_URL`.
2. **Make CORS explicit for the dev client** — The API must allow the actual browser origin, currently `http://localhost:5175`, including credentials if the client continues to send `credentials: 'include'`.
3. **Validate provider/model defaults** — Do not hard-code a stale image model. The default selected model must be image-capable for the configured provider, or generation should show a clear provider/model error before sending the request.
4. **Keep the improved prompt builder** — `buildShotPrompt()` should produce visually descriptive, natural language prompts that image generation models can interpret.

Prompt-specific requirements:

1. **Map shot types to visual framing descriptions** — Translate technical terms into descriptions of what the frame should look like (e.g., `"wide"` -> `"wide angle showing the full scene and environment"`)
2. **Frame dialogue as visual scene** — Detect dialogue-like content and describe the character's visible state rather than quoting the dialogue literally
3. **Split mixed dialogue/action text** — When a card contains dialogue followed by visible action, keep the spoken line and action description as separate prompt sentences
4. **Compose as a coherent visual description** — Write the prompt as a natural language scene description, not a comma-separated metadata list

## Steps to Reproduce
1. Start the Cutline dev frontend and open `http://localhost:5175/`
2. Navigate to `http://localhost:5175/project/demo-project/storyboards`
3. Confirm the shot list if the Storyboards tab shows the confirmation gate
4. Click "Generate" on a storyboard card, or use "Generate Storyboards" for batch generation
5. Observe: images still do not generate through the normal UI
6. In DevTools/network, observe requests to `http://localhost:3001/api/ai/keys` or `/api/ai/generate/dynamic/single` failing with CORS/preflight/network errors or hitting the wrong server
7. If generation does reach a provider, verify the selected provider/model is valid and image-capable

## Root Cause Analysis
Primary runtime root cause:

`app/client/src/lib/api-client.ts` falls back to `http://localhost:3001`, while the browser is on `http://localhost:5175/`. On the current machine, `localhost:3001` is not unique: another Vite process is listening on `[::1]:3001`, and the Cutline API is also listening on `*:3001`. Browser requests to `localhost` may resolve to the wrong process. This prevents storyboard generation from reaching the Cutline API reliably.

Secondary provider/model root cause:

The default Google image model in the storyboard UI is `gemini-2.0-flash-image`, but live provider testing returned a Google API 404 for that model. The app should not assume that a hard-coded model is currently valid.

Prompt-quality root cause:

The original `buildShotPrompt()` in `app/client/src/lib/build-shot-prompt.ts` joined shot metadata fields with `", "` separators. The resulting string was a technical specification, not a visual description. Image generation models (Gemini, OpenAI, etc.) produce significantly better results when given descriptive natural language about what to depict, rather than comma-separated jargon.

The function is called from two places:
- `StoryboardScreen.tsx:78` — single card generation
- `StoryboardGenerator.tsx:86` — batch generation

Both use the same `buildShotPrompt()` function, so both flows produce the same low-quality prompts.

## Relevant Files

- `app/client/src/lib/build-shot-prompt.ts` — **Primary fix target**. Contains `buildShotPrompt()` that constructs the image generation prompt. This function needs to be rewritten to produce visually descriptive prompts.
- `app/client/src/lib/api-client.ts` — **Primary generation blocker**. Defaults to `http://localhost:3001`; must use a unique, explicit API URL in dev.
- `app/server/src/index.ts` — **Server port/CORS target**. Uses `process.env.PORT || 3001` and `.use(cors())`; should support a unique API port and explicit dev CORS origin for `http://localhost:5175`.
- `app/client/.env.local` or project dev scripts — **Dev wiring target**. Should set `VITE_API_URL` to the actual Cutline API origin, preferably `http://127.0.0.1:<unique-port>` or another unique port.
- `app/client/src/stores/settings-store.ts` — **Provider/model default target**. Contains default provider models and pricing. Must not default to an invalid image model.
- `app/client/src/components/storyboard/StoryboardScreen.tsx` — Calls `buildShotPrompt(shot, 'manga')` at line 78. No changes needed (just consumes the prompt).
- `app/client/src/components/storyboard/StoryboardGenerator.tsx` — Calls `buildShotPrompt(s, selectedStyle)` at line 86. No changes needed (just consumes the prompt).
- `app/client/src/types/index.ts` — Shot type definition (lines 222-244). Reference only — defines the `Shot` interface fields available for prompt building.

## Step by Step Tasks

### Fix dev API connectivity first

- Pick a unique Cutline API port if `3001` is occupied. Recommended: use `3011` or another unused port for Cutline API during dev.
- Update server startup so `PORT` can be set from the dev command:
  - Example API command: `PORT=3011 bun run src/index.ts`
- Update the client dev environment so the frontend at `http://localhost:5175/` calls the exact Cutline API origin:
  - Example: `VITE_API_URL=http://127.0.0.1:3011`
- Do not rely on `localhost:3001` as the fallback while another local project may own that host/port path.
- Configure API CORS explicitly for the frontend origin:
  - allow origin `http://localhost:5175`
  - allow credentials if the client keeps `credentials: 'include'`
  - allow `Content-Type` and `Authorization`
- Add a smoke test or documented manual check:
  - `curl http://127.0.0.1:3011/` returns Cutline API JSON
  - browser network request to `${VITE_API_URL}/api/ai/keys` reaches Cutline API, not another Vite app

### Validate provider/model selection

- Ensure the default selected image model is available for the provider at runtime.
- Replace or avoid hard-coding `gemini-2.0-flash-image` if the current Gemini API does not list it as image-capable.
- When no API key is configured, show a clear error and do not create an empty storyboard panel.
- When the provider returns `{ success: false, error }` with HTTP 200, the client must treat it as a failure and display the error instead of creating an image panel with `undefined` image URL/cost.

### Rewrite `buildShotPrompt()` to produce visual descriptions

- Add a `SHOT_TYPE_VISUALS` mapping that translates each `ShotType` to a visual framing description:
  - `"wide"` → `"wide angle showing the full scene and environment"`
  - `"medium"` → `"medium shot from the waist up"`
  - `"close-up"` → `"tight close-up focusing on the subject's face and expression"`
  - `"extreme-cu"` → `"extreme close-up on a specific detail"`
  - `"two-shot"` → `"two characters framed together in the shot"`
  - `"over-the-shoulder"` → `"shot looking past one person's shoulder toward another person"`
  - `"establishing"` → `"wide establishing shot showing the full location and setting"`
  - `"insert"` → `"focused insert shot of a specific object or detail"`
- Add a `CAMERA_ANGLE_VISUALS` mapping for angle descriptions:
  - `"eye-level"` → `"straight-on eye-level perspective"`
  - `"high-angle"` → `"high angle looking down at the subject"`
  - `"low-angle"` → `"low angle looking up at the subject"`
  - `"dutch-angle"` → `"tilted dutch angle creating visual tension"`
  - `"birds-eye"` → `"bird's eye view looking straight down"`
  - `"worms-eye"` → `"worm's eye view from ground level looking up"`
- Rewrite the function to compose a coherent natural language prompt:
  - Start with the style and framing: `"{style} style storyboard illustration. {SHOT_TYPE_VISUALS[type]}, {CAMERA_ANGLE_VISUALS[angle]}"`
  - Add camera movement if non-static: `", with a {movement} camera effect"`
  - Detect if `actionDescription` is dialogue and frame accordingly:
    - For dialogue-like text: `"A character speaks: '{dialogue}'. Show the speaker's facial expression and body language conveying the emotion of the words."`
    - For mixed dialogue/action text: split the dialogue sentence from subsequent visible action and include both
    - For action/scene text: include as-is as a visual scene description
  - Add characters: `"Characters visible in frame: {characters.join(', ')}"`
  - Add a quality suffix: `", detailed illustration, clear composition, professional storyboard quality"`

### Add unit tests for `buildShotPrompt()`

- Create test file `app/client/src/lib/__tests__/build-shot-prompt.test.ts`
- Test cases:
  - Action shot with all fields populated produces a visual description (not comma-separated metadata)
  - Dialogue shot produces a prompt that describes the character's visible state, not just quoting dialogue
  - Shot with no `actionDescription` still produces a valid prompt with framing and characters
  - Shot with empty `charactersInFrame` omits character mention
  - Static movement is not mentioned in the prompt
  - Non-static movement is included with visual description
  - Mixed dialogue/action text separates the spoken line from subsequent visible action
  - Each shot type maps to its correct visual description
  - Each camera angle maps to its correct visual description

### Validate

- Run the frontend on `http://localhost:5175/`
- Run the API on a unique port and set `VITE_API_URL` to that exact API origin
- Confirm `GET ${VITE_API_URL}/` returns Cutline API JSON in the browser/network path
- Confirm `GET ${VITE_API_URL}/api/ai/keys` reaches Cutline API and no longer hits another local Vite app
- Confirm a single storyboard card sends a real request to `${VITE_API_URL}/api/ai/generate/dynamic/single`
- Confirm a provider error does not create an empty image panel
- Run `cd app/client && npx tsc --noEmit` — zero errors
- Run `cd app/client && npx vitest run` — all tests pass

## Validation Commands
- `lsof -nP -iTCP:3001 -sTCP:LISTEN` — identify existing port conflicts before choosing the API port
- `lsof -nP -iTCP:<chosen-api-port> -sTCP:LISTEN` — verify the chosen API port is unique before starting Cutline API
- `curl http://127.0.0.1:<chosen-api-port>/` — returns Cutline API JSON, not another app's HTML
- `cd app/client && npx tsc --noEmit` — Zero type errors
- `cd app/client && npx vitest run` — All tests pass including new `build-shot-prompt.test.ts`
- Manual: Start the app at `http://localhost:5175/`, generate storyboard images for shots with varied content (action, dialogue, establishing), verify images generate and visually reflect the card descriptions

## Notes
- This is no longer client-side only. Prompt generation is client-side, but the generation blocker is dev API routing/ports/CORS/provider handling.
- The `RefinementPanel.tsx` also uses `buildShotPrompt` indirectly through its own prompt construction for refinement requests. The improved prompt format will benefit refinement as well.
- The `style` parameter (e.g., `'manga'`, `'cinematic'`) is already handled correctly as the first element of the prompt — keep this behavior.
- Current browser URL: `http://localhost:5175/`
- Current observed conflict: `localhost:3001` can resolve to a different local dev server. Use a unique Cutline API port and explicit `VITE_API_URL` instead of assuming `localhost:3001`.
