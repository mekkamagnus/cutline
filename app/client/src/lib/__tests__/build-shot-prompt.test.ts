import { describe, expect, it } from 'vitest';
import { buildShotPrompt } from '../build-shot-prompt';
import type { CameraAngle, Shot, ShotType } from '@/types';

function makeShot(overrides: Partial<Shot> = {}): Shot {
  const now = new Date('2026-05-12T00:00:00.000Z');

  return {
    id: 'shot-1',
    sceneId: 'scene-1',
    shotNumber: 1,
    type: 'wide',
    angle: 'eye-level',
    movement: 'static',
    charactersInFrame: ['JANE'],
    actionDescription: 'Jane crosses the empty train platform.',
    duration: 4,
    confirmed: true,
    confirmedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('buildShotPrompt', () => {
  it('builds a visual scene prompt for an action shot instead of comma-separated metadata', () => {
    const prompt = buildShotPrompt(
      makeShot({
        type: 'wide',
        angle: 'low-angle',
        movement: 'pan',
        charactersInFrame: ['JANE', 'MARK'],
        actionDescription: 'Jane crosses the empty train platform.',
      }),
      'cinematic',
    );

    expect(prompt).toContain('cinematic film still, photorealistic movie frame, dramatic lighting, shallow depth of field.');
    expect(prompt).toContain('wide angle showing the full scene and environment');
    expect(prompt).toContain('low angle looking up at the subject');
    expect(prompt).toContain('with a pan camera effect');
    expect(prompt).toContain('Depict this visual action: Jane crosses the empty train platform.');
    expect(prompt).toContain('Characters visible in frame: JANE, MARK.');
    expect(prompt).toContain('Detailed illustration, clear composition, professional storyboard quality.');
    expect(prompt).not.toContain('wide shot, low-angle camera angle');
  });

  it('frames dialogue as visible performance details', () => {
    const prompt = buildShotPrompt(
      makeShot({
        type: 'close-up',
        actionDescription: "I've been waiting for hours.",
        charactersInFrame: ['JANE'],
      }),
      'manga',
    );

    expect(prompt).toContain('tight close-up focusing on the subject');
    expect(prompt).toContain('A character speaks: "I\'ve been waiting for hours."');
    expect(prompt).toContain("Show the speaker's facial expression and body language");
    expect(prompt).not.toContain('Depict this visual action');
  });

  it('separates mixed dialogue and visible action in the same card description', () => {
    const prompt = buildShotPrompt(
      makeShot({
        type: 'over-the-shoulder',
        actionDescription: "(sighing) I've been waiting for hours. MARK enters, shaking off his wet umbrella. He spots Jane and approaches.",
        charactersInFrame: ['JANE'],
      }),
      'manga',
    );

    expect(prompt).toContain('A character speaks: "(sighing) I\'ve been waiting for hours."');
    expect(prompt).toContain('Also depict this visual action: MARK enters, shaking off his wet umbrella. He spots Jane and approaches.');
    expect(prompt).not.toContain('A character speaks: "(sighing) I\'ve been waiting for hours. MARK enters');
  });

  it('builds a valid prompt when the shot has no action description', () => {
    const prompt = buildShotPrompt(
      makeShot({
        actionDescription: '',
        charactersInFrame: ['JANE'],
      }),
      'manga',
    );

    expect(prompt).toContain('manga style storyboard illustration.');
    expect(prompt).toContain('wide angle showing the full scene and environment');
    expect(prompt).toContain('Characters visible in frame: JANE.');
    expect(prompt).not.toContain('Depict this visual action');
    expect(prompt).not.toContain('A character speaks');
  });

  it('uses film-still language for cinematic style instead of illustration', () => {
    const prompt = buildShotPrompt(
      makeShot({
        type: 'close-up',
        actionDescription: 'JANE stares out the rain-streaked window.',
        charactersInFrame: ['JANE'],
      }),
      'cinematic',
    );

    expect(prompt).toContain('cinematic film still, photorealistic movie frame');
    expect(prompt).toContain('dramatic lighting, shallow depth of field');
    expect(prompt).not.toContain('storyboard illustration');
  });

  it('uses film-noir language for noir style instead of illustration', () => {
    const prompt = buildShotPrompt(
      makeShot({
        type: 'medium',
        actionDescription: 'MARK steps into the dimly lit hallway.',
        charactersInFrame: ['MARK'],
      }),
      'noir',
    );

    expect(prompt).toContain('film noir style cinematic still');
    expect(prompt).toContain('high contrast black and white');
    expect(prompt).toContain('dramatic shadows');
    expect(prompt).not.toContain('storyboard illustration');
  });

  it('omits the character sentence when no characters are in frame', () => {
    const prompt = buildShotPrompt(
      makeShot({
        charactersInFrame: [],
      }),
      'manga',
    );

    expect(prompt).not.toContain('Characters visible in frame:');
  });

  it('does not mention a camera effect for static movement', () => {
    const prompt = buildShotPrompt(
      makeShot({
        movement: 'static',
      }),
      'manga',
    );

    expect(prompt).not.toContain('camera effect');
  });

  it('includes a camera effect for non-static movement', () => {
    const prompt = buildShotPrompt(
      makeShot({
        movement: 'dolly',
      }),
      'manga',
    );

    expect(prompt).toContain('with a dolly camera effect');
  });

  it.each([
    ['wide', 'wide angle showing the full scene and environment'],
    ['medium', 'medium shot from the waist up'],
    ['close-up', "tight close-up focusing on the subject's face and expression"],
    ['extreme-cu', 'extreme close-up on a specific detail'],
    ['two-shot', 'two characters framed together in the shot'],
    ['over-the-shoulder', "shot looking past one person's shoulder toward another person"],
    ['establishing', 'wide establishing shot showing the full location and setting'],
    ['insert', 'focused insert shot of a specific object or detail'],
  ] satisfies ReadonlyArray<readonly [ShotType, string]>)('maps %s to visual framing language', (type, expected) => {
    const prompt = buildShotPrompt(
      makeShot({
        type,
      }),
      'manga',
    );

    expect(prompt).toContain(expected);
  });

  it.each([
    ['eye-level', 'straight-on eye-level perspective'],
    ['high-angle', 'high angle looking down at the subject'],
    ['low-angle', 'low angle looking up at the subject'],
    ['dutch-angle', 'tilted dutch angle creating visual tension'],
    ['birds-eye', "bird's eye view looking straight down"],
    ['worms-eye', "worm's eye view from ground level looking up"],
  ] satisfies ReadonlyArray<readonly [CameraAngle, string]>)('maps %s to visual angle language', (angle, expected) => {
    const prompt = buildShotPrompt(
      makeShot({
        angle,
      }),
      'manga',
    );

    expect(prompt).toContain(expected);
  });
});
