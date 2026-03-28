import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ProjectListScreen />} />
      <Route path="/project/:projectId" element={<ProjectWorkspace />}>
        <Route index element={<Navigate to="script" replace />} />
        <Route path="script" element={<ScriptEditorScreen />} />
        <Route path="breakdown" element={<ScriptBreakdownScreen />} />
        <Route path="scene/:sceneId/shots" element={<ShotListEditorScreen />} />
        <Route
          path="scene/:sceneId/storyboards"
          element={<StoryboardViewScreen />}
        />
        <Route path="settings" element={<SettingsScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Placeholder components - to be implemented in later sprints
function ProjectListScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--space-8)',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-4)',
        }}
      >
        Cutline
      </h1>
      <p
        style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-8)',
        }}
      >
        Script to video platform for filmmakers
      </p>
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-muted)',
        }}
      >
        Phase 1 MVP - Foundation Infrastructure Complete
      </p>
    </div>
  );
}

function ProjectWorkspace() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        Project Workspace
      </div>
      <div style={{ flex: 1, display: 'flex' }}>
        <Routes>
          <Route
            index
            element={<Navigate to="script" replace />}
          />
          <Route path="*" element={null} />
        </Routes>
      </div>
    </div>
  );
}

function ScriptEditorScreen() {
  return (
    <div style={{ padding: 'var(--space-4)' }}>Script Editor - Coming Soon</div>
  );
}

function ScriptBreakdownScreen() {
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      Script Breakdown - Coming Soon
    </div>
  );
}

function ShotListEditorScreen() {
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      Shot List Editor - Coming Soon
    </div>
  );
}

function StoryboardViewScreen() {
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      Storyboard View - Coming Soon
    </div>
  );
}

function SettingsScreen() {
  return (
    <div style={{ padding: 'var(--space-4)' }}>Settings - Coming Soon</div>
  );
}

export default App;
