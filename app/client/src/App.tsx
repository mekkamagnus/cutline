import { useState, useMemo } from 'react';
import { Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import { SceneWorkspace, Header, FormatBar, LeftSidebar, RightPanel, BottomNav, MobileTopBar, MobileFormatBar, SceneSlidePanel } from '@/components/workspace';
import { ScriptEditor } from '@/components/script';
import { ShotListEditor } from '@/components/shot-list';
import { StoryboardScreen } from '@/components/storyboard';
import { useBreakpoint } from '@/hooks';
import { useUIStore } from '@/stores';
import { fountainParser } from '@/services/fountain-parser';
import { generateShotsFromScene } from '@/services/shot-generator';
import { Result } from '@/lib/fp';
import type { Scene, Shot } from '@/types';
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
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
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
              Finally.

INT. CITY STREET - CONTINUOUS

Rain hammers the pavement. Jane rushes out of the coffee shop, pulling her coat tight.

MARK runs after her, nearly colliding with a passerby.

                    MARK
              (calling out)
              Jane, wait!

JANE stops but doesn't turn around. Cars hiss through puddles.

                    JANE
              (quietly)
              I can't do this anymore, Mark.

                    MARK
              (breathless)
              Do what? I just got here.

                    JANE
              (turning to face him)
              Exactly. You just got here. Two hours late.

EXT. PARK BENCH - NIGHT

The rain has stopped. A single streetlight casts a warm glow.

JANE sits on the wet bench, arms wrapped around herself. MARK approaches cautiously and sits beside her. A long silence.

                    MARK
              (gently)
              I'm sorry. I really am.

                    JANE
              (staring ahead)
              Sorry doesn't fix it.

                    MARK
              (reaching into his coat)
              I brought something. Something I should have given you a long time ago.

He pulls out a worn envelope. Jane stares at it.

                    JANE
              (whispering)
              Is that...?

INT. TRAIN STATION - NIGHT

A nearly empty platform. Fluorescent lights buzz overhead. A departures board flickers.

JANE paces near the edge of the platform. MARK sits on a bench, watching her.

                    MARK
              The last train leaves in ten minutes.

                    JANE
              (checking her phone)
              I know.

                    MARK
              Are you going to take it?

                    JANE
              (meeting his eyes)
              I don't know yet.

A TRAIN CONDUCTOR walks past, checking his watch.

                    CONDUCTOR
              Last call for the midnight express. All aboard.

JANE looks at the train. Looks at Mark. The train doors open with a hiss.

EXT. TRAIN STATION ENTRANCE - DAWN

First light breaks over the city. The station is quiet now. A discarded coffee cup rolls across the empty platform.

JANE stands outside, a ticket in her hand. MARK emerges from the station entrance, his coat over his arm.

They face each other. Neither speaks for a long moment.

                    MARK
              (simply)
              You stayed.

                    JANE
              (small smile)
              Yeah. I stayed.

                    MARK
              (offering his hand)
              Let's start over. Properly this time.

JANE looks at his hand. Takes it. They walk together toward the sunrise.

CUT TO BLACK.`);
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

  const allGeneratedShots = useMemo<Shot[]>(() => {
    const result = fountainParser.parse(content);
    if (!Result.isOk(result) || result.right.scenes.length === 0) return [];
    return result.right.scenes.flatMap((scene) => generateShotsFromScene(scene));
  }, [content]);

  const currentSceneId = selectedSceneId ?? parsedScenes[0]?.id ?? null;

  const generatedShots = useMemo<Shot[]>(() => {
    if (!currentSceneId) return allGeneratedShots;
    return allGeneratedShots.filter((s) => s.sceneId === currentSceneId);
  }, [allGeneratedShots, currentSceneId]);

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
            sceneId={currentSceneId ?? 'demo-scene'}
            selectedShotId={selectedShotId ?? undefined}
            onShotSelect={(shot) => setSelectedShotId(shot.id)}
            initialShots={generatedShots}
          />
        );
      case 'storyboards':
        return (
          <StoryboardScreen
            sceneId={currentSceneId ?? 'demo-scene'}
            initialShots={generatedShots}
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
            currentSceneId={currentSceneId}
            scenes={parsedScenes}
            onSceneSelect={(id) => {
              setSelectedSceneId(id);
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
                  initialShots={generatedShots}
                />
              </div>
            )}
            {viewMode === 'storyboards' && (
              <div style={{ padding: 'var(--space-4)' }}>
                <StoryboardScreen
                  sceneId={currentSceneId ?? 'demo-scene'}
                  initialShots={generatedShots}
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
