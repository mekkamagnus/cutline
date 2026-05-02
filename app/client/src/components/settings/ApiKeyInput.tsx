import { useState } from 'react';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasKey?: boolean;
}

export function ApiKeyInput({ value, onChange, placeholder = 'sk-...', hasKey }: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={styles.wrapper}>
      {hasKey && !value ? (
        <div style={styles.saved}>Key saved on server</div>
      ) : (
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={styles.input}
        />
      )}
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        style={styles.toggle}
        title={visible ? 'Hide' : 'Show'}
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1l14 14M6.5 6.5a2 2 0 1 0 3 3M8 3.5C4.5 3.5 1.5 6 1 8c.3 1 1.5 3 4 4M8 12.5c3.5 0 6.5-2.5 7-4.5-.3-1-1.5-3-4-4" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 3.5C4.5 3.5 1.5 6 1 8c.5 2 3.5 4.5 7 4.5s6.5-2.5 7-4.5c-.5-2-3.5-4.5-7-4.5z" />
            <circle cx="8" cy="8" r="2" />
          </svg>
        )}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '0 var(--space-2)',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: 'var(--font-size-sm)',
    padding: 'var(--space-2) 0',
    outline: 'none',
  },
  saved: {
    flex: 1,
    color: 'var(--success)',
    fontSize: 'var(--font-size-sm)',
    padding: 'var(--space-2) 0',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    padding: 'var(--space-1)',
    minHeight: 'auto',
    minWidth: 'auto',
  },
};
