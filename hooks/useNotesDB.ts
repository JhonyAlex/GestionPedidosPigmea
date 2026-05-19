import { useState, useEffect, useCallback, useRef } from 'react';

export interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = 'notes-widget-db';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllNotes(db: IDBDatabase): Promise<Note[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveNoteToDB(db: IDBDatabase, note: Note): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(note);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function deleteNoteFromDB(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function useNotesDB() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dbRef = useRef<IDBDatabase | null>(null);
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    openDB()
      .then((db) => {
        dbRef.current = db;
        return getAllNotes(db);
      })
      .then((allNotes) => {
        setNotes(allNotes.sort((a, b) => b.updatedAt - a.updatedAt));
        setLoading(false);
      })
      .catch((err) => {
        setError('Error al abrir la base de datos: ' + err.message);
        setLoading(false);
      });

    return () => {
      if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current);
    };
  }, []);

  const flushSave = useCallback(() => {
    if (!dbRef.current) return;
    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current);
      pendingSaveRef.current = null;
    }

    const pending = pendingContentRef.current;
    if (pending.size === 0) return;

    setNotes((prev) => {
      const notesMap = new Map(prev.map((n) => [n.id, n]));
      let changed = false;

      pending.forEach((content, id) => {
        const existing = notesMap.get(id);
        if (existing) {
          const updated = { ...existing, content, updatedAt: Date.now() };
          notesMap.set(id, updated);
          saveNoteToDB(dbRef.current!, updated).catch((err) =>
            console.error('Error al guardar nota:', err)
          );
          changed = true;
        }
      });

      pending.clear();
      return changed
        ? Array.from(notesMap.values()).sort((a, b) => b.updatedAt - a.updatedAt)
        : prev;
    });
  }, []);

  const scheduleSave = useCallback(
    (noteId: string, content: string) => {
      pendingContentRef.current.set(noteId, content);

      if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current);
      pendingSaveRef.current = setTimeout(() => {
        pendingSaveRef.current = null;
        flushSave();
      }, 400);
    },
    [flushSave]
  );

  const createNote = useCallback((note: Note) => {
    if (!dbRef.current) return;
    const tx = dbRef.current.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(note);

    tx.oncomplete = () => {
      setNotes((prev) => [note, ...prev].sort((a, b) => b.updatedAt - a.updatedAt));
    };
  }, []);

  const deleteNote = useCallback(
    (id: string) => {
      if (!dbRef.current) return;
      pendingContentRef.current.delete(id);

      deleteNoteFromDB(dbRef.current, id)
        .then(() => {
          setNotes((prev) => prev.filter((n) => n.id !== id));
        })
        .catch((err) => console.error('Error al eliminar nota:', err));
    },
    []
  );

  const importNotes = useCallback((importedNotes: Note[]) => {
    if (!dbRef.current) return { imported: 0, skipped: 0 };
    const db = dbRef.current;

    getAllNotes(db).then((existingNotes) => {
      const existingIds = new Set(existingNotes.map((n) => n.id));
      const notesToAdd = importedNotes.filter((n) => !existingIds.has(n.id));
      const skipped = importedNotes.length - notesToAdd.length;

      if (notesToAdd.length === 0) {
        return { imported: 0, skipped };
      }

      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      notesToAdd.forEach((note) => store.put(note));

      tx.oncomplete = () => {
        getAllNotes(db).then((all) => {
          setNotes(all.sort((a, b) => b.updatedAt - a.updatedAt));
        });
      };

      return { imported: notesToAdd.length, skipped };
    });

    return { imported: importedNotes.length, skipped: 0 };
  }, []);

  const exportNotes = useCallback((): Note[] => {
    return JSON.parse(JSON.stringify(notes));
  }, [notes]);

  return {
    notes,
    loading,
    error,
    scheduleSave,
    flushSave,
    createNote,
    deleteNote,
    importNotes,
    exportNotes,
  };
}
