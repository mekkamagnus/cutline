/**
 * Fountain Parser
 *
 * Parses Fountain format screenplays into structured data.
 * Reference: architecture.md lines 1851-2060
 */
import { Result, AppError } from '@/lib/fp';
import type {
  ParsedScript,
  ParsedScene,
  ScriptElement,
  CharacterStats,
  ScriptMetadata,
  TimeOfDay,
} from '@/types';

// Regex patterns for Fountain elements
const SCENE_HEADING_REGEX = /^((?:\*{0,3}_?)?(?:(?:INT|EXT|EST|INT\.?\/EXT|EXT\.?\/INT|I\/E)[. ]).+)|^(?:\.(?!\.+))(.+)/i;
const CHARACTER_REGEX = /^([A-Z][A-Z0-9_\-() ]*[0-9A-Z])(?:\s*\([^)]+\))*$/;
const DIALOGUE_REGEX = /^[ \t]+(.+)$/;
const PARENTHETICAL_REGEX = /^\(([^)]+)\)$/;
const TRANSITION_REGEX = /^((?:FADE(?:\s+_?IN\s*| TO:)|CUT TO:|CUT TO BLACK|DISSOLVE TO:|SMASH CUT:|TIME CUT:|FREEZE:|BACK TO:|INTERCUT:)[^A-Za-z]*)|^([A-Z]+ TO:)$/;
const PAGE_BREAK_REGEX = /^={3,}$/;
const CENTERED_REGEX = /^> *(.+?) *<$/;
const LYRICS_REGEX = /^~(.+)$/;

// Time of day mapping
const TIME_OF_DAY_MAP: Record<string, TimeOfDay> = {
  'DAY': 'DAY',
  'NIGHT': 'NIGHT',
  'DAWN': 'DAWN',
  'DUSK': 'DUSK',
  'MORNING': 'MORNING',
  'AFTERNOON': 'AFTERNOON',
  'EVENING': 'EVENING',
  'MAGIC HOUR': 'MAGIC HOUR',
  'MAGIC': 'MAGIC HOUR',
  'GOLDEN HOUR': 'MAGIC HOUR',
};

export interface ParseResult {
  script: ParsedScript;
  tokens: ParseToken[];
}

export interface ParseToken {
  type: 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'centered' | 'lyrics' | 'page_break' | 'section' | 'synopse';
  text: string;
  lineNumber: number;
  metadata?: Record<string, unknown>;
}

export class FountainParser {
  /**
   * Parse Fountain text into structured script data
   */
  parse(text: string): Result<AppError, ParsedScript> {
    try {
      const lines = text.split('\n');
      const scenes: ParsedScene[] = [];
      const characters = new Map<string, CharacterStats>();
      const tokens: ParseToken[] = [];

      let currentScene: ParsedScene | null = null;
      let currentCharacter: string | null = null;
      let elementOrder = 1;
      let wordCount = 0;
      let inDialogueBlock = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        const lineNumber = i + 1;

        // Skip empty lines
        if (!trimmedLine) {
          inDialogueBlock = false;
          continue;
        }

        wordCount += trimmedLine.split(/\s+/).length;

        // Scene Heading
        if (this.isSceneHeading(trimmedLine)) {
          if (currentScene) {
            scenes.push(currentScene);
          }

          const parsedScene = this.parseSceneHeading(trimmedLine, lineNumber);
          currentScene = {
            id: `scene-${scenes.length + 1}`,
            heading: trimmedLine,
            location: parsedScene.location,
            interior: parsedScene.interior,
            timeOfDay: parsedScene.timeOfDay,
            elements: [],
            characterAppearances: [],
            order: scenes.length + 1,
          };

          tokens.push({
            type: 'scene_heading',
            text: trimmedLine,
            lineNumber,
            metadata: parsedScene,
          });

          inDialogueBlock = false;
          continue;
        }

        // Character name (start of dialogue block)
        if (this.isCharacterName(trimmedLine) && currentScene) {
          const characterName = this.parseCharacterName(trimmedLine);

          currentCharacter = characterName;
          inDialogueBlock = true;

          // Track character stats
          if (!characters.has(characterName)) {
            characters.set(characterName, {
              name: characterName,
              dialogueCount: 0,
              sceneAppearances: [],
            });
          }

          const charStats = characters.get(characterName)!;
          if (!charStats.sceneAppearances.includes(currentScene.id)) {
            charStats.sceneAppearances.push(currentScene.id);
          }

          const element: ScriptElement = {
            id: `elem-${elementOrder++}`,
            type: 'character',
            text: trimmedLine,
            characterName,
            lineNumber,
          };

          currentScene.elements.push(element);
          tokens.push({
            type: 'character',
            text: trimmedLine,
            lineNumber,
            metadata: { characterName },
          });
          continue;
        }

        // Parenthetical
        if (PARENTHETICAL_REGEX.test(trimmedLine) && inDialogueBlock && currentScene && currentCharacter) {
          const element: ScriptElement = {
            id: `elem-${elementOrder++}`,
            type: 'parenthetical',
            text: trimmedLine,
            characterName: currentCharacter,
            lineNumber,
          };

          currentScene.elements.push(element);
          tokens.push({
            type: 'parenthetical',
            text: trimmedLine,
            lineNumber,
            metadata: { characterName: currentCharacter },
          });
          continue;
        }

        // Dialogue
        if (DIALOGUE_REGEX.test(line) && inDialogueBlock && currentScene && currentCharacter) {
          const dialogueText = DIALOGUE_REGEX.exec(line)?.[1] || trimmedLine;

          const element: ScriptElement = {
            id: `elem-${elementOrder++}`,
            type: 'dialogue',
            text: dialogueText,
            characterName: currentCharacter,
            lineNumber,
          };

          currentScene.elements.push(element);
          tokens.push({
            type: 'dialogue',
            text: dialogueText,
            lineNumber,
            metadata: { characterName: currentCharacter },
          });

          // Increment dialogue count
          const charStats = characters.get(currentCharacter);
          if (charStats) {
            charStats.dialogueCount++;
          }
          continue;
        }

        // Transition
        if (TRANSITION_REGEX.test(trimmedLine)) {
          if (currentScene) {
            const element: ScriptElement = {
              id: `elem-${elementOrder++}`,
              type: 'transition',
              text: trimmedLine,
              lineNumber,
            };
            currentScene.elements.push(element);
          }

          tokens.push({
            type: 'transition',
            text: trimmedLine,
            lineNumber,
          });

          inDialogueBlock = false;
          continue;
        }

        // Centered text
        if (CENTERED_REGEX.test(trimmedLine)) {
          const centeredText = CENTERED_REGEX.exec(trimmedLine)?.[1] || '';

          if (currentScene) {
            const element: ScriptElement = {
              id: `elem-${elementOrder++}`,
              type: 'centered',
              text: centeredText,
              lineNumber,
            };
            currentScene.elements.push(element);
          }

          tokens.push({
            type: 'centered',
            text: centeredText,
            lineNumber,
          });
          continue;
        }

        // Lyrics
        if (LYRICS_REGEX.test(trimmedLine)) {
          const lyricsText = LYRICS_REGEX.exec(trimmedLine)?.[1] || '';

          if (currentScene) {
            const element: ScriptElement = {
              id: `elem-${elementOrder++}`,
              type: 'lyrics',
              text: lyricsText,
              lineNumber,
            };
            currentScene.elements.push(element);
          }

          tokens.push({
            type: 'lyrics',
            text: lyricsText,
            lineNumber,
          });
          continue;
        }

        // Page break
        if (PAGE_BREAK_REGEX.test(trimmedLine)) {
          tokens.push({
            type: 'page_break',
            text: '===',
            lineNumber,
          });
          continue;
        }

        // Action (default)
        if (currentScene) {
          const element: ScriptElement = {
            id: `elem-${elementOrder++}`,
            type: 'action',
            text: trimmedLine,
            lineNumber,
          };
          currentScene.elements.push(element);
        }

        tokens.push({
          type: 'action',
          text: trimmedLine,
          lineNumber,
        });

        inDialogueBlock = false;
      }

      // Add final scene
      if (currentScene) {
        scenes.push(currentScene);
      }

      // Calculate metadata
      const metadata: ScriptMetadata = {
        pageCount: Math.ceil(tokens.filter((t) => t.type === 'page_break').length + 1),
        wordCount,
        estimatedDuration: Math.round(wordCount / 250), // ~250 words per minute for screenplays
      };

      return Result.ok({
        title: this.extractTitle(text),
        author: this.extractAuthor(text),
        scenes,
        characters,
        metadata,
      });
    } catch (error) {
      return Result.err(
        AppError.parse('Failed to parse Fountain script', {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }

  /**
   * Get highlight tokens for syntax highlighting
   */
  getHighlightTokens(text: string): Result<AppError, ParseToken[]> {
    const parseResult = this.parse(text);
    if (parseResult.isErr()) {
      return parseResult;
    }
    // Return tokens from a separate tokenization pass
    // For now, reuse the parse logic
    const lines = text.split('\n');
    const tokens: ParseToken[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const token = this.classifyLine(line, i + 1);
      if (token) {
        tokens.push(token);
      }
    }

    return Result.ok(tokens);
  }

  /**
   * Get scene at a specific line
   */
  getSceneAtLine(text: string, lineNumber: number): Result<AppError, ParsedScene | null> {
    const parseResult = this.parse(text);
    if (parseResult.isErr()) {
      return parseResult;
    }

    const script = parseResult.unwrap();

    for (const scene of script.scenes) {
      const firstLine = scene.elements[0]?.lineNumber || lineNumber;
      const lastLine = scene.elements[scene.elements.length - 1]?.lineNumber || firstLine;

      if (lineNumber >= firstLine && lineNumber <= lastLine) {
        return Result.ok(scene);
      }
    }

    return Result.ok(null);
  }

  // Private helper methods

  private isSceneHeading(line: string): boolean {
    return SCENE_HEADING_REGEX.test(line);
  }

  private isCharacterName(line: string): boolean {
    // Must be uppercase and not start with common non-character prefixes
    if (!CHARACTER_REGEX.test(line)) return false;
    if (line.startsWith('INT') || line.startsWith('EXT')) return false;
    if (TRANSITION_REGEX.test(line)) return false;
    return true;
  }

  private parseSceneHeading(line: string, lineNumber: number): {
    location: string;
    interior: boolean;
    timeOfDay: TimeOfDay;
  } {
    // Parse: INT. LOCATION - TIME OF DAY
    const interiorMatch = line.match(/^(INT\.?|INT\.?\/EXT\.?|EXT\.?\/INT\.?)/i);
    const isInterior = interiorMatch ? interiorMatch[1].toUpperCase().startsWith('INT') : true;

    // Extract location (between scene type and dash)
    const locationMatch = line.match(/(?:INT\.?|EXT\.?|EST\.?|INT\.?\/EXT\.?|EXT\.?\/INT\.?|I\/E)[.\s]+([^-\n]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : 'UNKNOWN';

    // Extract time of day (after dash)
    const timeMatch = line.match(/-\s*([A-Z\s]+)$/i);
    let timeOfDay: TimeOfDay = 'DAY';

    if (timeMatch) {
      const timeStr = timeMatch[1].trim().toUpperCase();
      for (const [key, value] of Object.entries(TIME_OF_DAY_MAP)) {
        if (timeStr.includes(key)) {
          timeOfDay = value;
          break;
        }
      }
    }

    return { location, interior: isInterior, timeOfDay };
  }

  private parseCharacterName(line: string): string {
    // Remove parenthetical extensions like (V.O.) or (O.S.)
    const match = line.match(/^([A-Z][A-Z0-9_\-() ]*[0-9A-Z])/);
    return match ? match[1].trim() : line.trim();
  }

  private extractTitle(text: string): string | undefined {
    // Title is typically the first non-empty line or from title page
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('INT') && !trimmed.startsWith('EXT')) {
        // Check if it looks like a title (short, not action)
        if (trimmed.length < 100 && !trimmed.includes(':')) {
          return trimmed;
        }
      }
    }
    return undefined;
  }

  private extractAuthor(text: string): string | undefined {
    // Look for "by" or "written by" patterns
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('written by') || line.includes('by:')) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine) {
          return nextLine;
        }
      }
    }
    return undefined;
  }

  private classifyLine(line: string, lineNumber: number): ParseToken | null {
    if (this.isSceneHeading(line)) {
      return { type: 'scene_heading', text: line, lineNumber };
    }
    if (TRANSITION_REGEX.test(line)) {
      return { type: 'transition', text: line, lineNumber };
    }
    if (this.isCharacterName(line)) {
      return { type: 'character', text: line, lineNumber };
    }
    if (PARENTHETICAL_REGEX.test(line)) {
      return { type: 'parenthetical', text: line, lineNumber };
    }
    if (CENTERED_REGEX.test(line)) {
      return { type: 'centered', text: CENTERED_REGEX.exec(line)?.[1] || '', lineNumber };
    }
    if (LYRICS_REGEX.test(line)) {
      return { type: 'lyrics', text: LYRICS_REGEX.exec(line)?.[1] || '', lineNumber };
    }
    if (PAGE_BREAK_REGEX.test(line)) {
      return { type: 'page_break', text: '===', lineNumber };
    }
    return { type: 'action', text: line, lineNumber };
  }
}

// Singleton instance
export const fountainParser = new FountainParser();
