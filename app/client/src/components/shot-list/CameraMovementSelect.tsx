/**
 * CameraMovementSelect Component
 *
 * Dropdown selector for camera movements.
 */
interface CameraMovementSelectProps {
  value: string;
  onChange: (movement: string) => void;
}

export const CAMERA_MOVEMENTS = [
  { value: 'static', label: 'Static' },
  { value: 'pan', label: 'Pan' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'dolly', label: 'Dolly' },
  { value: 'truck', label: 'Truck' },
  { value: 'pedestal', label: 'Pedestal' },
  { value: 'arc', label: 'Arc' },
  { value: 'handheld', label: 'Handheld' },
  { value: 'steadicam', label: 'Steadicam' },
  { value: 'crane', label: 'Crane' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'rack-focus', label: 'Rack Focus' },
] as const

export function CameraMovementSelect({ value, onChange }: CameraMovementSelectProps) {
  return (
    <select
      className="camera-movement-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {CAMERA_MOVEMENTS.map((movement) => (
        <option key={movement.value} value={movement.value}>
          {movement.label}
        </option>
      ))}
    </select>
  );
}
