import { useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { SceneWorkspace, Header, FormatBar, LeftSidebar, RightPanel } from '@/components/workspace';
import { ScriptEditor } from '@/components/script';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ProjectListScreen />} />
      <Route path="/project/:projectId/*" element={<ProjectWorkspace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

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
          marginBottom: 'var(--space-8)',
        }}
      >
        Phase 1 MVP - Foundation Infrastructure Complete
      </p>
      <a
        href="/project/demo-project/scene/demo-scene/shots"
        style={{
          padding: 'var(--space-3) var(--space-6)',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
        }}
      >
        Open Demo Project
      </a>
    </div>
  );
}

function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const [viewMode, setViewMode] = useState<'script' | 'shots' | 'storyboards' | 'breakdown'>('script');
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [content, setContent] = useState(`INT. COFFEE SHOP - DAY

A cozy corner coffee shop. Rain patters against the window.

JANE sits alone at a corner table, nursing a cup of coffee.

She looks anxious, checking her watch.

                    JANE
              (sighing)
              I've been waiting for hours.

                    MARK enters, shaking off his wet umbrella. He spots Jane and approaches.

                    MARK
              (surprised)
              Jane! You's actually here?

                    JANE
              (standing)
              Mark! I'm so glad to see you.

                    MARK
              (smiling)
              I know, right? Let me show you the new coffee machine.

                    JANE
              (relieved)
              Finally.`);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = (newContent: string) => {
    setContent(newContent);
    setIsDirty(false);
  };

  const handleFormat = (type: string) => {
    console.log('Format:', type);
  };

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as 'script' | 'shots' | 'storyboards' | 'breakdown');
  };

  return (
    <div style={workspaceStyles}>
      {/* Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Main Three-Panel Grid */}
      <div style={editorContainerStyles}>
        {/* Left Sidebar */}
        <LeftSidebar
          projectId={projectId}
          currentSceneId={null}
          onSceneSelect={(id) => {
            window.location.href = `/project/${projectId}/scene/${id}`;
          }}
        />

        {/* Main Content */}
        <div style={mainContentStyles}>
          {/* Editor Area */}
          <div style={editorAreaStyles}>
            <ScriptEditor
              initialContent={content}
              onChange={setContent}
              onSave={handleSave}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <RightPanel
          selectedShot={null}
          selectedStoryboard={null}
          currentScene={null}
          sceneId=""
        />
      </div>

      {/* Format Bar */}
      <FormatBar
        onFormat={handleFormat}
      />
    </div>
  );
}

function ScriptBreakdownScreen() {
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      Script Breakdown - Coming Soon
    </div>
  );
}

function SettingsScreen() {
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      Settings - Coming Soon
    </div>
  );
}

// Styles for ProjectWorkspace
const workspaceStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  background: 'var(--bg-primary)',
};

// Three-panel grid layout (matching mockup.html)
const editorContainerStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '240px 1fr 200px',
  gridTemplateRows: '1fr',
  height: 'calc(100vh - var(--header-height) - var(--format-bar-height))',
  overflow: 'hidden',
};

const mainContentStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  background: 'var(--bg-primary)',
};

const editorAreaStyles: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: 'var(--space-4)',
};

export default App;
