# Bug: Storyboard Generation Fails From Dev Origin

## Bug Description
On `http://localhost:5173/project/demo-project/storyboards`, storyboard cards display `Failed to fetch` after generation is attempted. Users expect the generator to reach the local API and either generate images or show a normal provider/API-key error.

## Problem Statement
The frontend development server runs on port `5173`, but the backend CORS allowlist only permits `5175`. Browser requests from `5173` are blocked before the app can receive an API response.

## Solution Statement
Add the standard Vite development origins, `http://localhost:5173` and `http://127.0.0.1:5173`, to the backend CORS allowlist while preserving the existing `5175` origins and `CORS_ORIGIN` override support.

## Steps to Reproduce
1. Start the API with `cd app/server && bun run dev`.
2. Start the frontend with `cd app/client && bun run dev --host`.
3. Open `http://localhost:5173/project/demo-project/storyboards`.
4. Click `Generate Storyboards`.
5. Observe `Failed to fetch` in storyboard cards.

## Root Cause Analysis
The server in `app/server/src/index.ts` enables CORS with an explicit `allowedOrigins` array. It includes only `http://localhost:5175` and `http://127.0.0.1:5175` by default. The current local frontend is served at `http://localhost:5173`, so the browser blocks cross-origin generation requests to the API at `http://127.0.0.1:3011`.

## Relevant Files
- `app/server/src/index.ts` - Defines the API port and CORS allowlist used by all API routes, including storyboard generation.
- `app/client/src/lib/api-client.ts` - Sends frontend API requests to `http://127.0.0.1:3011` by default.
- `app/client/src/components/storyboard/StoryboardGenerator.tsx` - Sends the failing generation request.

### New Files
- `specs/BUG-02-storyboard-generation-cors.md` - Documents this bug and validation path.

## Step by Step Tasks

### Update API CORS allowlist
- Add `http://localhost:5173` and `http://127.0.0.1:5173` to `allowedOrigins` in `app/server/src/index.ts`.

### Restart the API server
- Restart the existing tmux API pane so the new CORS configuration is loaded.

### Run Validation Commands
- Execute the validation commands below and fix any failures.

## Validation Commands
- `cd app/server && bun run type-check` - Type-check the server.
- `cd app/client && bun run type-check` - Type-check the frontend.
- `curl -i -X OPTIONS http://127.0.0.1:3011/api/ai/generate/dynamic/storyboards -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type'` - Verify the API allows the `5173` dev origin.
- Manual verification: use the browser on `http://localhost:5173/project/demo-project/storyboards` and confirm generation no longer fails because of CORS.

## Notes
This fix only addresses the browser network failure. Provider configuration or missing API keys may still produce a normal API error after the request reaches the backend.
