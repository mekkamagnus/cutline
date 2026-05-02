import { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Header, FormatBar, LeftSidebar, RightPanel, BottomNav, MobileTopBar, MobileFormatBar, SceneSlidePanel } from '@/components/workspace';
import { ScriptEditor } from '@/components/script';
import { ShotListEditor } from '@/components/shot-list';
import { StoryboardScreen } from '@/components/storyboard';
import { MobileShell } from '@/components/mobile/MobileShell';
import { MobileBreakdownScreen } from '@/components/mobile/MobileBreakdownScreen';
import { MobileShotCards } from '@/components/mobile/MobileShotCards';
import { MobileStoryboardView } from '@/components/mobile/MobileStoryboardView';
import { MobileCharacterPanel } from '@/components/mobile/MobileCharacterPanel';
import { MobileSceneCards } from '@/components/mobile/MobileSceneCards';
import { MobileNotesScreen } from '@/components/mobile/MobileNotesScreen';
import { MobileSettingsScreen } from '@/components/mobile/MobileSettingsScreen';
import { MobileProjectList } from '@/components/mobile/MobileProjectList';
import { MobileAISuggestions } from '@/components/mobile/MobileAISuggestions';
import { useBreakpoint } from '@/hooks';
import { useUIStore, useSettingsStore } from '@/stores';
import { SettingsPanel } from '@/components/settings';
import { fountainParser } from '@/services/fountain-parser';
import { generateShotsFromScene } from '@/services/shot-generator';
import { Result } from '@/lib/fp';
import type { Scene, Shot } from '@/types';
import type { MobileView } from '@/components/workspace';
import type { MobileSubView } from '@/stores/ui-store';

function App() {
  const refreshApiKeyStatus = useSettingsStore((s) => s.refreshApiKeyStatus);

  useEffect(() => {
    refreshApiKeyStatus();
  }, [refreshApiKeyStatus]);

  return (
    <>
      <Routes>
        <Route path="/" element={<ProjectListScreen />} />
        <Route path="/project/:projectId/*" element={<ProjectWorkspace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SettingsPanel />
    </>
  );
}

function ProjectListScreen() {
  const { isMobile } = useBreakpoint();

  if (isMobile) {
    return (
      <MobileShell
        topBar={
          <div className="mobile-sub-top-bar">
            <div style={{ width: 44 }} />
            <span className="mobile-sub-top-bar__title">My Projects</span>
            <button type="button" className="mobile-sub-top-bar__action" aria-label="More options">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        }
      >
        <MobileProjectList />
      </MobileShell>
    );
  }

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
        href="/project/demo-project/script"
        style={{
          padding: 'var(--space-3) var(--space-6)',
          backgroundColor: 'var(--accent)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontSize: 'var(--font-size-sm)',
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
  const { isMobile } = useBreakpoint();
  const mobileSubView = useUIStore((s) => s.mobileSubView);
  const focusMode = useUIStore((s) => s.focusMode);

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

  // Render mobile sub-screen overlay
  const renderMobileSubScreen = () => {
    const subScreenConfig: Record<Exclude<MobileSubView, null>, { title: string; component: React.ReactNode }> = {
      characters: { title: 'Characters', component: <MobileCharacterPanel /> },
      notes: { title: 'Notes', component: <MobileNotesScreen /> },
      settings: { title: 'Settings', component: <MobileSettingsScreen /> },
      'scene-cards': { title: 'Scene Cards', component: <MobileSceneCards scenes={parsedScenes} /> },
      'ai-suggestions': { title: 'AI Suggestions', component: <MobileAISuggestions /> },
    };

    const config = mobileSubView ? subScreenConfig[mobileSubView] : null;
    if (!config) return null;

    return (
      <div className="mobile-sub-screen">
        <MobileTopBar variant="sub" title={config.title} />
        <div className="mobile-shell__content">{config.component}</div>
      </div>
    );
  };

  // ==================== MOBILE LAYOUT ====================
  if (isMobile) {
    const currentScene = parsedScenes.findIndex((s) => s.id === currentSceneId) + 1 || 1;
    const totalScenes = parsedScenes.length;
    const currentSceneData = parsedScenes.find((s) => s.id === currentSceneId);

    return (
      <div className={`workspace-layout workspace-layout--mobile ${focusMode ? 'focus-mode' : ''}`}>
        {/* Slide Panel */}
        <SceneSlidePanel
          scriptId={projectId ?? ''}
          currentSceneId={currentSceneId}
          onSceneSelect={() => {}}
        />

        {/* Sub-screen overlay */}
        {mobileSubView && renderMobileSubScreen()}

        {/* Mobile Top Bar */}
        <MobileTopBar
          title="The Last Train"
          currentScene={currentScene}
          totalScenes={totalScenes}
        />

        {/* Main Content */}
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
            <MobileShotCards
              shots={generatedShots}
              sceneHeading={currentSceneData?.heading ?? ''}
              sceneNumber={currentScene}
              onShotSelect={(shot) => setSelectedShotId(shot.id)}
            />
          )}
          {viewMode === 'storyboards' && (
            <MobileStoryboardView
              shots={generatedShots}
              sceneHeading={currentSceneData?.heading ?? ''}
              sceneNumber={currentScene}
            />
          )}
          {viewMode === 'breakdown' && (
            <MobileBreakdownScreen scenes={parsedScenes} />
          )}
        </div>

        {/* Mobile Format Bar - only show for script view */}
        {viewMode === 'script' && !focusMode && (
          <MobileFormatBar onFormat={handleFormat} />
        )}

        {/* Focus Mode Bottom Bar */}
        {focusMode && (
          <div className="focus-mode-bar">
            <button type="button" className="focus-mode-bar__btn">Scene ↑</button>
            <button type="button" className="focus-mode-bar__btn">Scene ↓</button>
            <button
              type="button"
              className="focus-mode-bar__btn focus-mode-bar__btn--exit"
              onClick={() => useUIStore.getState().toggleFocusMode()}
            >
              Exit Focus
            </button>
          </div>
        )}

        {/* Bottom Navigation */}
        {!focusMode && (
          <BottomNav
            activeView={viewMode as MobileView}
            onViewChange={(v) => navigate(`/project/${projectId}/${v}`)}
          />
        )}
      </div>
    );
  }

  // ==================== DESKTOP LAYOUT ====================
  return (
    <div className={`workspace-layout ${'workspace-layout--desktop'}`}>
      <Header viewMode={viewMode} onNavigate={handleNavigate} />

      <div style={editorContainerStyles}>
        <LeftSidebar
          projectId={projectId ?? ''}
          currentSceneId={currentSceneId}
          scenes={parsedScenes}
          onSceneSelect={(id) => setSelectedSceneId(id)}
        />

        <div style={mainContentStyles}>
          <div style={editorAreaStyles}>
            {renderContent()}
          </div>
        </div>

        <RightPanel
          selectedShot={null}
          selectedStoryboard={null}
          currentScene={null}
          sceneId=""
        />
      </div>

      <FormatBar onFormat={handleFormat} />
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

// Desktop-only styles
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
