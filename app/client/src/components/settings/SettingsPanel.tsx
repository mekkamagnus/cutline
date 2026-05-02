import { useEffect } from 'react';
import { useSettingsStore } from '@/stores';
import { ProviderList } from './ProviderList';
import { ProviderConfig } from './ProviderConfig';
import '@/styles/settings.css';

export function SettingsPanel() {
  const { settingsOpen, setSettingsOpen, providers, activeProviderId, setActiveProvider, addProvider, refreshApiKeyStatus } = useSettingsStore();

  useEffect(() => {
    if (settingsOpen) refreshApiKeyStatus();
  }, [settingsOpen, refreshApiKeyStatus]);

  if (!settingsOpen) return null;

  const activeProvider = providers.find((p) => p.id === activeProviderId) ?? null;

  return (
    <div className="settings-overlay">
      <div className="settings-backdrop" onClick={() => setSettingsOpen(false)} />
      <div className="settings-panel">
        <div className="settings-panel-header">
          <h2 className="settings-panel-title">Settings</h2>
          <button
            type="button"
            className="settings-close-btn"
            onClick={() => setSettingsOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          </button>
        </div>
        <div className="settings-content">
          <ProviderList
            providers={providers}
            activeId={activeProviderId}
            onSelect={setActiveProvider}
            onAdd={() => {
              const name = prompt('Provider name:');
              if (name?.trim()) addProvider(name.trim());
            }}
          />
          {activeProvider ? (
            <ProviderConfig provider={activeProvider} />
          ) : (
            <div className="settings-empty">
              <p>Select a provider or add a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
