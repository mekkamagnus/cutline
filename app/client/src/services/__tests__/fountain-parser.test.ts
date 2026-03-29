/**
 * Fountain Parser Tests
 *
 * Tests for Fountain format screenplay parsing.
 */
import { describe, it, expect } from 'vitest';
import { FountainParser } from '../fountain-parser';
import { Result } from '@/lib/fp';

describe('FountainParser', () => {
  const parser = new FountainParser();

  describe('scene headings', () => {
    it('parses INT. location - DAY', () => {
      const result = parser.parse('INT. OFFICE - DAY');
      expect(Result.isOk(result)).toBe(true);

      const script = Result.unwrap(result);
      expect(script.scenes).toHaveLength(1);
      expect(script.scenes[0].heading).toBe('INT. OFFICE - DAY');
      expect(script.scenes[0].location).toBe('OFFICE');
      expect(script.scenes[0].timeOfDay).toBe('DAY');
      expect(script.scenes[0].interior).toBe(true);
    });

    it('parses EXT. location - NIGHT', () => {
      const result = parser.parse('EXT. BEACH - NIGHT');
      expect(Result.isOk(result)).toBe(true);

      const scene = Result.unwrap(result).scenes[0];
      expect(scene.interior).toBe(false);
      expect(scene.timeOfDay).toBe('NIGHT');
    });

    it('parses INT/EXT locations', () => {
      const result = parser.parse('INT./EXT. CAR - MOVING - DAY');
      expect(Result.isOk(result)).toBe(true);

      const scene = Result.unwrap(result).scenes[0];
      expect(scene.heading).toContain('CAR');
    });

    it('ignores non-scene headings', () => {
      const result = parser.parse('This is just action text.');
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result).scenes).toHaveLength(0);
    });
  });

  describe('character dialogue', () => {
    it('extracts character names and dialogue', () => {
      const script = `INT. OFFICE - DAY

JOHN
(happy)
Hello, world!

SARAH
Hi there!`;

      const result = parser.parse(script);
      expect(Result.isOk(result)).toBe(true);

      const parsed = Result.unwrap(result);
      expect(parsed.scenes).toHaveLength(1);
      expect(parsed.characters.size).toBe(2);
      expect(parsed.characters.has('JOHN')).toBe(true);
      expect(parsed.characters.has('SARAH')).toBe(true);
    });

    it('tracks dialogue counts', () => {
      const script = `INT. OFFICE - DAY

JOHN
First line.

JOHN
Second line.

JOHN
Third line.`;

      const result = parser.parse(script);
      expect(Result.isOk(result)).toBe(true);

      const john = Result.unwrap(result).characters.get('JOHN');
      expect(john?.dialogueCount).toBe(3);
    });

    it('handles parentheticals', () => {
      const script = `INT. OFFICE - DAY

JOHN
(whispering)
This is a secret.`;

      const result = parser.parse(script);
      expect(Result.isOk(result)).toBe(true);

      const scene = Result.unwrap(result).scenes[0];
      const parenthetical = scene.elements.find((e) => e.type === 'parenthetical');
      expect(parenthetical?.text).toBe('(whispering)');
    });
  });

  describe('transitions', () => {
    it('recognizes CUT TO:', () => {
      const script = `INT. OFFICE - DAY

Action line.

CUT TO:

EXT. BEACH - DAY`;

      const result = parser.parse(script);
      expect(Result.isOk(result)).toBe(true);

      const transitions = Result.unwrap(result).scenes[0].elements.filter((e) => e.type === 'transition');
      expect(transitions).toHaveLength(1);
      expect(transitions[0].text).toBe('CUT TO:');
    });

    it('recognizes FADE TO:', () => {
      const script = `INT. OFFICE - DAY

FADE TO BLACK.`;

      const result = parser.parse(script);
      expect(Result.isOk(result)).toBe(true);
    });
  });

  describe('action lines', () => {
    it('parses action as default', () => {
      const script = `INT. OFFICE - DAY

John enters the room. He looks around nervously.

The clock on the wall shows midnight.`;

      const result = parser.parse(script);
      expect(Result.isOk(result)).toBe(true);

      const actions = Result.unwrap(result).scenes[0].elements.filter((e) => e.type === 'action');
      expect(actions).toHaveLength(2);
    });
  });

  describe('multiple scenes', () => {
    it('separates scenes correctly', () => {
      const script = `INT. OFFICE - DAY

Action in office.

EXT. BEACH - NIGHT

Action on beach.

INT. BEDROOM - DAY

Action in bedroom.`;

      const result = parser.parse(script);
      expect(Result.isOk(result)).toBe(true);

      const parsed = Result.unwrap(result);
      expect(parsed.scenes).toHaveLength(3);
      expect(parsed.scenes[0].location).toBe('OFFICE');
      expect(parsed.scenes[1].location).toBe('BEACH');
      expect(parsed.scenes[2].location).toBe('BEDROOM');
    });
  });

  describe('metadata', () => {
    it('calculates word count', () => {
      const script = `INT. OFFICE - DAY

John speaks.`;

      const result = parser.parse(script);
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result).metadata.wordCount).toBeGreaterThan(0);
    });

    it('estimates duration', () => {
      const result = parser.parse('INT. OFFICE - DAY\n\nAction.');
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result).metadata.estimatedDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('highlight tokens', () => {
    it('classifies lines correctly', () => {
      const script = `INT. OFFICE - DAY

JOHN
Hello!`;

      const result = parser.getHighlightTokens(script);
      expect(Result.isOk(result)).toBe(true);

      const tokens = Result.unwrap(result);
      expect(tokens.some((t) => t.type === 'scene_heading')).toBe(true);
      expect(tokens.some((t) => t.type === 'character')).toBe(true);
      expect(tokens.some((t) => t.type === 'dialogue')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty script', () => {
      const result = parser.parse('');
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result).scenes).toHaveLength(0);
    });

    it('handles script with only whitespace', () => {
      const result = parser.parse('   \n\n   \n');
      expect(Result.isOk(result)).toBe(true);
      expect(Result.unwrap(result).scenes).toHaveLength(0);
    });

    it('handles lowercase character names (invalid)', () => {
      const script = `INT. OFFICE - DAY

john
This should be action, not dialogue.`;

      const result = parser.parse(script);
      expect(Result.isOk(result)).toBe(true);
      // Lowercase should be treated as action
      const scene = Result.unwrap(result).scenes[0];
      expect(scene.elements.some((e) => e.type === 'character')).toBe(false);
    });
  });
});
