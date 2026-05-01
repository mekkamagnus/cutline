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
  linesPerPage?: number;
}

export function FountainHighlight({ tokens, content, linesPerPage = 55 }: FountainHighlightProps) {
  // Build highlighted content as React elements (safe from XSS)
  const highlightedLines = useMemo(() => {
    if (!content) return [];

    const lines = content.split('\n');
    const tokenMap = new Map<number, ParseToken>();

    // Map line numbers to tokens
    for (const token of tokens) {
      tokenMap.set(token.lineNumber, token);
    }

    // Strip leading whitespace from centered elements so CSS centering works
    const centeredTypes = new Set(['character', 'dialogue', 'parenthetical']);

    // Build safe React elements with page dividers
    const elements: React.ReactNode[] = [];
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const isPageBreak = index > 0 && index % linesPerPage === 0;

      if (isPageBreak) {
        elements.push(
          <div key={`page-${lineNumber}`} className="fountain-page-divider" />
        );
      }

      const token = tokenMap.get(lineNumber);
      const type = token?.type || 'action';
      const className = `fountain-line ${getTokenClassName(type)}`;
      const displayLine = centeredTypes.has(type) ? line.trimStart() : line;

      elements.push(
        <div key={lineNumber} className={className} data-line={lineNumber}>
          {displayLine || '\u00A0' /* Non-breaking space for empty lines */}
        </div>
      );
    });

    return elements;
  }, [tokens, content, linesPerPage]);

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
