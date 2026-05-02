import { useState } from 'react';
import type { ModelEntry, ClaudeModelTier } from '@/types';

const TIERS: { id: ClaudeModelTier; label: string; description: string }[] = [
  { id: 'opus', label: 'Opus', description: 'Complex tasks' },
  { id: 'sonnet', label: 'Sonnet', description: 'Balanced' },
  { id: 'haiku', label: 'Haiku', description: 'Fast responses' },
];

interface ClaudeModelMappingProps {
  models: ModelEntry[];
  mapping: Partial<Record<ClaudeModelTier, string>>;
  onChange: (tier: ClaudeModelTier, model: string) => void;
}

export function ClaudeModelMapping({ models, mapping, onChange }: ClaudeModelMappingProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={styles.container}>
      <button type="button" onClick={() => setExpanded(!expanded)} style={styles.header}>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          stroke="currentColor" strokeWidth="1.5"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform var(--transition-fast)' }}
        >
          <path d="M4 2l4 4-4 4" />
        </svg>
        <span style={styles.headerText}>Claude Model Mapping</span>
      </button>
      {expanded && (
        <div style={styles.body}>
          {models.length === 0 ? (
            <p style={styles.empty}>Add models first to configure mapping</p>
          ) : (
            TIERS.map((tier) => (
              <div key={tier.id} style={styles.row}>
                <label style={styles.label}>
                  <span style={styles.tierName}>{tier.label}</span>
                  <span style={styles.tierDesc}>{tier.description}</span>
                </label>
                <select
                  value={mapping[tier.id] ?? ''}
                  onChange={(e) => onChange(tier.id, e.target.value)}
                  style={styles.select}
                >
                  <option value="">— select —</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.id}</option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-4)' },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    color: 'var(--text-secondary)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
  },
  headerText: { color: 'var(--text-secondary)' },
  body: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-3)' },
  empty: { color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' },
  label: { display: 'flex', flexDirection: 'column', gap: '2px' },
  tierName: { fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' },
  tierDesc: { fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' },
  select: {
    minWidth: '180px',
    padding: 'var(--space-2) var(--space-3)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
  },
};
