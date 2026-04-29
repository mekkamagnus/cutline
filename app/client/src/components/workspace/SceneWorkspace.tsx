/**
 * SceneWorkspace Component
 *
 * Main workspace for working on a single scene.
 * Responsive layout: desktop uses three-panel grid, mobile uses single-column with bottom nav.
 */
import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useBreakpoint } from '@/hooks';
import { useScene, useShots, useStoryboardForShot, useScenes } from '@/hooks';
import { useUIStore } from '@/stores';
import { LeftSidebar } from './LeftSidebar';
import { RightPanel } from './RightPanel';
import { Header } from './Header';
import { FormatBar } from './FormatBar';
import { ViewModeToggle, type ViewMode } from './ViewModeToggle';
import { BottomNav, type MobileView } from './BottomNav';
import { MobileTopBar } from './MobileTopBar';
import { SceneSlidePanel } from './SceneSlidePanel';
import { MobileFormatBar } from './MobileFormatBar';
import { ScriptEditor } from '@/components/script';
import { ShotListEditor } from '@/components/shot-list';
import { StoryboardStrip } from '@/components/storyboard';

export function SceneWorkspace() {
  const { projectId, sceneId } = useParams<{ projectId: string; sceneId: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const { isMobile } = useBreakpoint();

  // Mobile view state
  const mobileView = useUIStore((s) => s.mobileView);
  const setMobileView = useUIStore((s) => s.setMobileView);
  const focusMode = useUIStore((s) => s.focusMode);

  // Fetch data
  const { data: scene } = useScene(sceneId);
  const { data: scenes = [] } = useScenes(projectId!);
  const { data: shots = [] } = useShots(sceneId);

  // Get storyboards for selected shot
  const selectedShot = shots.find(s => s.id === selectedShotId);
  const { data: selectedStoryboard } = useStoryboardForShot(selectedShotId);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleShotSelect = useCallback((shotId: string) => {
    setSelectedShotId(shotId);
  }, []);

  const handleMobileViewChange = useCallback((view: MobileView) => {
    setMobileView(view);
  }, [setMobileView]);

  if (!sceneId || !projectId) {
    return (
      <div className="scene-workspace scene-workspace--error">
        <p>No scene selected</p>
      </div>
    );
  }

  // ==================== MOBILE LAYOUT ====================
  if (isMobile) {
    const currentSceneIndex = scenes.findIndex(s => s.id === sceneId);
    const currentScene = currentSceneIndex + 1;
    const totalScenes = scenes.length;

    return (
      <div className={`workspace-layout workspace-layout--mobile ${focusMode ? 'focus-mode' : ''}`}>
        {/* Slide Panel */}
        <SceneSlidePanel
          scriptId={scene?.scriptId ?? ''}
          currentSceneId={sceneId}
          onSceneSelect={(id: string) => {
            window.location.href = `/project/${projectId}/scene/${id}/shots`;
          }}
        />

        {/* Mobile Top Bar */}
        <MobileTopBar
          title="The Last Train"
          currentScene={currentScene}
          totalScenes={totalScenes}
          onPrevScene={() => {
            const prevScene = scenes[currentSceneIndex - 1];
            if (prevScene) {
              window.location.href = `/project/${projectId}/scene/${prevScene.id}/shots`;
            }
          }}
          onNextScene={() => {
            const nextScene = scenes[currentSceneIndex + 1];
            if (nextScene) {
              window.location.href = `/project/${projectId}/scene/${nextScene.id}/shots`;
            }
          }}
        />

        {/* Main Content Area */}
        <div className="mobile-content">
          {/* Script View */}
          {(mobileView === 'script' || mobileView === 'breakdown') && (
            <div className="mobile-script-page">
              <ScriptEditor readOnly={true} />
            </div>
          )}

          {/* Shots View */}
          {mobileView === 'shots' && (
            <ShotListEditor
              sceneId={sceneId}
              selectedShotId={selectedShotId ?? undefined}
              onShotSelect={(shot) => handleShotSelect(shot.id)}
            />
          )}

          {/* Storyboards View */}
          {mobileView === 'storyboards' && (
            <StoryboardStrip
              storyboards={[]}
              shots={shots}
              selectedPanelId={selectedStoryboard?.id}
              onPanelSelect={(sb) => setSelectedShotId(sb.shotId)}
            />
          )}

          {/* Breakdown View */}
          {mobileView === 'breakdown' && (
            <div style={{ padding: 'var(--space-4)' }}>
              {/* Stats */}
              <div className="mobile-stats-grid">
                <div className="mobile-stat-card">
                  <div className="mobile-stat-card__value">{scenes.length}</div>
                  <div className="mobile-stat-card__label">Scenes</div>
                </div>
                <div className="mobile-stat-card">
                  <div className="mobile-stat-card__value">{new Set(scenes.map(s => s.location)).size}</div>
                  <div className="mobile-stat-card__label">Locations</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Format Bar */}
        <MobileFormatBar
          onFormat={(type) => console.log('Format:', type)}
        />

        {/* Bottom Navigation */}
        <BottomNav
          activeView={mobileView}
          onViewChange={handleMobileViewChange}
        />
      </div>
    );
  }

  // ==================== DESKTOP LAYOUT (unchanged) ====================
  return (
    <div style={workspaceStyles}>
      {/* Header */}
      <Header
        viewMode={viewMode === 'split' ? 'script' : viewMode}
        onViewModeChange={(mode) => handleViewModeChange(mode as ViewMode)}
      />

      {/* Main Three-Panel Grid */}
      <div style={editorContainerStyles}>
        {/* Left Sidebar - Scene Navigation */}
        <LeftSidebar
          projectId={projectId}
          currentSceneId={sceneId}
          onSceneSelect={(id: string) => {
            window.location.href = `/project/${projectId}/scene/${id}/shots`;
          }}
        />

        {/* Content Area */}
        <div style={mainContentStyles}>
          {/* View Mode Toggle */}
          <ViewModeToggle
            currentMode={viewMode}
            onModeChange={handleViewModeChange}
          />

          {/* Scene Header */}
          {scene && (
            <div style={sceneHeaderStyles}>
              <h2 style={sceneHeadingStyles}>{scene.heading}</h2>
              <div style={sceneMetaStyles}>
                <span>{scene.interior ? 'INT' : 'EXT'}</span>
                <span>•</span>
                <span>{scene.location}</span>
                <span>•</span>
                <span>{scene.timeOfDay}</span>
              </div>
            </div>
          )}

          {/* Main Content Based on View Mode */}
          <div style={editorAreaStyles}>
            {/* Script View */}
            {(viewMode === 'script' || viewMode === 'split') && (
              <div style={viewContainerStyles}>
                <ScriptEditor readOnly={true} />
              </div>
            )}

            {/* Shot List View */}
            {(viewMode === 'shots' || viewMode === 'split') && (
              <div style={viewContainerStyles}>
                <ShotListEditor
                  sceneId={sceneId}
                  selectedShotId={selectedShotId ?? undefined}
                  onShotSelect={(shot) => handleShotSelect(shot.id)}
                />
              </div>
            )}

            {/* Storyboard View */}
            {viewMode === 'storyboard' && (
              <div style={viewContainerStyles}>
                <StoryboardStrip
                  storyboards={[]}
                  shots={shots}
                  selectedPanelId={selectedStoryboard?.id}
                  onPanelSelect={(sb) => setSelectedShotId(sb.shotId)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Contextual Tools */}
        <RightPanel
          selectedShot={selectedShot}
          selectedStoryboard={selectedStoryboard}
          currentScene={scene}
          sceneId={sceneId}
        />
      </div>

      {/* Format Bar */}
      <FormatBar
        onFormat={(type) => console.log('Format:', type)}
      />
    </div>
  );
}

// Desktop-only styles (unchanged)
const workspaceStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  background: 'var(--bg-primary)',
};

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

const sceneHeaderStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  borderBottom: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
};

const sceneHeadingStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-lg)',
  fontWeight: 'var(--font-weight-semibold)' as React.CSSProperties['fontWeight'],
  marginBottom: 'var(--space-1)',
  color: 'var(--text-primary)',
};

const sceneMetaStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-muted)',
};

const editorAreaStyles: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  display: 'flex',
  gap: 'var(--space-4)',
  padding: 'var(--space-4)',
};

const viewContainerStyles: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
};

export default SceneWorkspace;
