import { useState } from 'react';
import type { ModelEntry } from '@/types';

interface ModelListProps {
  models: ModelEntry[];
  onAdd: (model: string) => void;
  onRemove: (modelId: string) => void;
  onUpdatePrice: (modelId: string, price: number | undefined) => void;
}

export function ModelList({ models, onAdd, onRemove, onUpdatePrice }: ModelListProps) {
  const [newModel, setNewModel] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');

  const handleAdd = () => {
    const trimmed = newModel.trim();
    if (trimmed && !models.some((m) => m.id === trimmed)) {
      onAdd(trimmed);
      setNewModel('');
      setAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') { setAdding(false); setNewModel(''); }
  };

  const startEditPrice = (model: ModelEntry) => {
    setEditingPrice(model.id);
    setPriceInput(model.pricePerImage != null ? String(model.pricePerImage) : '');
  };

  const commitPrice = () => {
    if (editingPrice) {
      const parsed = priceInput.trim() ? parseFloat(priceInput) : undefined;
      onUpdatePrice(editingPrice, parsed != null && !isNaN(parsed) ? parsed : undefined);
      setEditingPrice(null);
      setPriceInput('');
    }
  };

  const cancelPrice = () => {
    setEditingPrice(null);
    setPriceInput('');
  };

  return (
    <div style={styles.container}>
      {models.length === 0 && !adding && (
        <p style={styles.empty}>No models configured</p>
      )}
      {models.map((model) => (
        <div key={model.id} style={styles.item}>
          <span style={styles.modelName}>{model.id}</span>
          <div style={styles.priceArea}>
            {editingPrice === model.id ? (
              <>
                <span style={styles.dollarSign}>$</span>
                <input
                  type="text"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitPrice(); if (e.key === 'Escape') cancelPrice(); }}
                  onBlur={commitPrice}
                  placeholder="0.00"
                  style={styles.priceInput}
                  autoFocus
                />
              </>
            ) : (
              <button
                type="button"
                onClick={() => startEditPrice(model)}
                style={styles.priceTag}
                title="Click to edit price"
              >
                {model.pricePerImage != null ? `$${model.pricePerImage}/img` : 'Set price'}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(model.id)}
            style={styles.removeBtn}
            title="Remove model"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
            </svg>
          </button>
        </div>
      ))}
      {adding ? (
        <div style={styles.addRow}>
          <input
            type="text"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Model name"
            style={styles.addInput}
            autoFocus
          />
          <button type="button" onClick={handleAdd} style={styles.confirmBtn}>Add</button>
          <button type="button" onClick={() => { setAdding(false); setNewModel(''); }} style={styles.cancelBtn}>Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} style={styles.addBtn}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 2v10M2 7h10" />
          </svg>
          Add model
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  empty: { color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-3)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
  },
  modelName: { fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', flex: 1 },
  priceArea: { display: 'flex', alignItems: 'center', gap: '2px' },
  dollarSign: { fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' },
  priceInput: {
    width: '60px',
    fontSize: 'var(--font-size-xs)',
    padding: '2px var(--space-1)',
    textAlign: 'right',
  },
  priceTag: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--text-muted)',
    padding: '2px var(--space-2)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    minHeight: 'auto',
    minWidth: 'auto',
  },
  removeBtn: {
    display: 'flex',
    alignItems: 'center',
    color: 'var(--text-muted)',
    padding: 'var(--space-1)',
    minHeight: 'auto',
    minWidth: 'auto',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    color: 'var(--accent)',
    fontSize: 'var(--font-size-sm)',
    padding: 'var(--space-2) 0',
  },
  addRow: { display: 'flex', gap: 'var(--space-2)', alignItems: 'center' },
  addInput: {
    flex: 1,
    fontSize: 'var(--font-size-sm)',
    padding: 'var(--space-2) var(--space-3)',
  },
  confirmBtn: {
    padding: 'var(--space-2) var(--space-3)',
    background: 'var(--accent)',
    color: 'white',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
  },
  cancelBtn: {
    padding: 'var(--space-2) var(--space-3)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-xs)',
  },
};
