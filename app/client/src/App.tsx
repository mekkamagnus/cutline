import { useState, useMemo } from 'react';
import { Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import { SceneWorkspace, Header, FormatBar, LeftSidebar, RightPanel, BottomNav, MobileTopBar, MobileFormatBar, SceneSlidePanel } from '@/components/workspace';
import { ScriptEditor } from '@/components/script';
import { ShotListEditor } from '@/components/shot-list';
import { StoryboardStrip } from '@/components/storyboard';
import { useBreakpoint } from '@/hooks';
import { useUIStore } from '@/stores';
import { fountainParser } from '@/services/fountain-parser';
import { Result } from '@/lib/fp';
import type { Scene } from '@/types';
import type { MobileView } from '@/components/workspace';

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
  const { isMobile } = useBreakpoint();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: isMobile ? 'var(--space-4)' : 'var(--space-8)',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: isMobile ? 'var(--font-size-2xl)' : 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-4)',
        }}
      >
        Cutline
      </h1>
      <p
        style={{
          fontSize: isMobile ? 'var(--font-size-base)' : 'var(--font-size-lg)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-8)',
          padding: isMobile ? '0 var(--space-4)' : undefined,
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
        href="/project/demo-project/script"
        style={{
          padding: isMobile ? 'var(--space-4) var(--space-6)' : 'var(--space-3) var(--space-6)',
          backgroundColor: 'var(--accent)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontSize: isMobile ? 'var(--font-size-base)' : 'var(--font-size-sm)',
          minHeight: isMobile ? '44px' : undefined,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        Open Demo Project
      </a>
    </div>
  );
}

type ViewMode = 'script' | 'shots' | 'storyboards' | 'breakdown';

function deriveViewMode(pathname: string, projectId: string): ViewMode {
  const prefix = `/project/${projectId}/`;
  const suffix = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
  const segment = suffix.split('/')[0];
  if (segment === 'shots' || segment === 'storyboards' || segment === 'breakdown') return segment;
  return 'script';
}

function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const viewMode = deriveViewMode(location.pathname, projectId ?? '');
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
  const { isMobile } = useBreakpoint();

  const parsedScenes = useMemo<Scene[]>(() => {
    const result = fountainParser.parse(content);
    if (!Result.isOk(result)) return [];
    return result.right.scenes.map((s, i) => ({
      id: s.id,
      scriptId: projectId ?? 'demo-project',
      heading: s.heading,
      location: s.location,
      interior: s.interior,
      timeOfDay: s.timeOfDay,
      order: i + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }, [content, projectId]);

  const handleSave = (newContent: string) => {
    setContent(newContent);
    setIsDirty(false);
  };

  const handleFormat = (type: string) => {
    console.log('Format:', type);
  };

  const handleNavigate = (mode: string) => {
    navigate(`/project/${projectId}/${mode}`);
  };

  // Render content based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'script':
        return (
          <ScriptEditor
            initialContent={content}
            onChange={setContent}
            onSave={handleSave}
          />
        );
      case 'shots':
        return (
          <ShotListEditor
            sceneId="demo-scene"
            selectedShotId={selectedShotId ?? undefined}
            onShotSelect={(shot) => setSelectedShotId(shot.id)}
          />
        );
      case 'storyboards':
        return (
          <StoryboardStrip
            storyboards={[]}
            shots={[]}
            selectedPanelId={null}
            onPanelSelect={() => {}}
          />
        );
      case 'breakdown':
        return <ScriptBreakdownScreen />;
      default:
        return (
          <ScriptEditor
            initialContent={content}
            onChange={setContent}
            onSave={handleSave}
          />
        );
    }
  };

  return (
    <div className={`workspace-layout ${isMobile ? 'workspace-layout--mobile' : 'workspace-layout--desktop'}`}>
      {/* Header - desktop only */}
      {!isMobile && (
        <Header
          viewMode={viewMode}
          onNavigate={handleNavigate}
        />
      )}

      {/* Main Three-Panel Grid - desktop only */}
      {!isMobile ? (
        <div style={editorContainerStyles}>
          {/* Left Sidebar */}
          <LeftSidebar
            projectId={projectId}
            currentSceneId={null}
            scenes={parsedScenes}
            onSceneSelect={(id) => {
              window.location.href = `/project/${projectId}/scene/${id}`;
            }}
          />

          {/* Main Content */}
          <div style={mainContentStyles}>
            {/* Editor Area - NOW switches based on viewMode */}
            <div style={editorAreaStyles}>
              {renderContent()}
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
      ) : (
        /* Mobile single-column layout */
        <>
          {/* Mobile Top Bar */}
          <MobileTopBar
            title="The Last Train"
            currentScene={1}
            totalScenes={12}
          />

          {/* Main Content - NOW switches based on viewMode */}
          <div className="mobile-content">
            {viewMode === 'script' && (
              <div className="mobile-script-page">
                <ScriptEditor
                  initialContent={content}
                  onChange={setContent}
                  onSave={handleSave}
                />
              </div>
            )}
            {viewMode === 'shots' && (
              <div style={{ padding: 'var(--space-4)' }}>
                <ShotListEditor
                  sceneId="demo-scene"
                  selectedShotId={selectedShotId ?? undefined}
                  onShotSelect={(shot) => setSelectedShotId(shot.id)}
                />
              </div>
            )}
            {viewMode === 'storyboards' && (
              <div style={{ padding: 'var(--space-4)' }}>
                <StoryboardStrip
                  storyboards={[]}
                  shots={[]}
                  selectedPanelId={null}
                  onPanelSelect={() => {}}
                />
              </div>
            )}
            {viewMode === 'breakdown' && <ScriptBreakdownScreen />}
          </div>

          {/* Mobile Format Bar - only show for script view */}
          {viewMode === 'script' && (
            <MobileFormatBar
              onFormat={handleFormat}
            />
          )}

          {/* Bottom Navigation */}
          <BottomNav
            activeView={viewMode as MobileView}
            onViewChange={(v) => navigate(`/project/${projectId}/${v}`)}
          />
        </>
      )}

      {/* Format Bar - desktop only */}
      {!isMobile && (
        <FormatBar
          onFormat={handleFormat}
        />
      )}
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

// Styles for ProjectWorkspace desktop
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
