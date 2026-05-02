import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProviderConfig, ModelEntry, ClaudeModelTier } from '@/types';
import { api } from '@/lib/api-client';

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'z-ai',
    name: 'Z.AI',
    enabled: true,
    anthropicEndpoint: 'https://api.z.ai/v1',
    openaiEndpoint: 'https://api.z.ai/v1',
    apiKey: '',
    models: [
      { id: 'glm-5.1' },
      { id: 'glm-5v-turbo' },
    ],
    claudeMapping: { opus: 'glm-5.1', sonnet: 'glm-5v-turbo', haiku: 'glm-5v-turbo' },
  },
  {
    id: 'openai',
    name: 'OpenAI',
    enabled: true,
    anthropicEndpoint: '',
    openaiEndpoint: 'https://api.openai.com/v1',
    apiKey: '',
    models: [
      { id: 'gpt-image-2', pricePerImage: 0.04 },
      { id: 'dall-e-3', pricePerImage: 0.04 },
    ],
    claudeMapping: {},
  },
  {
    id: 'google',
    name: 'Google',
    enabled: true,
    anthropicEndpoint: '',
    openaiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKey: '',
    models: [
      { id: 'imagen-4', pricePerImage: 0.04 },
      { id: 'gemini-3.1-flash', pricePerImage: 0.01 },
    ],
    claudeMapping: {},
  },
  {
    id: 'black-forest-labs',
    name: 'Black Forest Labs',
    enabled: true,
    anthropicEndpoint: '',
    openaiEndpoint: 'https://api.fal.ai/v1',
    apiKey: '',
    models: [
      { id: 'flux-1.1-pro', pricePerImage: 0.04 },
      { id: 'flux-1.0-dev', pricePerImage: 0.025 },
      { id: 'flux-1.0-schnell', pricePerImage: 0.003 },
    ],
    claudeMapping: {},
  },
  {
    id: 'bytedance',
    name: 'ByteDance',
    enabled: true,
    anthropicEndpoint: '',
    openaiEndpoint: 'https://api.bytedance.com/v1',
    apiKey: '',
    models: [
      { id: 'seedream-5.0', pricePerImage: 0.02 },
    ],
    claudeMapping: {},
  },
  {
    id: 'tencent',
    name: 'Tencent',
    enabled: true,
    anthropicEndpoint: '',
    openaiEndpoint: 'https://hunyuan.tencentcloudapi.com',
    apiKey: '',
    models: [
      { id: 'hunyuan-image-3.0', pricePerImage: 0.02 },
    ],
    claudeMapping: {},
  },
  {
    id: 'kuaishou',
    name: 'Kuaishou',
    enabled: true,
    anthropicEndpoint: '',
    openaiEndpoint: 'https://api.klingai.com/v1',
    apiKey: '',
    models: [
      { id: 'klingai-image-3.0', pricePerImage: 0.02 },
    ],
    claudeMapping: {},
  },
  {
    id: 'alibaba',
    name: 'Alibaba',
    enabled: true,
    anthropicEndpoint: '',
    openaiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    models: [
      { id: 'qwen-image-plus', pricePerImage: 0.008 },
      { id: 'qwen-image-max', pricePerImage: 0.02 },
    ],
    claudeMapping: {},
  },
];

function normalizeModel(m: ModelEntry | string): ModelEntry {
  return typeof m === 'string' ? { id: m } : m;
}

function normalizeModels(models: (ModelEntry | string)[]): ModelEntry[] {
  return models.map(normalizeModel);
}

export interface AvailableModel {
  providerId: string;  providerName: string;
  modelId: string;
  pricePerImage?: number;
  openaiEndpoint: string;
  hasApiKey: boolean;
}

interface SettingsState {
  providers: ProviderConfig[];
  activeProviderId: string | null;
  settingsOpen: boolean;
  apiKeyStatus: Record<string, boolean>;

  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;
  setActiveProvider: (id: string) => void;
  addProvider: (name: string) => void;
  removeProvider: (id: string) => void;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  addModel: (providerId: string, model: string) => void;
  removeModel: (providerId: string, modelId: string) => void;
  updateModelPrice: (providerId: string, modelId: string, price: number | undefined) => void;
  updateClaudeMapping: (providerId: string, tier: ClaudeModelTier, model: string) => void;
  getAvailableModels: () => AvailableModel[];
  getProvider: (id: string) => ProviderConfig | undefined;
  saveApiKey: (providerId: string, apiKey: string) => Promise<void>;
  deleteApiKey: (providerId: string) => Promise<void>;
  refreshApiKeyStatus: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      providers: DEFAULT_PROVIDERS,
      activeProviderId: DEFAULT_PROVIDERS[0]?.id ?? null,
      settingsOpen: false,
      apiKeyStatus: {},

      toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
      setSettingsOpen: (open) => set({ settingsOpen: open }),

      setActiveProvider: (id) => set({ activeProviderId: id }),

      addProvider: (name) => {
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const newProvider: ProviderConfig = {
          id: `${id}-${Date.now()}`,
          name,
          enabled: true,
          anthropicEndpoint: '',
          openaiEndpoint: '',
          apiKey: '',
          models: [],
          claudeMapping: {},
        };
        set((s) => ({
          providers: [...s.providers, newProvider],
          activeProviderId: newProvider.id,
        }));
      },

      removeProvider: (id) => set((s) => {
        const providers = s.providers.filter((p) => p.id !== id);
        const activeProviderId = s.activeProviderId === id
          ? (providers[0]?.id ?? null)
          : s.activeProviderId;
        return { providers, activeProviderId };
      }),

      updateProvider: (id, updates) => set((s) => ({
        providers: s.providers.map((p) => p.id === id ? { ...p, ...updates } : p),
      })),

      addModel: (providerId, model) => set((s) => ({
        providers: s.providers.map((p) =>
          p.id === providerId && !p.models.some((m) => m.id === model)
            ? { ...p, models: [...p.models, { id: model }] }
            : p
        ),
      })),

      removeModel: (providerId, modelId) => set((s) => ({
        providers: s.providers.map((p) =>
          p.id === providerId
            ? { ...p, models: p.models.filter((m) => m.id !== modelId) }
            : p
        ),
      })),

      updateModelPrice: (providerId, modelId, price) => set((s) => ({
        providers: s.providers.map((p) =>
          p.id === providerId
            ? { ...p, models: p.models.map((m) => m.id === modelId ? { ...m, pricePerImage: price } : m) }
            : p
        ),
      })),

      updateClaudeMapping: (providerId, tier, model) => set((s) => ({
        providers: s.providers.map((p) =>
          p.id === providerId
            ? { ...p, claudeMapping: { ...p.claudeMapping, [tier]: model } }
            : p
        ),
      })),

      getAvailableModels: () => get().providers
        .filter((p) => p.enabled && p.openaiEndpoint)
        .flatMap((p) =>
          normalizeModels(p.models as (ModelEntry | string)[]).map((m) => ({
            providerId: p.id,
            providerName: p.name,
            modelId: m.id,
            pricePerImage: m.pricePerImage,
            openaiEndpoint: p.openaiEndpoint,
            hasApiKey: !!get().apiKeyStatus[p.id],
          }))
        ),

      getProvider: (id) => get().providers.find((p) => p.id === id),

      saveApiKey: async (providerId, apiKey) => {
        await api.post('/api/ai/keys', { provider: providerId, apiKey });
        set((s) => ({
          apiKeyStatus: { ...s.apiKeyStatus, [providerId]: true },
        }));
      },

      deleteApiKey: async (providerId) => {
        await api.delete(`/api/ai/keys/${providerId}`);
        set((s) => {
          const { [providerId]: _, ...rest } = s.apiKeyStatus;
          return { apiKeyStatus: rest };
        });
      },

      refreshApiKeyStatus: async () => {
        const result = await api.get<Record<string, boolean>>('/api/ai/keys');
        if (result.success && result.data) {
          set({ apiKeyStatus: result.data });
        }
      },
    }),
    {
      name: 'cutline-settings',
      partialize: (state) => ({
        providers: state.providers.map(({ apiKey: _k, ...p }) => p),
        activeProviderId: state.activeProviderId,
      }),
    }
  )
);
