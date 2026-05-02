interface Character {
  name: string;
  role: string;
  age?: string;
  trait?: string;
  lineCount: number;
  color: string;
}

interface MobileCharacterPanelProps {
  characters?: Character[];
  onAddCharacter?: () => void;
}

const DEFAULT_CHARACTERS: Character[] = [
  { name: 'JANE', role: 'Protagonist', age: '30s', trait: 'Determined', lineCount: 42, color: 'var(--accent)' },
  { name: 'MARK', role: 'Supporting', age: '30s', trait: 'Conflicted', lineCount: 38, color: '#f59e0b' },
  { name: 'SARAH', role: 'Friend', age: '28', trait: 'Supportive', lineCount: 15, color: '#22c55e' },
  { name: 'CONDUCTOR', role: 'Minor', age: '50s', trait: 'Gruff', lineCount: 8, color: '#ec4899' },
];

export function MobileCharacterPanel({
  characters = DEFAULT_CHARACTERS,
}: MobileCharacterPanelProps) {
  return (
    <div className="mobile-characters">
      {characters.map((char) => (
        <div key={char.name} className="mobile-character-item">
          <div className="mobile-character-avatar" style={{ background: char.color }}>
            {char.name[0]}
          </div>
          <div className="mobile-character-info">
            <div className="mobile-character-name">{char.name}</div>
            <div className="mobile-character-meta">
              {char.role} &bull; {char.age} &bull; {char.trait}
            </div>
          </div>
          <div className="mobile-character-count">{char.lineCount} lines</div>
        </div>
      ))}
    </div>
  );
}
