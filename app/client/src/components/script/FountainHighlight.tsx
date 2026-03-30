/**
 * FountainHighlight Component
 *
 * Provides syntax highlighting overlay for Fountain format scripts.
 * Uses ParseTokens to apply CSS classes to different element types.
 * Content is properly escaped to prevent XSS.
 */
import { useMemo } from 'react';
import type { ParseToken } from '@/services/fountain-parser';

interface FountainHighlightProps {
  tokens: ParseToken[];
  content: string;
}

export function FountainHighlight({ tokens, content }: FountainHighlightProps) {
  // Build highlighted content as React elements (safe from XSS)
  const highlightedLines = useMemo(() => {
    if (!content) return [];

    const lines = content.split('\n');
    const tokenMap = new Map<number, ParseToken>();

    // Map line numbers to tokens
    for (const token of tokens) {
      tokenMap.set(token.lineNumber, token);
    }

    // Build safe React elements
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const token = tokenMap.get(lineNumber);
      const type = token?.type || 'action';
      const className = `fountain-line ${getTokenClassName(type)}`;

      return (
        <div key={lineNumber} className={className} data-line={lineNumber}>
          {line || '\u00A0' /* Non-breaking space for empty lines */}
        </div>
      );
    });
  }, [tokens, content]);

  return (
    <div className="fountain-highlight" aria-hidden="true">
      {highlightedLines}
    </div>
  );
}

function getTokenClassName(type: ParseToken['type']): string {
  const classMap: Record<ParseToken['type'], string> = {
    scene_heading: 'fountain-scene-heading',
    action: 'fountain-action',
    character: 'fountain-character',
    dialogue: 'fountain-dialogue',
    parenthetical: 'fountain-parenthetical',
    transition: 'fountain-transition',
    centered: 'fountain-centered',
    lyrics: 'fountain-lyrics',
    page_break: 'fountain-page-break',
    section: 'fountain-section',
    synopse: 'fountain-synopse',
  };
  return classMap[type] || 'fountain-action';
}
