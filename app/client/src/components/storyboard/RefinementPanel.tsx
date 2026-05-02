/**
 * RefinementPanel Component
 *
 * Panel for editing prompts and regenerating individual storyboard panels.
 * Allows users to refine AI-generated storyboards with targeted adjustments.
 */
import { useState, useCallback, useMemo } from 'react';
import { useUpdateStoryboard, useAddStoryboardVersion } from '@/hooks';
import { api, type GenerateSingleResponse } from '@/lib/api-client';
import { useSettingsStore, type AvailableModel } from '@/stores/settings-store';
import type { StoryboardPanel, StoryboardData, StoryboardStyle } from '@/types';

interface RefinementPanelProps {
  storyboard: StoryboardPanel;
  onClose: () => void;
  onRefined?: (panel: StoryboardPanel) => void;
}

const STYLE_OPTIONS: { value: StoryboardStyle; label: string }[] = [
  { value: 'pencil-sketch', label: 'Pencil Sketch' },
  { value: 'ink-drawing', label: 'Ink Drawing' },
  { value: 'manga', label: 'Manga/Comic' },
  { value: 'watercolor', label: 'Watercolor' },
];

const DEFAULT_PROVIDER_ID = 'google';
const DEFAULT_MODEL_ID = 'gemini-3.1-flash';

export function RefinementPanel({ storyboard, onClose, onRefined }: RefinementPanelProps) {
  const [refinementPrompt, setRefinementPrompt] = useState(storyboard.refinementPrompt || '');
  const [selectedStyle, setSelectedStyle] = useState<StoryboardStyle>(storyboard.style || 'pencil-sketch');
  const [selectedProviderId, setSelectedProviderId] = useState(DEFAULT_PROVIDER_ID);
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStoryboard = useUpdateStoryboard();
  const addVersion = useAddStoryboardVersion();
  const { getAvailableModels, providers } = useSettingsStore();

  const availableModels = useMemo(() => getAvailableModels(), [providers]);

  const enabledProviders = useMemo(() => {
    const seen = new Set<string>();
    return availableModels.filter((m) => {
      if (seen.has(m.providerId)) return false;
      seen.add(m.providerId);
      return true;
    }).map((m) => ({ id: m.providerId, name: m.providerName }));
  }, [availableModels]);

  const providerModels = useMemo(
    () => availableModels.filter((m) => m.providerId === selectedProviderId),
    [availableModels, selectedProviderId],
  );

  const selectedModel = useMemo<AvailableModel | undefined>(() => {
    const found = availableModels.find((m) => m.providerId === selectedProviderId && m.modelId === selectedModelId);
    if (found) return found;
    return providerModels[0];
  }, [availableModels, selectedProviderId, selectedModelId, providerModels]);

  const handleProviderChange = useCallback((newProviderId: string) => {
    setSelectedProviderId(newProviderId);
    const firstModel = availableModels.find((m) => m.providerId === newProviderId);
    setSelectedModelId(firstModel?.modelId ?? '');
  }, [availableModels]);

  const costPerImage = selectedModel?.pricePerImage ?? 0.01;

  const handleRefine = useCallback(async () => {
    if (!selectedModel) {
      setError('No model selected. Choose a provider and model first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.post<GenerateSingleResponse>('/api/ai/generate/dynamic/single', {
        shotId: storyboard.shotId,
        prompt: storyboard.generationParams?.prompt || refinementPrompt || '',
        style: selectedStyle,
        providerId: selectedModel.providerId,
        providerName: selectedModel.providerName,
        model: selectedModel.modelId,
        endpoint: selectedModel.openaiEndpoint,
        costPerImage: selectedModel.pricePerImage,
        refinementPrompt,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate refined storyboard');
      }

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
      setError(err instanceof Error ? err.message : 'Failed to refine storyboard');
    } finally {
      setIsGenerating(false);
    }
  }, [refinementPrompt, selectedStyle, selectedModel, storyboard, addVersion, onRefined, onClose]);

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
      setError(err instanceof Error ? err.message : 'Failed to update prompt');
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
          x
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
          Provider
        </label>
        <select
          id="provider-select"
          className="refinement-panel__select"
          value={selectedProviderId}
          onChange={(e) => handleProviderChange(e.target.value)}
          disabled={isGenerating}
        >
          {enabledProviders.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Model Selector */}
      <div className="refinement-panel__field">
        <label className="refinement-panel__label" htmlFor="model-select">
          Model
        </label>
        <select
          id="model-select"
          className="refinement-panel__select"
          value={selectedModel?.modelId ?? ''}
          onChange={(e) => setSelectedModelId(e.target.value)}
          disabled={isGenerating}
        >
          {providerModels.map((m) => (
            <option key={m.modelId} value={m.modelId}>
              {m.modelId}
              {m.pricePerImage != null ? ` ($${m.pricePerImage}/img)` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="refinement-panel__error">
          {error}
        </div>
      )}

      {/* Cost Estimate */}
      <div className="refinement-panel__cost">
        Estimated cost: ${costPerImage.toFixed(3)}/image
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
          {isGenerating ? 'Generating...' : 'Generate Refinement'}
        </button>
      </div>
    </div>
  );
}

export default RefinementPanel;
