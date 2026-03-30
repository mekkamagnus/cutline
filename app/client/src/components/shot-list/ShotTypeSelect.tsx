/**
 * ShotTypeSelect Component
 *
 * Dropdown selector for shot types.
 */
interface ShotTypeSelectProps {
  value: string;
  onChange: (type: string) => void;
}

export const SHOT_TYPES = [
  { value: 'wide', label: 'Wide' },
  { value: 'medium', label: 'Medium' },
  { value: 'close-up', label: 'Close-up' },
  { value: 'extreme-cu', label: 'Extreme CU' },
  { value: 'two-shot', label: 'Two-shot' },
  { value: 'over-the-shoulder', label: 'Over-the-shoulder' },
  { value: 'establishing', label: 'Establishing' },
  { value: 'insert', label: 'Insert' },
  { value: 'pov', label: 'POV' },
  { value: 'aerial', label: 'Aerial' },
] as const;

export function ShotTypeSelect({ value, onChange }: ShotTypeSelectProps) {
  return (
    <select
      className="shot-type-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {SHOT_TYPES.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
}
