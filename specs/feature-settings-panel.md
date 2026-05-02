# Feature: Settings Panel — Model Provider Configuration

## Feature Description
A settings panel that allows users to configure AI model providers and API keys for Cutline's storyboard generation. The panel opens via a gear icon in the Header and presents a dark-themed, two-panel layout inspired by Claude Code's settings UI: a left panel listing configured providers, and a right panel showing the selected provider's configuration (endpoints, API keys with visibility toggle, model list, and Claude model mapping dropdowns).

Settings are persisted to `localStorage` via Zustand's persist middleware so they survive page reloads and browser restarts.

## User Story
As a filmmaker using Cutline
I want to configure which AI model provider and API key the app uses for storyboard generation
So that I can use my own API keys and choose models that match my budget and quality preferences

## Problem Statement
Cutline has no UI for configuring AI providers or API keys. The `ApiProvider` type is hardcoded to `'sdxl' | 'wanxiang'` and there's no way for users to set endpoints, keys, or model preferences. The `SettingsScreen` in `App.tsx` is a placeholder ("Settings - Coming Soon").

## Solution Statement
Add a settings gear button to the Header that opens a full-screen overlay settings panel. Create a Zustand store for provider configuration (persisted to localStorage). Build a two-panel settings UI matching the app's dark theme where users can add/edit/remove providers, configure endpoints and API keys (with eye-toggle for visibility), manage model lists per provider, and map Claude model tiers (Opus, Sonnet, Haiku) to specific provider models.

## Relevant Files

### Existing Files to Modify
- `app/client/src/components/workspace/Header.tsx` — Add gear/settings button to the right side actions area
- `app/client/src/stores/index.ts` — Export the new settings store
- `app/client/src/types/index.ts` — Expand `ApiProvider` type and add provider config types
- `app/client/src/App.tsx` — Wire up the settings overlay state

### New Files
- `app/client/src/stores/settings-store.ts` — Zustand store for provider configurations (persisted)
- `app/client/src/components/settings/SettingsPanel.tsx` — Full-screen overlay settings panel
- `app/client/src/components/settings/ProviderList.tsx` — Left sub-panel: scrollable list of providers
- `app/client/src/components/settings/ProviderConfig.tsx` — Right sub-panel: edit form for selected provider
- `app/client/src/components/settings/ApiKeyInput.tsx` — Input with masked text and eye-toggle visibility
- `app/client/src/components/settings/ModelList.tsx` — Scrollable list of models with add/remove
- `app/client/src/components/settings/ClaudeModelMapping.tsx` — Collapsible section with dropdowns mapping Claude tiers to provider models
- `app/client/src/components/settings/index.ts` — Barrel export
- `app/client/src/styles/settings.css` — Settings-specific styles

## Implementation Plan

### Phase 1: Foundation — Types & Store
Define the data model for provider configuration and create a persisted Zustand store. This is the foundation everything else builds on.

### Phase 2: Core UI — Settings Panel Components
Build the settings panel as a full-screen overlay with the two-panel layout. Create the provider list, provider config form, API key input, model list, and Claude model mapping components.

### Phase 3: Integration — Header Button & App Wiring
Add the gear button to the Header, wire the open/close state through the UI store, and verify the full flow works.

## Step by Step Tasks

### Step 1: Define Provider Config Types
- In `app/client/src/types/index.ts`, add a `ProviderConfig` interface with fields: `id`, `name`, `enabled`, `anthropicEndpoint`, `openaiEndpoint`, `apiKey`, `models` (string array), `claudeMapping` (record of Claude tier to model name)
- Update `ApiProvider` from a const union to a `string` type (to support arbitrary provider names)
- Add a `ClaudeModelTier` type: `'opus' | 'sonnet' | 'haiku'`

### Step 2: Create Settings Store
- Create `app/client/src/stores/settings-store.ts`
- Use Zustand `create` with `persist` middleware (key: `cutline-settings`)
- State: `providers: ProviderConfig[]`, `activeProviderId: string | null`, `settingsOpen: boolean`
- Actions: `addProvider`, `updateProvider`, `removeProvider`, `setActiveProvider`, `toggleSettings`, `addModel`, `removeModel`, `updateClaudeMapping`
- Seed with one default provider (e.g. "Z.AI" with empty fields) if no providers exist

### Step 3: Export Store
- In `app/client/src/stores/index.ts`, add export for `useSettingsStore`

### Step 4: Create API Key Input Component
- Create `app/client/src/components/settings/ApiKeyInput.tsx`
- Controlled input with `type="password"` by default
- Eye icon button toggles between `password` and `text`
- Use inline styles with CSS custom properties matching the app's dark theme
- Props: `value`, `onChange`, `placeholder?`

### Step 5: Create Model List Component
- Create `app/client/src/components/settings/ModelList.tsx`
- Scrollable list of model name strings
- Each item has an edit icon and delete icon
- "Add model" button at bottom opens an inline text input
- Props: `models: string[]`, `onAdd`, `onRemove`

### Step 6: Create Claude Model Mapping Component
- Create `app/client/src/components/settings/ClaudeModelMapping.tsx`
- Collapsible section with chevron toggle
- Three dropdown selects for Opus, Sonnet, Haiku
- Each dropdown's options come from the provider's model list
- Props: `models: string[]`, `mapping: Record<ClaudeModelTier, string>`, `onChange`

### Step 7: Create Provider Config Component
- Create `app/client/src/components/settings/ProviderConfig.tsx`
- Right sub-panel showing the selected provider's configuration
- Header: provider name, enabled badge (green), edit/disable buttons
- Form sections: Anthropic Endpoint, OpenAI Endpoint, API Key (ApiKeyInput), Model List (ModelList), Claude Model Mapping (ClaudeModelMapping)
- Props: `provider: ProviderConfig`, `onUpdate`

### Step 8: Create Provider List Component
- Create `app/client/src/components/settings/ProviderList.tsx`
- Left sub-panel with scrollable provider list
- Each provider shows: name, status dot (green=enabled, gray=disabled)
- Selected provider has blue border/accent background
- "Add Provider" button at bottom
- Props: `providers: ProviderConfig[]`, `activeId: string | null`, `onSelect`, `onAdd`

### Step 9: Create Settings Panel Component
- Create `app/client/src/components/settings/SettingsPanel.tsx`
- Full-screen overlay (position: fixed, z-index: modal) with dark backdrop
- Header: "Settings" title + close (X) button
- Two-column grid layout: ProviderList (280px) | ProviderConfig (1fr)
- Reads/writes from `useSettingsStore`
- Animated entrance (fadeIn + slideUp)
- Props: none (reads from store)

### Step 10: Create Barrel Export
- Create `app/client/src/components/settings/index.ts`
- Export `SettingsPanel` and all sub-components

### Step 11: Add Settings CSS
- Create `app/client/src/styles/settings.css`
- Import in `SettingsPanel.tsx`
- Styles for the overlay, two-panel grid, provider items, config form sections
- All colors/borders/spacing from existing CSS custom properties

### Step 12: Add Gear Button to Header
- In `Header.tsx`, add a gear/settings SVG icon button to the right side area (before the export button)
- On click, call `useSettingsStore().toggleSettings()`

### Step 13: Wire Settings Panel in App
- In `App.tsx`, import `SettingsPanel` and `useSettingsStore`
- Render `<SettingsPanel />` at the root level (outside Routes) so it overlays everything
- The panel reads `settingsOpen` from the store and conditionally renders

### Step 14: Validate
- Run `cd app/client && npx tsc --noEmit` — zero type errors
- Run `cd app/client && npm run build` — successful production build
- Start the dev server, click the gear icon, verify settings panel opens/closes
- Add a provider, enter API key, toggle visibility, add/remove models
- Reload the page — settings should persist from localStorage

## Testing Strategy

### Unit Tests
- Settings store: test add/remove/update provider, model CRUD, Claude mapping updates, persistence
- ApiKeyInput: test visibility toggle, value changes
- ModelList: test add/remove model items

### Integration Tests
- Settings panel opens from Header gear button
- Provider list selection updates the config panel
- Settings persist after page reload

### Edge Cases
- No providers configured (shows empty state with "Add Provider" prompt)
- Provider with empty model list (Claude mapping dropdowns show "No models available")
- API key field preserves value when toggling visibility
- Adding a provider with a duplicate name (prevent or auto-suffix)
- Very long provider/model names (truncate with ellipsis)

## Acceptance Criteria
1. A gear icon appears in the Header next to the Export button
2. Clicking the gear opens a full-screen dark-themed settings overlay
3. Settings overlay has a two-panel layout: provider list (left) and provider config (right)
4. Users can add, edit, and remove providers
5. Each provider has fields for: name, anthropic endpoint, openai endpoint, API key, model list, Claude model mapping
6. API key input has a visibility toggle (eye icon)
7. Model list supports adding and removing model names
8. Claude model mapping maps Opus/Sonnet/Haiku tiers to provider models via dropdowns
9. All settings persist to localStorage and survive page reload
10. Close button (X) and clicking outside dismisses the settings panel
11. TypeScript compiles with zero errors
12. Production build succeeds

## Validation Commands
- `cd app/client && npx tsc --noEmit` — Zero type errors
- `cd app/client && npm run build` — Successful production build
- `cd app/client && npm run dev` — Start dev server, manually verify gear button and settings panel in browser

## Notes
- The settings panel uses the app's existing dark theme CSS custom properties — no new color tokens needed
- API keys are stored in localStorage (client-side only). This is acceptable for a local/personal tool but should be documented as a limitation. Future work could use the backend for encrypted storage.
- The provider config is client-side only — no backend API changes are needed for this feature
- The `ApiProvider` type currently hardcodes `'sdxl' | 'wanxiang'` — this will be widened to `string` to support arbitrary provider names while keeping backward compatibility for existing code
- The settings panel is rendered at the App root level (outside Routes) so it can be opened from any screen
