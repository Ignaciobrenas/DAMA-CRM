import { useEffect, useState } from "react";
import {
  getNotes,
  createNote,
  updateNote,
  togglePinNote,
  deleteNote,
} from "@/lib/api-client";
import type { Note } from "@/types/api";

export function NotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setNotes(await getNotes());
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "No se pudieron cargar las notas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add() {
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    try {
      const note = await createNote({ content, pinned: false });
      setNotes((prev) => [note, ...prev]);
      setDraft("");
    } catch (e: any) {
      setError(e?.message ?? "No se pudo crear la nota");
    } finally {
      setBusy(false);
    }
  }

  async function pin(note: Note) {
    // optimistic
    setNotes((prev) =>
      sortNotes(prev.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))),
    );
    try {
      await togglePinNote(note.id);
    } catch {
      void load();
    }
  }

  async function remove(note: Note) {
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    try {
      await deleteNote(note.id);
    } catch {
      void load();
    }
  }

  async function saveEdit(note: Note, content: string) {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, content } : n)));
    try {
      await updateNote(note.id, { content });
    } catch {
      void load();
    }
  }

  return (
    <div>
      <div className="field">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe una nota…"
        />
      </div>
      <button className="btn" onClick={add} disabled={busy || !draft.trim()}>
        + Añadir nota
      </button>

      {error && <div className="error">{error}</div>}

      <div style={{ marginTop: 14 }}>
        {loading ? (
          <div className="center">Cargando…</div>
        ) : notes.length === 0 ? (
          <div className="center">Aún no tienes notas.</div>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onPin={() => pin(note)}
              onDelete={() => remove(note)}
              onSave={(content) => saveEdit(note, content)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function sortNotes(list: Note[]): Note[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function NoteCard({
  note,
  onPin,
  onDelete,
  onSave,
}: {
  note: Note;
  onPin: () => void;
  onDelete: () => void;
  onSave: (content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(note.content);

  return (
    <div className={`note ${note.pinned ? "pinned" : ""}`}>
      {note.title && <div className="note-title">{note.title}</div>}
      {editing ? (
        <>
          <textarea value={value} onChange={(e) => setValue(e.target.value)} />
          <div className="note-actions">
            <button
              className="link"
              onClick={() => {
                onSave(value.trim() || note.content);
                setEditing(false);
              }}
            >
              Guardar
            </button>
            <button className="link" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="note-content">{note.content}</div>
          <div className="note-actions">
            <button className="link" onClick={onPin}>
              {note.pinned ? "Desanclar" : "Anclar"}
            </button>
            <button className="link" onClick={() => setEditing(true)}>
              Editar
            </button>
            <button className="link" onClick={onDelete}>
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
