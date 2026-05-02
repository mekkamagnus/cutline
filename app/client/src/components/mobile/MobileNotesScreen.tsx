import { useState } from 'react';

interface Note {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface MobileNotesScreenProps {
  notes?: Note[];
  onAddNote?: (content: string) => void;
}

export function MobileNotesScreen({ notes: initialNotes, onAddNote }: MobileNotesScreenProps) {
  const [notes, setNotes] = useState<Note[]>(
    initialNotes ?? [
      { id: '1', author: 'You', content: "Need to emphasize Jane's isolation more in shot 2. Maybe wider angle?", createdAt: '2h ago' },
      { id: '2', author: 'You', content: "Mark's entrance should feel more intrusive. Consider low angle.", createdAt: 'Yesterday' },
      { id: '3', author: 'You', content: 'Scene 1 mood notes: tense, unresolved tension. Natural lighting from window.', createdAt: '2 days ago' },
    ],
  );
  const [newNote, setNewNote] = useState('');

  const handleSubmit = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: String(Date.now()),
      author: 'You',
      content: newNote.trim(),
      createdAt: 'Just now',
    };
    setNotes([note, ...notes]);
    onAddNote?.(newNote.trim());
    setNewNote('');
  };

  return (
    <div className="mobile-notes">
      <div className="mobile-notes__tabs">
        <button type="button" className="mobile-notes__tab mobile-notes__tab--active">
          Comments
        </button>
        <button type="button" className="mobile-notes__tab">Versions</button>
      </div>

      <div className="mobile-notes__list">
        {notes.map((note) => (
          <div key={note.id} className="mobile-note-card">
            <div className="mobile-note-card__header">
              <span className="mobile-note-card__author">{note.author}</span>
              <span className="mobile-note-card__time">{note.createdAt}</span>
            </div>
            <div className="mobile-note-card__body">{note.content}</div>
          </div>
        ))}
      </div>

      <div className="mobile-notes__input-area">
        <textarea
          className="mobile-notes__textarea"
          placeholder="Add a note..."
          rows={2}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <button
          type="button"
          className="btn btn--primary btn--full"
          onClick={handleSubmit}
          disabled={!newNote.trim()}
        >
          Add Note
        </button>
      </div>
    </div>
  );
}
