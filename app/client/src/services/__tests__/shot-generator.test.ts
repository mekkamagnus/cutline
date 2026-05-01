import { describe, it, expect } from 'vitest';
import { generateShotsFromScene } from '../shot-generator';
import type { ParsedScene } from '@/types';

function makeScene(overrides: Partial<ParsedScene> = {}): ParsedScene {
  return {
    id: 'scene-1',
    heading: 'INT. COFFEE SHOP - DAY',
    location: 'COFFEE SHOP',
    interior: true,
    timeOfDay: 'DAY',
    elements: [],
    characterAppearances: [],
    order: 1,
    ...overrides,
  };
}

describe('generateShotsFromScene', () => {
  it('returns empty array for scene with no elements', () => {
    const scene = makeScene();
    expect(generateShotsFromScene(scene)).toEqual([]);
  });

  it('generates establishing + wide shot for action-only scene', () => {
    const scene = makeScene({
      elements: [
        { id: 'e1', type: 'action', text: 'A cozy corner coffee shop. Rain patters against the window.', lineNumber: 1 },
        { id: 'e2', type: 'action', text: 'JANE sits alone at a corner table.', lineNumber: 2 },
      ],
    });

    const shots = generateShotsFromScene(scene);
    expect(shots.length).toBeGreaterThanOrEqual(2);
    expect(shots[0]!.type).toBe('establishing');
    expect(shots[0]!.actionDescription).toBe('INT. COFFEE SHOP - DAY');
    expect(shots[1]!.type).toBe('wide');
  });

  it('generates dialogue shots with alternating OTS and close-up', () => {
    const scene = makeScene({
      elements: [
        { id: 'e1', type: 'action', text: 'Setting the scene.', lineNumber: 1 },
        { id: 'e2', type: 'character', text: 'JANE', characterName: 'JANE', lineNumber: 3 },
        { id: 'e3', type: 'dialogue', text: "I've been waiting for hours.", characterName: 'JANE', lineNumber: 4 },
        { id: 'e4', type: 'character', text: 'MARK', characterName: 'MARK', lineNumber: 6 },
        { id: 'e5', type: 'dialogue', text: 'Jane! You are actually here?', characterName: 'MARK', lineNumber: 7 },
      ],
    });

    const shots = generateShotsFromScene(scene);
    const dialogueShots = shots.filter(s => s.type === 'over-the-shoulder' || s.type === 'close-up');
    expect(dialogueShots.length).toBe(2);
    expect(dialogueShots[0]!.type).toBe('over-the-shoulder');
    expect(dialogueShots[0]!.charactersInFrame).toEqual(['JANE']);
    expect(dialogueShots[1]!.type).toBe('close-up');
    expect(dialogueShots[1]!.charactersInFrame).toEqual(['MARK']);
  });

  it('merges parentheticals into dialogue shot description', () => {
    const scene = makeScene({
      elements: [
        { id: 'e1', type: 'character', text: 'JANE', characterName: 'JANE', lineNumber: 1 },
        { id: 'e2', type: 'parenthetical', text: '(sighing)', characterName: 'JANE', lineNumber: 2 },
        { id: 'e3', type: 'dialogue', text: "I've been waiting.", characterName: 'JANE', lineNumber: 3 },
      ],
    });

    const shots = generateShotsFromScene(scene);
    expect(shots).toHaveLength(1);
    expect(shots[0]!.actionDescription).toContain('sighing');
    expect(shots[0]!.actionDescription).toContain('waiting');
  });

  it('skips transitions (no separate shot)', () => {
    const scene = makeScene({
      elements: [
        { id: 'e1', type: 'transition', text: 'CUT TO:', lineNumber: 1 },
        { id: 'e2', type: 'action', text: 'A new scene begins.', lineNumber: 2 },
      ],
    });

    const shots = generateShotsFromScene(scene);
    expect(shots.every(s => s.actionDescription !== 'CUT TO:')).toBe(true);
  });

  it('generates two-shot for non-first action group with multiple characters', () => {
    const scene = makeScene({
      elements: [
        { id: 'e1', type: 'action', text: 'Setting the scene.', lineNumber: 1 },
        { id: 'e2', type: 'character', text: 'JANE', characterName: 'JANE', lineNumber: 3 },
        { id: 'e3', type: 'dialogue', text: 'Hello.', characterName: 'JANE', lineNumber: 4 },
        { id: 'e4', type: 'action', text: 'Jane and Mark sit together at the table.', lineNumber: 6 },
      ],
      characterAppearances: ['JANE', 'MARK'],
    });

    const shots = generateShotsFromScene(scene);
    const twoShots = shots.filter(s => s.type === 'two-shot');
    expect(twoShots.length).toBeGreaterThanOrEqual(1);
  });

  it('assigns sequential shot numbers', () => {
    const scene = makeScene({
      elements: [
        { id: 'e1', type: 'action', text: 'Setting.', lineNumber: 1 },
        { id: 'e2', type: 'character', text: 'JANE', characterName: 'JANE', lineNumber: 3 },
        { id: 'e3', type: 'dialogue', text: 'Hello.', characterName: 'JANE', lineNumber: 4 },
      ],
    });

    const shots = generateShotsFromScene(scene);
    shots.forEach((shot, i) => {
      expect(shot.shotNumber).toBe(i + 1);
    });
  });

  it('generates synthetic IDs with scene prefix', () => {
    const scene = makeScene({
      elements: [
        { id: 'e1', type: 'action', text: 'Setting.', lineNumber: 1 },
      ],
    });

    const shots = generateShotsFromScene(scene);
    expect(shots[0]!.id).toMatch(/^shot-scene-1-\d+$/);
  });

  it('caps duration between 2 and 10 seconds', () => {
    const longText = Array(50).fill('word').join(' ');
    const scene = makeScene({
      elements: [
        { id: 'e1', type: 'action', text: longText, lineNumber: 1 },
      ],
    });

    const shots = generateShotsFromScene(scene);
    shots.forEach(shot => {
      expect(shot.duration).toBeGreaterThanOrEqual(2);
      expect(shot.duration).toBeLessThanOrEqual(10);
    });
  });
});
