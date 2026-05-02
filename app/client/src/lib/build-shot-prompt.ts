import type { Shot } from '@/types';

export function buildShotPrompt(shot: Shot, style: string): string {
  const parts: string[] = [];
  parts.push(`${style} style storyboard`);
  parts.push(`${shot.type} shot`);
  parts.push(`${shot.angle} camera angle`);
  if (shot.movement !== 'static') {
    parts.push(`${shot.movement} camera movement`);
  }
  if (shot.actionDescription) {
    parts.push(shot.actionDescription);
  }
  if (shot.charactersInFrame.length > 0) {
    parts.push(`featuring ${shot.charactersInFrame.join(', ')}`);
  }
  return parts.join(', ');
}
