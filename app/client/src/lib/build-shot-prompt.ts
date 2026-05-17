import type { CameraAngle, Shot, ShotType } from '@/types';

const SHOT_TYPE_VISUALS = {
  wide: 'wide angle showing the full scene and environment',
  medium: 'medium shot from the waist up',
  'close-up': "tight close-up focusing on the subject's face and expression",
  'extreme-cu': 'extreme close-up on a specific detail',
  'two-shot': 'two characters framed together in the shot',
  'over-the-shoulder': "shot looking past one person's shoulder toward another person",
  establishing: 'wide establishing shot showing the full location and setting',
  insert: 'focused insert shot of a specific object or detail',
} satisfies Record<ShotType, string>;

const CAMERA_ANGLE_VISUALS = {
  'eye-level': 'straight-on eye-level perspective',
  'high-angle': 'high angle looking down at the subject',
  'low-angle': 'low angle looking up at the subject',
  'dutch-angle': 'tilted dutch angle creating visual tension',
  'birds-eye': "bird's eye view looking straight down",
  'worms-eye': "worm's eye view from ground level looking up",
} satisfies Record<CameraAngle, string>;

const DIRECT_SPEECH_PATTERN =
  /\b(i|i'm|i've|i'll|i'd|me|my|mine|we|we're|we've|we'll|we'd|us|our|ours|you|you're|you've|you'll|you'd|your|yours)\b/i;

const VISUAL_ACTION_PATTERN =
  /\b(sits?|stands?|walks?|runs?|looks?|turns?|moves?|opens?|closes?|enters?|exits?|crosses?|holds?|grabs?|takes?|puts?|sets?|leans?|reaches?|stares?|smiles?|frowns?|nods?|shakes?|steps?|drives?|falls?|watches?|reveals?|shows?|picks?|drops?|pushes?|pulls?)\b/i;

const VISUAL_ACTION_START_PATTERN =
  /^(?:[A-Z][A-Za-z0-9_-]*|he|she|they|someone|a|an|the)\s+(?:sits?|stands?|walks?|runs?|looks?|turns?|moves?|opens?|closes?|enters?|exits?|crosses?|holds?|grabs?|takes?|puts?|sets?|leans?|reaches?|stares?|smiles?|frowns?|nods?|shakes?|steps?|drives?|falls?|watches?|reveals?|shows?|picks?|drops?|pushes?|pulls?)\b/i;

interface DialogueActionParts {
  dialogue: string;
  action: string;
}

function ensureTerminalPunctuation(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function isDialogueLike(shot: Shot, description: string): boolean {
  const trimmed = description.trim();
  if (!trimmed) return false;
  if (/^["']/.test(trimmed)) return true;
  if (/^\([^)]+\)/.test(trimmed)) return true;
  if (/[?!]/.test(trimmed)) return true;
  if (DIRECT_SPEECH_PATTERN.test(trimmed)) return true;

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const dialogueFraming = shot.type === 'close-up' || shot.type === 'over-the-shoulder';
  return dialogueFraming
    && shot.charactersInFrame.length <= 1
    && wordCount > 0
    && wordCount <= 10
    && !VISUAL_ACTION_PATTERN.test(trimmed);
}

function splitDialogueAndAction(description: string): DialogueActionParts {
  const trimmed = description.trim();
  const parentheticalLength = trimmed.match(/^\([^)]+\)\s*/)?.[0].length ?? 0;
  const dialogueText = trimmed.slice(parentheticalLength);
  const sentenceEndPattern = /[.!?](?=\s|$)/g;

  for (const match of dialogueText.matchAll(sentenceEndPattern)) {
    if (match.index === undefined) continue;

    const dialogueEnd = parentheticalLength + match.index + 1;
    const possibleAction = trimmed.slice(dialogueEnd).trim();
    if (possibleAction && VISUAL_ACTION_START_PATTERN.test(possibleAction)) {
      return {
        dialogue: trimmed.slice(0, dialogueEnd).trim(),
        action: possibleAction,
      };
    }
  }

  return {
    dialogue: trimmed,
    action: '',
  };
}

const STYLE_PREFIXES: Record<string, string> = {
  'pencil-sketch': 'pencil sketch style storyboard illustration',
  'ink-drawing': 'ink drawing style storyboard illustration',
  'manga': 'manga style storyboard illustration',
  'watercolor': 'watercolor style storyboard illustration',
  'cinematic': 'cinematic film still, photorealistic movie frame, dramatic lighting, shallow depth of field',
  'noir': 'film noir style cinematic still, high contrast black and white, dramatic shadows, moody atmosphere',
  'storyboard': 'traditional storyboard illustration',
};

export function buildShotPrompt(shot: Shot, style: string): string {
  const styleKey = style.trim();
  const stylePrefix = styleKey ? (STYLE_PREFIXES[styleKey] ?? `${styleKey} style storyboard illustration`) : 'storyboard illustration';
  const movement = shot.movement !== 'static'
    ? `, with a ${shot.movement} camera effect`
    : '';

  const sentences = [
    `${stylePrefix}. ${SHOT_TYPE_VISUALS[shot.type]}, ${CAMERA_ANGLE_VISUALS[shot.angle]}${movement}.`,
  ];

  const description = shot.actionDescription.trim();
  if (description) {
    if (isDialogueLike(shot, description)) {
      const { dialogue, action } = splitDialogueAndAction(description);
      const terminal = /[.!?]$/.test(dialogue) ? '' : '.';
      sentences.push(`A character speaks: "${dialogue}"${terminal} Show the speaker's facial expression and body language conveying the emotion of the words.`);
      if (action) {
        sentences.push(`Also depict this visual action: ${ensureTerminalPunctuation(action)}`);
      }
    } else {
      sentences.push(`Depict this visual action: ${ensureTerminalPunctuation(description)}`);
    }
  }

  if (shot.charactersInFrame.length > 0) {
    sentences.push(`Characters visible in frame: ${shot.charactersInFrame.join(', ')}.`);
  }

  sentences.push('Detailed illustration, clear composition, professional storyboard quality.');

  return sentences.join(' ');
}
