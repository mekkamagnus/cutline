/**
 * StoryboardGenerator Component
 *
 * Controls for generating storyboards from confirmed shot lists.
 * Implements paradigm gate: requires confirmed shot list.
 */
import { useState, useCallback, useMemo } from 'react';
import { useShotListConfirmationStatus, useShots } from '@/hooks';
import { useSettingsStore, type AvailableModel } from '@/stores/settings-store';
import { api } from '@/lib/api-client';
import { buildShotPrompt } from '@/lib/build-shot-prompt';
import type { StoryboardPanel } from '@/types';

interface StoryboardGeneratorProps {
  sceneId: string;
  selectedStyle?: string;
  onStyleChange?: (style: string) => void;
  onGenerationComplete?: (panels: StoryboardPanel[]) => void;
}

interface DynamicStoryboardResponse {
  success: boolean;
  generated: number;
  totalCost: number;
  storyboards: Array<{
    id: string;
    shotId: string;
    imageUrl?: string;
    cost?: number;
    provider: string;
    model?: string;
  }>;
}

const STORYBOARD_STYLES = [
  { value: 'pencil-sketch', label: 'Pencil Sketch' },
  { value: 'ink-drawing', label: 'Ink Drawing' },
  { value: 'manga', label: 'Manga/Comic' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'noir', label: 'Noir' },
  { value: 'storyboard', label: 'Traditional Storyboard' },
] as const;

const DEFAULT_PROVIDER_ID = 'openai';
const DEFAULT_MODEL_ID = 'gpt-image-1';

export function StoryboardGenerator({ sceneId, selectedStyle: controlledStyle, onStyleChange, onGenerationComplete }: StoryboardGeneratorProps) {
  const [internalStyle, setInternalStyle] = useState('manga');
  const selectedStyle = controlledStyle ?? internalStyle;
  const setSelectedStyle = onStyleChange ?? setInternalStyle;
  const [selectedProviderId, setSelectedProviderId] = useState(DEFAULT_PROVIDER_ID);
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const [error, setError] = useState<string | null>(null);

  const { data: shots = [] } = useShots(sceneId);
  const { data: confirmationStatus } = useShotListConfirmationStatus(sceneId);
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

  // Auto-select first model when switching providers
  const handleProviderChange = useCallback((newProviderId: string) => {
    setSelectedProviderId(newProviderId);
    const firstModel = availableModels.find((m) => m.providerId === newProviderId);
    setSelectedModelId(firstModel?.modelId ?? '');
  }, [availableModels]);

  const isConfirmed = confirmationStatus?.isConfirmed ?? false;
  const confirmedShots = shots.filter((s) => s.confirmed);

  const costPerImage = selectedModel?.pricePerImage ?? 0.01;
  const estimatedCost = confirmedShots.length * costPerImage;

  const handleGenerate = useCallback(async () => {
    setError(null);

    if (!selectedModel) {
      setError('No model selected. Choose a provider and model first.');
      return;
    }

    const shotsPayload = confirmedShots.map((s) => ({
      shotId: s.id,
      prompt: buildShotPrompt(s, selectedStyle),
    }));
    const promptByShotId = new Map(shotsPayload.map((shot) => [shot.shotId, shot.prompt]));

    try {
      const response = await api.post<DynamicStoryboardResponse>('/api/ai/generate/dynamic/storyboards', {
        shots: shotsPayload,
        style: selectedStyle,
        providerId: selectedModel.providerId,
        providerName: selectedModel.providerName,
        model: selectedModel.modelId,
        endpoint: selectedModel.openaiEndpoint,
        costPerImage: selectedModel.pricePerImage,
      });

      if (!response.success) {
        throw new Error(response.error || 'Generation failed');
      }

      const storyboards = response.data?.storyboards ?? [];
      const fallbackCost = selectedModel.pricePerImage ?? 0;
      const panels: StoryboardPanel[] = storyboards
        .filter((storyboard) => Boolean(storyboard.imageUrl))
        .map((storyboard) => ({
          id: storyboard.id,
          shotId: storyboard.shotId,
          imageUrl: storyboard.imageUrl as string,
          generatedAt: new Date(),
          generationParams: {
            prompt: promptByShotId.get(storyboard.shotId) ?? '',
            width: 1024,
            height: 576,
          },
          apiProvider: storyboard.provider as StoryboardPanel['apiProvider'],
          model: storyboard.model,
          cost: typeof storyboard.cost === 'number' && Number.isFinite(storyboard.cost) ? storyboard.cost : fallbackCost,
          style: selectedStyle as StoryboardPanel['style'],
          version: 1,
          previousVersions: [],
        }));

      if (panels.length === 0) {
        throw new Error('Generation completed without image URLs');
      }

      onGenerationComplete?.(panels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    }
  }, [confirmedShots, selectedStyle, selectedModel, onGenerationComplete]);

  return (
    <div className="storyboard-generator">
      {/* Paradigm gate warning */}
      {!isConfirmed && (
        <div className="storyboard-generator__warning">
          Shot list must be confirmed before generating storyboards
        </div>
      )}

      {/* Style selector */}
      <div className="storyboard-generator__style-selector">
        <label className="storyboard-generator__label">Visual Style</label>
        <select
          className="storyboard-generator__select"
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
        >
          {STORYBOARD_STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
      </div>

      {/* Provider selector */}
      <div className="storyboard-generator__style-selector">
        <label className="storyboard-generator__label">Provider</label>
        <select
          className="storyboard-generator__select"
          value={selectedProviderId}
          onChange={(e) => handleProviderChange(e.target.value)}
        >
          {enabledProviders.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Model selector */}
      <div className="storyboard-generator__style-selector">
        <label className="storyboard-generator__label">Model</label>
        <select
          className="storyboard-generator__select"
          value={selectedModel?.modelId ?? ''}
          onChange={(e) => setSelectedModelId(e.target.value)}
        >
          {providerModels.map((m) => (
            <option key={m.modelId} value={m.modelId}>
              {m.modelId}
              {m.pricePerImage != null ? ` ($${m.pricePerImage}/img)` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Inline error */}
      {error && (
        <div className="storyboard-generator__warning">
          {error}
        </div>
      )}

      {/* Generation controls */}
      <div className="storyboard-generator__controls">
        <button
          type="button"
          className="storyboard-generator__button"
          onClick={handleGenerate}
          disabled={!isConfirmed || confirmedShots.length === 0}
        >
          Generate Storyboards
        </button>

        {/* Stats */}
        <div className="storyboard-generator__stats">
          <div className="storyboard-generator__stat">
              <span className="storyboard-generator__stat-label">Confirmed Shots</span>
              <span className="storyboard-generator__stat-value">{confirmedShots.length}</span>
          </div>
          <div className="storyboard-generator__stat">
              <span className="storyboard-generator__stat-label">Est. Cost</span>
              <span className="storyboard-generator__stat-value">
                  ${estimatedCost.toFixed(3)}
              </span>
          </div>
        </div>
      </div>
    </div>
  );
}
