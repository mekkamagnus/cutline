/**
 * ScriptViewer Component
 *
 * Read-only view of parsed Fountain scripts with organized navigation.
 * Displays scenes, characters, and script statistics.
 */
import { useMemo } from 'react';
import { Result } from '@/lib/fp';
import { fountainParser } from '@/services/fountain-parser';
import type { ParsedScript, ParsedScene, CharacterStats } from '@/types';

interface ScriptViewerProps {
  content: string;
  onSceneSelect?: (sceneId: string) => void;
  selectedSceneId?: string;
}

export function ScriptViewer({ content, onSceneSelect, selectedSceneId }: ScriptViewerProps) {
  const parsedScript = useMemo(() => {
    const result = fountainParser.parse(content);
    if (Result.isOk(result)) {
      return result.right;
    }
    return null;
  }, [content]);

  if (!parsedScript) {
    return (
      <div className="script-viewer script-viewer--empty">
        <p>No script content to display</p>
      </div>
    );
  }

  const characters = Array.from(parsedScript.characters.values());

  return (
    <div className="script-viewer">
      {/* Header with metadata */}
      <div className="script-viewer__header">
        {parsedScript.title && (
          <h1 className="script-viewer__title">{parsedScript.title}</h1>
        )}
        {parsedScript.author && (
          <p className="script-viewer__author">by {parsedScript.author}</p>
        )}
        <div className="script-viewer__metadata">
          <span className="script-viewer__stat">
            {parsedScript.scenes.length} scenes
          </span>
          <span className="script-viewer__stat">
            {characters.length} characters
          </span>
          <span className="script-viewer__stat">
            {parsedScript.metadata.wordCount} words
          </span>
          <span className="script-viewer__stat">
            ~{parsedScript.metadata.estimatedDuration} min
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="script-viewer__content">
        {/* Scene list sidebar */}
        <aside className="script-viewer__scenes">
          <h2 className="script-viewer__section-title">Scenes</h2>
          <ul className="script-viewer__scene-list">
            {parsedScript.scenes.map((scene) => (
              <SceneItem
                key={scene.id}
                scene={scene}
                isSelected={scene.id === selectedSceneId}
                onClick={() => onSceneSelect?.(scene.id)}
              />
            ))}
          </ul>
        </aside>

        {/* Character list */}
        <aside className="script-viewer__characters">
          <h2 className="script-viewer__section-title">Characters</h2>
          <ul className="script-viewer__character-list">
            {characters.map((char) => (
              <CharacterItem key={char.name} character={char} />
            ))}
          </ul>
        </aside>
      </div>

      {/* Script content */}
      <div className="script-viewer__script">
        {parsedScript.scenes.map((scene) => (
          <SceneBlock
            key={scene.id}
            scene={scene}
            isSelected={scene.id === selectedSceneId}
          />
        ))}
      </div>
    </div>
  );
}

interface SceneItemProps {
  scene: ParsedScene;
  isSelected: boolean;
  onClick: () => void;
}

function SceneItem({ scene, isSelected, onClick }: SceneItemProps) {
  return (
    <li
      className={`script-viewer__scene-item ${isSelected ? 'script-viewer__scene-item--selected' : ''}`}
      onClick={onClick}
    >
      <span className="script-viewer__scene-location">{scene.location}</span>
      <span className="script-viewer__scene-time">{scene.timeOfDay}</span>
      <span className="script-viewer__scene-interior">
        {scene.interior ? 'INT' : 'EXT'}
      </span>
    </li>
  );
}

interface CharacterItemProps {
  character: CharacterStats;
}

function CharacterItem({ character }: CharacterItemProps) {
  return (
    <li className="script-viewer__character-item">
      <span className="script-viewer__character-name">{character.name}</span>
      <span className="script-viewer__character-stats">
        {character.dialogueCount} lines
      </span>
    </li>
  );
}

interface SceneBlockProps {
  scene: ParsedScene;
  isSelected: boolean;
}

function SceneBlock({ scene, isSelected }: SceneBlockProps) {
  return (
    <div
      id={`scene-${scene.id}`}
      className={`script-viewer__scene-block ${isSelected ? 'script-viewer__scene-block--selected' : ''}`}
    >
      <h3 className="script-viewer__scene-heading">{scene.heading}</h3>
      <div className="script-viewer__scene-content">
        {scene.elements.map((element, index) => (
          <div
            key={`${scene.id}-${index}`}
            className={`script-viewer__element script-viewer__element--${element.type}`}
          >
            {element.characterName && (
              <span className="script-viewer__character-name">
                {element.characterName}
              </span>
            )}
            <span className="script-viewer__element-text">{element.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
