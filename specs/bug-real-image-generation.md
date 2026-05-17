# Bug: Generated Images Don't Match Description — Using Mock Instead of Real AI

## Bug Description
When generating storyboard images, the system falls back to the mock API (picsum.photos random stock photos) instead of using the selected provider/model. The images produced are random stock photos that bear no relation to the shot description, visual style, or characters. The user expects real AI-generated images from the selected model (e.g., Google `gemini-3.1-flash-image-preview`) that reflect the shot description, visual style, camera angle, and characters.

## Problem Statement
Three root causes:

1. **Wrong model names.** The settings store lists `gemini-3.1-flash` and `imagen-4` as Google models. `gemini-3.1-flash` is a text-only model — it cannot generate images. Google's actual image generation models are `gemini-3.1-flash-image-preview`, `gemini-3-pro-image-preview`, `gemini-2.5-flash-image`, `imagen-4`, and `imagen-4-ultra`.

2. **Google's image API uses a different endpoint and format than OpenAI `/images/generations`.** Google uses `POST /v1beta/models/{model}:generateContent` with `responseModalities: ["IMAGE"]` and returns images as `inline_data` parts. The current `generateViaOpenAICompat` calls `POST {endpoint}/images/generations` which either doesn't work or returns errors for Google models. Google uses `x-goog-api-key` header, not `Authorization: Bearer`.

3. **Mock fallback masks the failure.** When the real API fails (due to wrong model name, wrong endpoint, or no API key), `generateDynamic` silently falls back to `mockGenerate()` which returns random picsum photos. The user has explicitly requested: "DO NOT USE MOCK API."

## Solution Statement

1. **Fix model names** in settings-store defaults to use actual image-capable models for each provider.
2. **Add a Google-native image provider** that calls `generateContent` with the correct format, auth header, and response parsing.
3. **Route Google requests to the native provider** instead of the OpenAI-compatible one. Keep OpenAI-compatible routing for OpenAI, BFL/fal, and other providers that support it.
4. **Remove mock fallback.** When no API key is stored for the selected provider, return an error asking the user to configure one in Settings. Do not silently fall back to picsum.

## Steps to Reproduce
1. Open the app at `/project/demo-project/storyboards`
2. Confirm the shot list
3. Select Google as provider, `gemini-3.1-flash` as model
4. Click Generate on a storyboard card
5. Observe: a random picsum stock photo appears — not an AI-generated image based on the shot description, style, or characters

## Root Cause Analysis

### Issue 1: Wrong model names
`settings-store.ts:41` — `{ id: 'gemini-3.1-flash', pricePerImage: 0.01 }` is a text model. The image-capable model is `gemini-3.1-flash-image-preview`. Same issue with `imagen-4` — the API endpoint requires `imagen-4` but through the `generateContent` API, not `/images/generations`.

### Issue 2: Wrong API endpoint and format for Google
`openai-image.provider.ts:41` — Calls `POST {endpoint}/images/generations` with `Authorization: Bearer {key}`. Google's image generation requires:
- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Auth: `x-goog-api-key: {key}` header
- Request body: `{ contents: [{ parts: [{ text: "prompt" }] }], generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } } }`
- Response: `candidates[0].content.parts[].inlineData.data` (base64 PNG)

### Issue 3: Mock fallback hides failures
`ai-proxy.service.ts:574` — `const useMock = !resolvedKey;` When no key is stored, silently returns a picsum URL. The user has no indication that real generation wasn't attempted.

## Relevant Files

- `app/client/src/stores/settings-store.ts` — Default model names are wrong (text models, not image models)
- `app/server/src/services/openai-image.provider.ts` — OpenAI-compatible provider; needs a Google-native alternative
- `app/server/src/services/ai-proxy.service.ts` — `generateDynamic()` routes all providers through OpenAI compat; needs Google-specific routing
- `app/client/src/lib/build-shot-prompt.ts` — Prompt builder is correct, no changes needed

### New Files
- `app/server/src/services/google-image.provider.ts` — Google-native image generation using `generateContent` API

## Step by Step Tasks

### Step 1: Create Google-native image provider
- Create `app/server/src/services/google-image.provider.ts`
- Implement `generateViaGoogleAI(apiKey, model, prompt, aspectRatio)` that:
  - Calls `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
  - Uses `x-goog-api-key` header (not `Authorization: Bearer`)
  - Sends `{ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } } }`
  - Parses response: extracts base64 image from `candidates[0].content.parts` where `inlineData.mimeType` starts with `image/`
  - Returns `{ id, url: "data:image/png;base64,...", cost, model, provider }`

### Step 2: Fix default model names in settings-store
- In `settings-store.ts`, update Google models:
  - Change `gemini-3.1-flash` to `gemini-3.1-flash-image-preview` with pricePerImage: 0.02
  - Change `imagen-4` to `imagen-4` with pricePerImage: 0.04 (correct model, but needs Google-native routing)
- Update OpenAI models:
  - Change `gpt-image-2` stays (correct), `dall-e-3` stays (correct)
- Verify other provider model IDs are correct for their respective image generation APIs

### Step 3: Route Google requests to native provider
- In `ai-proxy.service.ts`, import `generateViaGoogleAI`
- In `generateDynamic()`, when `providerId === 'google'`, call `generateViaGoogleAI()` instead of `generateViaOpenAICompat()`
- Pass the resolved API key, model, and prompt
- For all other providers (openai, black-forest-labs, bytedance, etc.), keep using `generateViaOpenAICompat()`

### Step 4: Remove mock fallback, show error instead
- In `ai-proxy.service.ts`, change `generateDynamic()`:
  - When `!resolvedKey`, return `{ success: false, error: 'No API key configured for {providerName}. Go to Settings to add your API key.' }` instead of calling `mockGenerate()`
- Delete `mockGenerate()` function and `hashString()` from `openai-image.provider.ts`
- Delete the `mockSdxlGenerate()` and `mockWanxiangGenerate()` functions from `ai-proxy.service.ts`

### Step 5: Update Google endpoint in settings-store
- Change Google's `openaiEndpoint` from `https://generativelanguage.googleapis.com/v1beta/openai` to `https://generativelanguage.googleapis.com/v1beta` — the Google-native provider constructs the full URL itself
- This avoids confusion since it's not actually an "OpenAI endpoint"

### Step 6: Type-check and verify
- `cd app/client && npx tsc --noEmit` — zero new errors
- `cd app/client && npm run build` — build succeeds
- Test with a real Google API key saved via `POST /api/ai/keys`
- Verify generation returns a real base64-encoded AI image
- Verify the image reflects the shot description, style, camera angle, and characters

## Validation Commands
- `cd app/client && npx tsc --noEmit` — Zero new errors
- `cd app/client && npm run build` — Build succeeds
- `curl -s -X POST http://localhost:3001/api/ai/keys -H "Content-Type: application/json" -d '{"provider":"google","apiKey":"YOUR_REAL_KEY"}'` — Save a real Google API key
- `curl -s -X POST http://localhost:3001/api/ai/generate/dynamic/single -H "Content-Type: application/json" -d '{"shotId":"test","prompt":"manga style storyboard, close-up shot, eye-level camera angle, Jane looks anxious, featuring JANE","style":"manga","providerId":"google","providerName":"Google","model":"gemini-3.1-flash-image-preview","endpoint":"https://generativelanguage.googleapis.com/v1beta"}'` — Should return a real base64-encoded PNG image, NOT a picsum URL
- Verify no API key returns error: `curl -s -X POST http://localhost:3001/api/ai/generate/dynamic/single -H "Content-Type: application/json" -d '{"shotId":"test","prompt":"test","style":"manga","providerId":"openai","providerName":"OpenAI","model":"gpt-image-2","endpoint":"https://api.openai.com/v1"}'` — Should return `{ success: false, error: "No API key configured..." }`, NOT a picsum URL

## Notes
- Google's image models as of May 2026: `gemini-3.1-flash-image-preview` (fast, $0.02/img), `gemini-3-pro-image-preview` (pro quality, thinking mode), `gemini-2.5-flash-image` (speed optimized), `imagen-4` and `imagen-4-ultra` (specialized)
- All Google-generated images include a SynthID watermark
- Google supports aspect ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9. Default should be 16:9 for storyboards.
- OpenAI's `/images/generations` endpoint works for OpenAI (`gpt-image-2`, `dall-e-3`) and likely fal/BFL. Only Google needs the native `generateContent` routing.
