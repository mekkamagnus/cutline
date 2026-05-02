import type { ProviderConfig as ProviderConfigType, ClaudeModelTier } from '@/types';
import { useSettingsStore } from '@/stores';
import { ApiKeyInput } from './ApiKeyInput';
import { ModelList } from './ModelList';
import { ClaudeModelMapping } from './ClaudeModelMapping';

export function ProviderConfig({ provider }: { provider: ProviderConfigType }) {
  const { updateProvider, addModel, removeModel, updateModelPrice, updateClaudeMapping, removeProvider, saveApiKey, apiKeyStatus } = useSettingsStore();

  const update = (updates: Partial<ProviderConfigType>) => {
    updateProvider(provider.id, updates);
  };

  const handleApiKeyChange = async (apiKey: string) => {
    if (apiKey) {
      await saveApiKey(provider.id, apiKey);
    } else {
      updateProvider(provider.id, { apiKey: '' });
    }
  };

  const hasKey = apiKeyStatus[provider.id];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h3 style={styles.name}>{provider.name}</h3>
          {provider.enabled ? (
            <span style={styles.enabledBadge}>Enabled</span>
          ) : (
            <span style={styles.disabledBadge}>Disabled</span>
          )}
        </div>
        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={() => update({ enabled: !provider.enabled })}
            style={styles.toggleBtn}
          >
            {provider.enabled ? 'Disable' : 'Enable'}
          </button>
          <button
            type="button"
            onClick={() => removeProvider(provider.id)}
            style={styles.deleteBtn}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={styles.body}>
        <FieldGroup label="Provider Name">
          <input
            type="text"
            value={provider.name}
            onChange={(e) => update({ name: e.target.value })}
            style={styles.input}
          />
        </FieldGroup>

        <FieldGroup label="Anthropic Endpoint">
          <input
            type="text"
            value={provider.anthropicEndpoint}
            onChange={(e) => update({ anthropicEndpoint: e.target.value })}
            placeholder="https://api.anthropic.com/v1"
            style={styles.input}
          />
        </FieldGroup>

        <FieldGroup label="OpenAI Endpoint">
          <input
            type="text"
            value={provider.openaiEndpoint}
            onChange={(e) => update({ openaiEndpoint: e.target.value })}
            placeholder="https://api.openai.com/v1"
            style={styles.input}
          />
        </FieldGroup>

        <FieldGroup label="API Key">
          <ApiKeyInput
            value={provider.apiKey ?? ''}
            onChange={handleApiKeyChange}
            hasKey={hasKey}
          />
        </FieldGroup>

        <FieldGroup label="Models">
          <ModelList
            models={provider.models}
            onAdd={(model) => addModel(provider.id, model)}
            onRemove={(modelId) => removeModel(provider.id, modelId)}
            onUpdatePrice={(modelId, price) => updateModelPrice(provider.id, modelId, price)}
          />
        </FieldGroup>

        <ClaudeModelMapping
          models={provider.models}
          mapping={provider.claudeMapping}
          onChange={(tier: ClaudeModelTier, model: string) => updateClaudeMapping(provider.id, tier, model)}
        />
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={fieldStyles.group}>
      <label style={fieldStyles.label}>{label}</label>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-4) var(--space-6)',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  name: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--text-primary)',
    margin: 0,
  },
  enabledBadge: {
    padding: '2px var(--space-2)',
    background: 'var(--success-light)',
    color: 'var(--success)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-semibold)',
  },
  disabledBadge: {
    padding: '2px var(--space-2)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-muted)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-semibold)',
  },
  headerActions: {
    display: 'flex',
    gap: 'var(--space-2)',
  },
  toggleBtn: {
    padding: 'var(--space-2) var(--space-3)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    border: '1px solid var(--border-color)',
  },
  deleteBtn: {
    padding: 'var(--space-2) var(--space-3)',
    background: 'var(--error-light)',
    color: 'var(--error)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    border: '1px solid transparent',
  },
  body: {
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-5)',
  },
  input: {
    width: '100%',
    fontSize: 'var(--font-size-sm)',
    padding: 'var(--space-2) var(--space-3)',
  },
};

const fieldStyles: Record<string, React.CSSProperties> = {
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  label: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--text-secondary)',
  },
};
