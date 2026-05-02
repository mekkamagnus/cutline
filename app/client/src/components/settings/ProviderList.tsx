import type { ProviderConfig } from '@/types';

interface ProviderListProps {
  providers: ProviderConfig[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export function ProviderList({ providers, activeId, onSelect, onAdd }: ProviderListProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerLabel}>Providers</span>
      </div>
      <div style={styles.list}>
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            style={{
              ...styles.item,
              ...(p.id === activeId ? styles.itemActive : {}),
            }}
          >
            <span
              style={{
                ...styles.dot,
                background: p.enabled ? 'var(--success)' : 'var(--text-muted)',
              }}
            />
            <span style={styles.name}>{p.name}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={onAdd} style={styles.addBtn}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 2v10M2 7h10" />
        </svg>
        Add Provider
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '280px',
    minWidth: '280px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
  },
  header: {
    padding: 'var(--space-4) var(--space-4) var(--space-2)',
  },
  headerLabel: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  list: {
    flex: 1,
    overflow: 'auto',
    padding: '0 var(--space-3)',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    width: '100%',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    marginBottom: 'var(--space-1)',
    textAlign: 'left' as const,
    transition: 'all var(--transition-fast)',
  },
  itemActive: {
    background: 'var(--accent-light)',
    borderColor: 'var(--accent)',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  name: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--text-primary)',
    fontWeight: 'var(--font-weight-medium)',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-4)',
    borderTop: '1px solid var(--border-color)',
    color: 'var(--accent)',
    fontSize: 'var(--font-size-sm)',
  },
};
