/**
 * ShotForm Component
 *
 * Form for adding and editing individual shots.
 */
import { useState, useEffect } from 'react';
import { ShotTypeSelect } from './ShotTypeSelect';
import { CameraAngleSelect } from './CameraAngleSelect';
import { CameraMovementSelect } from './CameraMovementSelect';
import type { Shot, ShotData } from '@/types';

interface ShotFormProps {
  initialData?: Shot;
  onSave: (data: ShotData) => void;
  onCancel: () => void;
  shotNumber?: number;
  isCreating?: boolean;
}

const defaultFormData: ShotData = {
  type: 'medium',
  angle: 'eye-level',
  movement: 'static',
  charactersInFrame: [],
  actionDescription: '',
  duration: 5,
  notes: undefined,
};

export function ShotForm({ initialData, onSave, onCancel, shotNumber, isCreating }: ShotFormProps) {
  const [formData, setFormData] = useState<ShotData>(
    initialData ? { ...initialData } : defaultFormData
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = <K extends keyof ShotData>(
    field: K,
    value: ShotData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form className="shot-form" onSubmit={handleSubmit}>
      <div className="shot-form__row">
        <label className="shot-form__label">Shot Type</label>
        <ShotTypeSelect
          value={formData.type}
          onChange={(type) => updateField('type', type)}
        />
      </div>

      <div className="shot-form__row">
        <label className="shot-form__label">Camera Angle</label>
        <CameraAngleSelect
          value={formData.angle}
          onChange={(angle) => updateField('angle', angle)}
        />
      </div>

      <div className="shot-form__row">
        <label className="shot-form__label">Camera Movement</label>
        <CameraMovementSelect
          value={formData.movement}
          onChange={(movement) => updateField('movement', movement)}
        />
      </div>

      <div className="shot-form__row">
        <label className="shot-form__label">Characters in Frame</label>
        <input
          type="text"
          className="shot-form__input"
          value={formData.charactersInFrame.join(', ')}
          onChange={(e) =>
            updateField(
              'charactersInFrame',
              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
            )
          }
          placeholder="Character names separated by commas"
        />
      </div>

      <div className="shot-form__row shot-form__row--full">
        <label className="shot-form__label">Action Description</label>
        <textarea
          className="shot-form__textarea"
          value={formData.actionDescription}
          onChange={(e) => updateField('actionDescription', e.target.value)}
          placeholder="Describe what happens in this shot..."
          rows={3}
          required
        />
      </div>

      <div className="shot-form__row">
        <label className="shot-form__label">Duration (seconds)</label>
        <input
          type="number"
          className="shot-form__input"
          value={formData.duration}
          onChange={(e) => updateField('duration', parseInt(e.target.value, 10) || 5)}
          min={1}
          max={60}
        />
      </div>

      <div className="shot-form__row shot-form__row--full">
        <label className="shot-form__label">Notes (optional)</label>
        <textarea
          className="shot-form__textarea"
          value={formData.notes || ''}
          onChange={(e) => updateField('notes', e.target.value || undefined)}
          placeholder="Additional notes for this shot..."
          rows={2}
        />
      </div>

      <div className="shot-form__actions">
        <button
          type="button"
          className="shot-form__btn shot-form__btn--cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="shot-form__btn shot-form__btn--save"
        >
          {isCreating ? 'Add Shot' : 'Update Shot'}
        </button>
      </div>
    </form>
  );
}
