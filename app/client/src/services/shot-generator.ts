import type { ParsedScene, Shot, ShotType, CameraAngle, CameraMovement } from '@/types';

export function generateShotsFromScene(scene: ParsedScene): Shot[] {
  const shots: Shot[] = [];
  let shotNumber = 1;
  const now = new Date();

  const makeShot = (
    type: ShotType,
    angle: CameraAngle,
    movement: CameraMovement,
    duration: number,
    characters: string[],
    description: string,
  ): Shot => ({
    id: `shot-${scene.id}-${shotNumber}`,
    sceneId: scene.id,
    shotNumber: shotNumber++,
    type,
    angle,
    movement,
    charactersInFrame: characters,
    actionDescription: description,
    duration: Math.max(2, Math.min(10, duration)),
    confirmed: false,
    createdAt: now,
    updatedAt: now,
  });

  const elements = scene.elements;
  if (elements.length === 0) return shots;

  let dialogueTurnIndex = 0;

  let i = 0;
  while (i < elements.length) {
    const el = elements[i];
    if (!el) { i++; continue; }

    // Scene heading → establishing shot
    if (el.type === 'action' && i === 0 && scene.heading) {
      shots.push(makeShot('establishing', 'eye-level', 'static', 3, [], scene.heading));
      const actionTexts = [el.text];
      let j = i + 1;
      while (j < elements.length) {
        const next = elements[j];
        if (!next || next.type !== 'action') break;
        actionTexts.push(next.text);
        j++;
      }
      if (actionTexts.length > 1) {
        const words = actionTexts.join(' ').split(/\s+/).length;
        shots.push(makeShot('wide', 'eye-level', 'static', Math.ceil(words * 0.5), [], actionTexts.join(' ')));
      }
      i = j;
      continue;
    }

    // Action elements → wide or two-shot
    if (el.type === 'action') {
      const actionTexts = [el.text];
      let j = i + 1;
      while (j < elements.length) {
        const next = elements[j];
        if (!next || next.type !== 'action') break;
        actionTexts.push(next.text);
        j++;
      }
      const text = actionTexts.join(' ');
      const words = text.split(/\s+/).length;
      const characters = Array.from(scene.characterAppearances);
      shots.push(makeShot(
        characters.length >= 2 ? 'two-shot' : 'wide',
        'eye-level', 'static', Math.ceil(words * 0.5),
        characters.slice(0, 2), text,
      ));
      i = j;
      continue;
    }

    // Character + dialogue + parenthetical → dialogue shot
    if (el.type === 'character' && el.characterName) {
      const character = el.characterName;
      const dialogueTexts: string[] = [];
      let j = i + 1;
      while (j < elements.length) {
        const next = elements[j];
        if (!next || (next.type !== 'dialogue' && next.type !== 'parenthetical')) break;
        dialogueTexts.push(next.text);
        j++;
      }
      const text = dialogueTexts.join(' ');
      const words = text.split(/\s+/).length;
      const isOts = dialogueTurnIndex % 2 === 0;
      dialogueTurnIndex++;
      shots.push(makeShot(
        isOts ? 'over-the-shoulder' : 'close-up',
        'eye-level', 'static', Math.ceil(words * 0.3),
        [character], text,
      ));
      i = j;
      continue;
    }

    // Transition → skip
    if (el.type === 'transition') {
      i++;
      continue;
    }

    i++;
  }

  return shots;
}
