/**
 * SceneWorkspace Component
 *
 * Main workspace for working on a single scene.
 * Integrates script, shot list, and storyboard views.
 * Uses three-panel layout with Header and FormatBar.
 */
import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { LeftSidebar } from './LeftSidebar';
import { RightPanel } from './RightPanel';
import { Header } from './Header';
import { FormatBar } from './FormatBar';
import { ViewModeToggle, type ViewMode } from './ViewModeToggle';
import { ScriptEditor } from '@/components/script';
import { ShotListEditor } from '@/components/shot-list';
import { StoryboardStrip } from '@/components/storyboard';
import { useScene, useShots, useStoryboardForShot } from '@/hooks';

export function SceneWorkspace() {
  const { projectId, sceneId } = useParams<{ projectId: string; sceneId: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);

  // Fetch data
  const { data: scene } = useScene(sceneId);
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

  if (!sceneId || !projectId) {
    return (
      <div className="scene-workspace scene-workspace--error">
        <p>No scene selected</p>
      </div>
    );
  }

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
                  storyboards={[]} // TODO: Get all storyboards for scene
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

// Styles for three-panel layout
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

const sceneHeaderStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  borderBottom: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
};

const sceneHeadingStyles: React.CSSProperties = {
  fontSize: 'var(--font-size-lg)',
  fontWeight: 'var(--font-weight-semibold)',
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
