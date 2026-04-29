# Bug: Navbar Links Don't Switch Views

## Bug Description
Clicking the Script/Shots/Storyboards/Breakdown tabs in the desktop Header does nothing visible — the view doesn't change. On the production site, deep links like `/project/demo-project/shots` render the script view instead of the shots view. The URL changes but the content stays the same.

The previous fix (commit `3f15522`) replaced `NavLink` with `<button>` elements to prevent URL navigation from resetting state. However, the buttons only update local `useState` — they don't update the URL, so deep links and browser back/forward don't work. Meanwhile, the `ProjectListScreen` "Open Demo Project" link still points to `/project/demo-project/scene/demo-scene/shots` which doesn't match any route that reads the view from the URL.

## Problem Statement
`ProjectWorkspace` manages view mode via `useState('script')` — always initializing to `'script'` regardless of the URL path. The Header buttons call `onViewModeChange` which updates state, but:
1. On page load / deep link, the URL segment (e.g. `/shots`) is never read to set the initial view mode
2. Button clicks update React state but don't update the URL, so refreshing the page loses the view selection
3. The "Open Demo Project" link uses a legacy route (`/project/demo-project/scene/demo-scene/shots`) that doesn't match the current routing pattern

## Solution Statement
Make view mode URL-driven:
1. Add nested routes under `/project/:projectId/*` for `script`, `shots`, `storyboards`, `breakdown`
2. Derive the initial `viewMode` from the current URL using `useLocation()` or nested `<Route>` components
3. Update Header buttons to use `useNavigate()` to change the URL, which React Router handles
4. Fix the "Open Demo Project" link to point to `/project/demo-project/script`

## Steps to Reproduce
1. Visit https://cutline.mekaelturner.com/project/demo-project/script
2. Click "Shots" tab in the top header
3. Observe: nothing happens (button click fires but view may not visibly change, or state resets)
4. Visit https://cutline.mekaelturner.com/project/demo-project/shots directly
5. Observe: shows the script editor instead of the shots view

## Root Cause Analysis
`ProjectWorkspace` uses `useState('script')` for `viewMode`, which always initializes to `'script'` on mount/remount. The URL is never consulted. React Router's route pattern `/project/:projectId/*` catches all sub-paths but ignores the `*` segment entirely. When a user navigates to `/project/demo-project/shots`, the component mounts with `viewMode = 'script'` and never reads `shots` from the URL.

## Relevant Files
Use these files to fix the bug:

- `app/client/src/App.tsx` — Contains routing (`<Routes>`), `ProjectWorkspace` component with `useState` for viewMode, and `ProjectListScreen` with the "Open Demo Project" link. All three issues are here.
- `app/client/src/components/workspace/Header.tsx` — Header with nav buttons. Needs to update URL via `useNavigate` instead of just calling a callback.

## Step by Step Tasks

### Add URL-driven view mode to ProjectWorkspace
- Import `useLocation`, `useNavigate` from `react-router-dom`
- Derive `viewMode` from `location.pathname` instead of `useState`:
  ```
  const location = useLocation();
  const viewMode = deriveViewMode(location.pathname);
  ```
- Create helper `deriveViewMode` that maps URL suffix (`/script`, `/shots`, `/storyboards`, `/breakdown`) to the view mode string, defaulting to `'script'`

### Update Header to navigate via URL
- Import `useNavigate` and `useParams` from `react-router-dom`
- On tab click, call `navigate(\`/project/${projectId}/${tab.id}\`)` to update the URL
- Remove the `onViewModeChange` prop (no longer needed — view mode comes from URL)
- Keep the `viewMode` prop for active styling, but derive it from the current URL via `useLocation`

### Fix the "Open Demo Project" link
- Change the `href` from `/project/demo-project/scene/demo-scene/shots` to `/project/demo-project/script`

### Clean up unused state
- Remove `const [viewMode, setViewMode] = useState(...)` from `ProjectWorkspace`
- Remove `handleViewModeChange` handler
- Pass `viewMode` derived from URL to Header and other components

## Validation Commands
- `cd app/client && npx vite build` — Build succeeds (vite transpiles without issue)
- Visual verification: start the app, click each nav tab, confirm view switches; refresh page on `/project/demo-project/shots` and confirm shots view persists

## Notes
- The previous fix (commit `3f15522`) changed NavLinks to buttons to prevent remount state loss. This fix goes further by making the URL the source of truth, which solves both the deep-link problem and the state-reset problem.
- No new libraries needed — `react-router-dom` is already installed and imported.
- The `BrowserRouter` in `main.tsx` already handles client-side routing. For production, nginx needs `try_files $uri /index.html` to support deep links — this should already be configured since the SPA is deployed.
