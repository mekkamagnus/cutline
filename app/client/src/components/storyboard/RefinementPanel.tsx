/**
 * RefinementPanel Component
 *
 * Panel for editing prompts and regenerating individual storyboard panels.
 * Allows users to refine AI-generated storyboards with targeted adjustments.
 */
import { useState, useCallback } from 'react';
import { useUpdateStoryboard, useAddStoryboardVersion } from '@/hooks';
import { api, type GenerateSingleResponse } from '@/lib/api-client';
import type { StoryboardPanel, StoryboardData, StoryboardStyle } from '@/types';

interface RefinementPanelProps {
  storyboard: StoryboardPanel;
  onClose: () => void;
  onRefined?: (panel: StoryboardPanel) => void;
}

const STYLE_OPTIONS: { value: StoryboardStyle; label: string }[] = [
  { value: 'pencil-sketch', label: 'Pencil Sketch' },
  { value: 'ink-drawing', label: 'Ink Drawing' },
  { value: 'manga-comic', label: 'Manga/Comic' },
  { value: 'watercolor', label: 'Watercolor' },
];

const PROVIDER_OPTIONS: { value: 'sdxl' | 'wanxiang'; label: string; cost: string }[] = [
  { value: 'sdxl', label: 'SDXL (Replicate)', cost: '$0.002/image' },
  { value: 'wanxiang', label: 'WanXiang (Alibaba)', cost: '$0.028/image' },
];

export function RefinementPanel({ storyboard, onClose, onRefined }: RefinementPanelProps) {
  const [refinementPrompt, setRefinementPrompt] = useState(storyboard.refinementPrompt || '');
  const [selectedStyle, setSelectedStyle] = useState<StoryboardStyle>(storyboard.style || 'pencil-sketch');
  const [selectedProvider, setSelectedProvider] = useState<'sdxl' | 'wanxiang'>(
    (storyboard.apiProvider as 'sdxl' | 'wanxiang') || 'sdxl'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStoryboard = useUpdateStoryboard();
  const addVersion = useAddStoryboardVersion();

  const handleRefine = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Call backend API to generate refined image
      const response = await api.post<GenerateSingleResponse>('/api/ai/generate/single', {
        shotId: storyboard.shotId,
        style: selectedStyle,
        provider: selectedProvider,
        refinementPrompt,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate refined storyboard');
      }

      // Add new version to storyboard
      const newData: StoryboardData = {
        imageUrl: response.data.imageUrl,
        generationParams: {
          ...storyboard.generationParams,
        },
        apiProvider: response.data.provider as StoryboardData['apiProvider'],
        cost: response.data.cost,
        style: selectedStyle as StoryboardData['style'],
        refinementPrompt,
      };

      await addVersion.mutateAsync({
        id: storyboard.id,
        newVersion: newData,
      });

      onRefined?.({
        ...storyboard,
        ...newData,
        version: storyboard.version + 1,
      });

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refine storyboard';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [refinementPrompt, selectedStyle, selectedProvider, storyboard, addVersion, onRefined, onClose]);

  const handleUpdatePrompt = useCallback(async () => {
    try {
      await updateStoryboard.mutateAsync({
        id: storyboard.id,
        data: {
          refinementPrompt,
        },
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update prompt';
      setError(message);
    }
  }, [refinementPrompt, storyboard.id, updateStoryboard, onClose]);

  return (
    <div className="refinement-panel">
      {/* Header */}
      <div className="refinement-panel__header">
        <h3 className="refinement-panel__title">Refine Storyboard</h3>
        <button
          type="button"
          className="refinement-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Current Image Preview */}
      <div className="refinement-panel__preview">
        <img
          src={storyboard.imageUrl}
          alt="Current storyboard"
          className="refinement-panel__image"
        />
        <div className="refinement-panel__version">
          Version {storyboard.version}
        </div>
      </div>

      {/* Refinement Prompt */}
      <div className="refinement-panel__field">
        <label className="refinement-panel__label" htmlFor="refinement-prompt">
          Refinement Prompt
        </label>
        <textarea
          id="refinement-prompt"
          className="refinement-panel__textarea"
          value={refinementPrompt}
          onChange={(e) => setRefinementPrompt(e.target.value)}
          placeholder="Describe specific changes to make to this storyboard..."
          rows={4}
          disabled={isGenerating}
        />
        <p className="refinement-panel__hint">
          Be specific about what you want to change: lighting, composition, character expressions, etc.
        </p>
      </div>

      {/* Style Selector */}
      <div className="refinement-panel__field">
        <label className="refinement-panel__label" htmlFor="style-select">
          Visual Style
        </label>
        <select
          id="style-select"
          className="refinement-panel__select"
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value as StoryboardStyle)}
          disabled={isGenerating}
        >
          {STYLE_OPTIONS.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
      </div>

      {/* Provider Selector */}
      <div className="refinement-panel__field">
        <label className="refinement-panel__label" htmlFor="provider-select">
          AI Provider
        </label>
        <select
          id="provider-select"
          className="refinement-panel__select"
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value as 'sdxl' | 'wanxiang')}
          disabled={isGenerating}
        >
          {PROVIDER_OPTIONS.map((provider) => (
            <option key={provider.value} value={provider.value}>
              {provider.label} - {provider.cost}
            </option>
          ))}
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="refinement-panel__error">
          ⚠️ {error}
        </div>
      )}

      {/* Cost Estimate */}
      <div className="refinement-panel__cost">
        Estimated cost: {selectedProvider === 'sdxl' ? '$0.002' : '$0.028'}
      </div>

      {/* Actions */}
      <div className="refinement-panel__actions">
        <button
          type="button"
          className="refinement-panel__button refinement-panel__button--secondary"
          onClick={handleUpdatePrompt}
          disabled={isGenerating || !refinementPrompt.trim()}
        >
          Save Prompt Only
        </button>
        <button
          type="button"
          className="refinement-panel__button refinement-panel__button--primary"
          onClick={handleRefine}
          disabled={isGenerating || !refinementPrompt.trim()}
        >
          {isGenerating ? (
            <>
              <span className="refinement-panel__spinner">⏳</span>
              Generating...
            </>
          ) : (
            'Generate Refinement'
          )}
        </button>
      </div>
    </div>
  );
}

export default RefinementPanel;
