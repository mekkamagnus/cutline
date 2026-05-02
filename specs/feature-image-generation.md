# Feature: Image Generation with Model Selection

## Feature Description
Enable storyboard image generation using configurable AI image models from multiple providers (Google, OpenAI, Black Forest Labs, etc.). Users select a model in the StoryboardGenerator's visual style section when generating storyboards. The system uses the provider configuration from the Settings panel (API keys, endpoints, models) to route generation requests to the correct provider. Defaults to Google Gemini Flash 3.x.

## User Story
As a filmmaker
I want to select which AI model generates my storyboard images
So that I can control quality, style, and cost based on my project's needs

## Problem Statement
The current storyboard generation is hardcoded to two providers (SDXL/WanXiang) with static provider options. The Settings panel already configures 8+ providers with models and API keys, but the StoryboardGenerator and RefinementPanel don't use this configuration. There is no way to choose which model generates images.

## Solution Statement
Wire the existing provider/model configuration from the settings store into the storyboard generation flow. Replace the hardcoded `sdxl`/`wanxiang` provider options with a dynamic model selector populated from enabled providers. The generation request sends the selected provider + model to a new server endpoint that routes to the correct API (OpenAI-compatible `/images/generations` for most providers). Default to Google `gemini-3.1-flash`.

## Relevant Files

### Existing Files to Modify
- `app/client/src/components/storyboard/StoryboardGenerator.tsx` — Replace hardcoded style selector with model selector from settings store; add provider dropdown
- `app/client/src/components/storyboard/RefinementPanel.tsx` — Replace hardcoded `sdxl`/`wanxiang` provider options with dynamic model selector from settings store
- `app/client/src/stores/settings-store.ts` — Add helper to get all available models from enabled providers
- `app/server/src/routes/ai.ts` — Add new endpoint accepting `provider` as string + `model` string instead of hardcoded union type; route to OpenAI-compatible API
- `app/server/src/services/ai-proxy.service.ts` — Add generic OpenAI-compatible image generation function; support dynamic provider config from request body
- `app/client/src/types/index.ts` — Update `ApiProvider` type from `'sdxl' | 'wanxiang'` to `string`; update `StoryboardPanel` to store provider+model
- `app/client/src/lib/api-client.ts` — Update response types to include `model` field

### New Files
- `app/server/src/services/openai-image.provider.ts` — Generic OpenAI-compatible `/images/generations` client that works with any provider endpoint (Google, OpenAI, BFL via fal, etc.)

## Implementation Plan

### Phase 1: Foundation — Generic OpenAI-Compatible Image Provider
Create a reusable server-side client that calls the OpenAI `/v1/images/generations` endpoint format. Most image providers (Google, OpenAI, Black Forest Labs/fal, ByteDance, Alibaba) support this format. This replaces the hardcoded SDXL/WanXiang implementations.

### Phase 2: Dynamic Model Selection UI
Wire the settings store's provider/model data into the StoryboardGenerator and RefinementPanel. Show a provider dropdown + model dropdown (or combined "Provider: Model" selector) populated from enabled providers. Default to Google's `gemini-3.1-flash`.

### Phase 3: Server-Side Routing
Update the AI routes to accept a generic `provider` (string) and `model` (string) in the request body, along with the provider's endpoint URL and API key from the client-side settings. The server proxies the request to the correct provider using the OpenAI-compatible format.

## Step by Step Tasks

### Step 1: Create generic OpenAI-compatible image provider
- Create `app/server/src/services/openai-image.provider.ts`
- Implement `generateImage(params)` that calls `POST {endpoint}/images/generations` with `{ model, prompt, size, n: 1 }`
- Parse response to extract `data[0].url` or `data[0].b64_json`
- Return `{ url, cost }` result
- Support both URL and base64 response formats

### Step 2: Update AI proxy service
- In `app/server/src/services/ai-proxy.service.ts`, add `OpenAICompatibleProvider` type that takes endpoint + apiKey from the request
- Add `generateViaOpenAICompat(userId, provider, model, endpoint, apiKey, params)` method
- Keep existing SDXL/WanXiang mocks as fallback for development
- New method: client sends provider config (endpoint, apiKey, model) → server proxies to provider

### Step 3: Update AI routes for dynamic providers
- In `app/server/src/routes/ai.ts`, update body validation:
  - `provider` becomes `string` (not `'sdxl' | 'wanxiang'`)
  - Add `model: string` to request body
  - Add `endpoint: string` and `apiKey: string` (server validates but these come from client settings)
- Route `/api/ai/generate/storyboards` and `/api/ai/generate/single` use the new generic provider
- Response includes `model` alongside existing fields

### Step 4: Add settings store helper for available models
- In `app/client/src/stores/settings-store.ts`, add computed getter:
  ```ts
  getAvailableModels: () => Array<{ providerId: string; providerName: string; modelId: string; pricePerImage?: number }>
  ```
  Returns flat list of models from all enabled providers

### Step 5: Update StoryboardGenerator with model selector
- Import `useSettingsStore` in `StoryboardGenerator.tsx`
- Replace hardcoded `STORYBOARD_STYLES` style selector with:
  - Provider dropdown (from enabled providers)
  - Model dropdown (filtered by selected provider)
- Default provider: `google`, default model: `gemini-3.1-flash`
- Pass `provider`, `model`, `endpoint`, `apiKey` in generation request
- Update estimated cost calculation to use model's `pricePerImage`

### Step 6: Update RefinementPanel with model selector
- Import `useSettingsStore` in `RefinementPanel.tsx`
- Replace hardcoded `PROVIDER_OPTIONS` with dynamic provider/model from settings
- Default to Google `gemini-3.1-flash`
- Pass selected provider config in refinement request

### Step 7: Update types
- In `app/client/src/types/index.ts`, change `ApiProvider` from const union to `string`
- Update `StoryboardPanel` to include `model?: string` field
- Update `GenerationParams` if needed

### Step 8: Update API client types
- In `app/client/src/lib/api-client.ts`, update `GenerateSingleResponse` and `GenerateStoryboardsResponse` to include `model: string`

### Step 9: Browser verification
- Start dev server with `bun run dev` in `app/server` and `npm run dev` in `app/client`
- Open app in Playwright
- Verify StoryboardGenerator shows provider/model dropdowns
- Verify Google is default provider with gemini-3.1-flash selected
- Verify cost estimate updates when switching models
- Verify RefinementPanel shows same provider/model options

### Step 10: Type-check and validate
- Run `cd app/client && npx tsc --noEmit` — zero new errors
- Run `cd app/client && npm run build` — build succeeds

## Testing Strategy

### Unit Tests
- OpenAI-compatible provider: test request formatting, response parsing for URL and base64 formats
- Settings store: test `getAvailableModels` returns correct flat list from enabled providers

### Integration Tests
- Generation flow: provider config from settings → API request → server proxy → mock response
- Verify model selector UI populates from settings store

### Edge Cases
- Provider with no models configured
- All providers disabled
- API key missing for selected provider
- Provider endpoint returns error
- Base64 response instead of URL
- Default selection when Google provider is missing

## Acceptance Criteria
1. StoryboardGenerator shows a provider dropdown populated from enabled providers in Settings
2. StoryboardGenerator shows a model dropdown filtered by the selected provider
3. Default selection is Google provider with `gemini-3.1-flash` model
4. RefinementPanel has matching provider/model selectors with same defaults
5. Estimated cost uses the selected model's `pricePerImage` from settings
6. Generation request sends provider ID, model ID, endpoint, and API key to server
7. Server proxies request to the correct provider using OpenAI-compatible API format
8. Existing SDXL/WanXiang mock implementations still work for development
9. Type-check passes with zero new errors
10. Build succeeds

## Validation Commands
- `cd app/client && npx tsc --noEmit` — Zero type errors
- `cd app/client && npm run build` — Build succeeds
- `cd app/server && bun run dev` — Server starts without errors
- `playwright-cli open http://localhost:5173` → navigate to storyboards → verify model selector renders
- `playwright-cli snapshot` → verify Google/gemini-3.1-flash is default selection in StoryboardGenerator

## Notes
- Most providers (Google, OpenAI, Black Forest Labs via fal, ByteDance, Alibaba, Tencent, Kuaishou) expose an OpenAI-compatible `/images/generations` endpoint. The server-side proxy uses this standard format.
- The Z.AI provider has a Claude-compatible (Anthropic) endpoint, which is different from image generation. The `claudeMapping` field in provider config is for text model mapping, not image generation. Z.AI's image models (if any) would use the `openaiEndpoint`.
- API keys are currently sent from client settings to the server per-request. For production, keys should be stored server-side (encrypted) and looked up by provider ID. The current approach works for development.
- The existing `STORYBOARD_STYLES` (pencil-sketch, ink-drawing, etc.) are prompt modifiers, not separate generation backends. These should be kept as a "Style" dropdown alongside the new "Model" selector — they modify the prompt, not the provider.
