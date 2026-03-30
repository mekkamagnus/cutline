/**
 * ScriptEditor Component
 *
 * Main Fountain format script editor with real-time parsing and syntax highlighting.
 * Provides a textarea for raw Fountain input with auto-save functionality.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { FountainHighlight } from './FountainHighlight';
import { ScriptToolbar } from './ScriptToolbar';
import { fountainParser, type ParseToken } from '@/services/fountain-parser';
import { Result } from '@/lib/fp';
import type { ParsedScript } from '@/types';

interface ScriptEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  autoSaveDelay?: number;
}

export function ScriptEditor({
  initialContent = '',
  onChange,
  onSave,
  readOnly = false,
  autoSaveDelay = 2000,
}: ScriptEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [tokens, setTokens] = useState<ParseToken[]>([]);
  const [parsedScript, setParsedScript] = useState<ParsedScript | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse content on change
  useEffect(() => {
    const parseResult = fountainParser.parse(content);
    if (Result.isOk(parseResult)) {
      setParsedScript(parseResult.right);
    }

    const tokensResult = fountainParser.getHighlightTokens(content);
    if (Result.isOk(tokensResult)) {
      setTokens(tokensResult.right);
    }
  }, [content]);

  // Auto-save functionality
  useEffect(() => {
    if (!isDirty || !onSave) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave();
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, isDirty, autoSaveDelay, onSave]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      setIsDirty(true);
      onChange?.(newContent);
    },
    [onChange]
  );

  const handleSave = useCallback(() => {
    if (!onSave) return;

    setIsSaving(true);
    onSave(content);
    setIsDirty(false);
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 500);
  }, [content, onSave]);

  const handleToolbarAction = useCallback((action: string) => {
    if (!textareaRef.current || readOnly) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = '';
    let cursorOffset = 0;

    switch (action) {
      case 'scene-heading':
        newText = selectedText.toUpperCase() || 'INT. LOCATION - DAY';
        cursorOffset = newText.length;
        break;
      case 'character':
        newText = selectedText.toUpperCase() || 'CHARACTER NAME';
        cursorOffset = newText.length;
        break;
      case 'dialogue':
        // Add tab prefix for dialogue
        newText = selectedText ? `  ${selectedText}` : '  Dialogue text';
        cursorOffset = newText.length;
        break;
      case 'parenthetical':
        newText = selectedText ? `(${selectedText})` : '(parenthetical)';
        cursorOffset = newText.length;
        break;
      case 'action':
        newText = selectedText || 'Action description';
        cursorOffset = newText.length;
        break;
      case 'transition':
        newText = selectedText.toUpperCase() || 'CUT TO:';
        cursorOffset = newText.length;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
    setIsDirty(true);
    onChange?.(newContent);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  }, [content, onChange, readOnly]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (readOnly) return;

      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Tab for character name
      if (e.key === 'Tab') {
        e.preventDefault();
        handleToolbarAction('character');
        return;
      }
    },
    [handleSave, handleToolbarAction, readOnly]
  );

  return (
    <div style={editorContainerStyles}>
      {/* Script Page - styled like mockup */}
      <div style={scriptPageStyles}>
        {/* Line Numbers (optional) */}
        <div style={lineNumbersStyles}>
          {content.split('\n').map((_, i) => (
            <div key={i} style={lineNumberStyles}>{i + 1}</div>
          ))}
        </div>

        {/* Editor Area */}
        <div style={editorAreaStyles}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            style={{
              ...textareaStyles,
              ...(readOnly ? readOnlyStyles : {}),
            }}
            placeholder="Start writing your script in Fountain format...

Example:
INT. COFFEE SHOP - DAY

JOHN sits alone at a corner table.

JOHN
(stirring coffee)
I've been waiting for hours.

SARAH enters, looking rushed."
            spellCheck={false}
          />

          {/* Syntax highlighted overlay */}
          <FountainHighlight tokens={tokens} content={content} />
        </div>
      </div>

      {/* Status bar */}
      <div style={statusBarStyles}>
        <span style={statusItemStyles}>
          {parsedScript?.scenes.length ?? 0} scenes
        </span>
        <span style={statusItemStyles}>
          {parsedScript?.characters.size ?? 0} characters
        </span>
        <span style={statusItemStyles}>
          {parsedScript?.metadata.wordCount ?? 0} words
        </span>
        <span style={statusItemStyles}>
          ~{parsedScript?.metadata.estimatedDuration ?? 0} min
        </span>
        {isDirty && (
          <span style={dirtyStyles}>●</span>
        )}
        {isSaving && (
          <span style={savingStyles}>Saving...</span>
        )}
        {lastSaved && !isDirty && (
          <span style={savedStyles}>
            Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

// Styles matching mockup.html design
const editorContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflowY: 'auto',
  padding: 'var(--space-6)',
  background: 'var(--bg-primary)',
};

const scriptPageStyles: React.CSSProperties = {
  width: '100%',
  maxWidth: 'var(--script-max-width)',
  margin: '0 auto',
  background: '#1e1e1e',
  padding: 'var(--space-10) var(--space-16)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border-color)',
  borderRadius: 'var(--radius-md)',
  minHeight: '1100px',
  border: '1px solid var(--border-color)',
  position: 'relative',
};

const lineNumbersStyles: React.CSSProperties = {
  position: 'absolute',
  left: 'var(--space-4)',
  top: 'var(--space-10)',
  bottom: 'var(--space-10)',
  width: 'var(--space-6)',
  textAlign: 'right',
  color: 'var(--text-muted)',
  fontSize: '10px',
  lineHeight: '1.4',
  opacity: 0.5,
  pointerEvents: 'none',
  userSelect: 'none',
  overflow: 'hidden',
};

const lineNumberStyles: React.CSSProperties = {
  height: 'calc(var(--script-font-size) * var(--script-line-height))',
};

const editorAreaStyles: React.CSSProperties = {
  position: 'relative',
  paddingLeft: 'var(--space-8)',
};

const textareaStyles: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--script-font-size)',
  lineHeight: 'var(--script-line-height)',
  color: 'var(--fountain-dialogue)',
  whiteSpace: 'pre-wrap',
  caretColor: 'var(--accent)',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  resize: 'none',
  width: '100%',
  minHeight: '1000px',
  padding: 0,
  margin: 0,
};

const readOnlyStyles: React.CSSProperties = {
  opacity: 0.8,
  cursor: 'not-allowed',
};

const statusBarStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-4)',
  justifyContent: 'center',
  marginTop: 'var(--space-4)',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-muted)',
};

const statusItemStyles: React.CSSProperties = {};

const dirtyStyles: React.CSSProperties = {
  color: 'var(--warning)',
  marginLeft: 'var(--space-2)',
};

const savingStyles: React.CSSProperties = {
  color: 'var(--accent)',
  marginLeft: 'var(--space-2)',
};

const savedStyles: React.CSSProperties = {
  color: 'var(--success)',
  marginLeft: 'var(--space-2)',
};
