/**
 * CameraAngleSelect Component
 *
 * Dropdown selector for camera angles.
 */
interface CameraAngleSelectProps {
  value: string;
  onChange: (angle: string) => void;
}

export const CAMERA_ANGLES = [
  { value: 'eye-level', label: 'Eye Level' },
  { value: 'high-angle', label: 'High Angle' },
  { value: 'low-angle', label: 'Low Angle' },
  { value: 'dutch-angle', label: 'Dutch Angle' },
  { value: 'birds-eye', label: "Bird's Eye" },
  { value: 'worms-eye', label: "Worm's Eye" },
  { value: 'overhead', label: 'Overhead' },
  { value: 'under', label: 'Under' },
] as const

export function CameraAngleSelect({ value, onChange }: CameraAngleSelectProps) {
  return (
    <select
      className="camera-angle-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {CAMERA_ANGLES.map((angle) => (
        <option key={angle.value} value={angle.value}>
          {angle.label}
        </option>
      ))}
    </select>
  );
}
