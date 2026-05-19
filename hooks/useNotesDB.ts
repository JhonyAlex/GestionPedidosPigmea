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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const saveNote = useCallback(
    (note: Note) => {
      if (!dbRef.current) return;
      const updatedNote = { ...note, updatedAt: Date.now() };

      saveNoteToDB(dbRef.current, updatedNote)
        .then(() => {
          setNotes((prev) => {
            const existing = prev.find((n) => n.id === updatedNote.id);
            if (existing) {
              return prev
                .map((n) => (n.id === updatedNote.id ? updatedNote : n))
                .sort((a, b) => b.updatedAt - a.updatedAt);
            }
            return [updatedNote, ...prev].sort(
              (a, b) => b.updatedAt - a.updatedAt
            );
          });
        })
        .catch((err) => console.error('Error al guardar nota:', err));
    },
    []
  );

  const debouncedSave = useCallback(
    (note: Note) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveNote(note), 500);
    },
    [saveNote]
  );

  const deleteNote = useCallback(
    (id: string) => {
      if (!dbRef.current) return;

      deleteNoteFromDB(dbRef.current, id)
        .then(() => {
          setNotes((prev) => prev.filter((n) => n.id !== id));
        })
        .catch((err) => console.error('Error al eliminar nota:', err));
    },
    []
  );

  const importNotes = useCallback((importedNotes: Note[]) => {
    if (!dbRef.current) return;
    const db = dbRef.current;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    let imported = 0;
    let skipped = 0;

    const existingIds = new Set(
      tx.objectStoreNames.contains(STORE_NAME) ? [] : []
    );

    const loadExisting = new Promise<void>((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        req.result.forEach((n: Note) => existingIds.add(n.id));
        resolve();
      };
      req.onerror = () => resolve();
    });

    loadExisting.then(() => {
      const notesToAdd = importedNotes.filter(
        (n) => !existingIds.has(n.id)
      );
      skipped = importedNotes.length - notesToAdd.length;

      if (notesToAdd.length === 0) {
        setNotes((prev) => prev.sort((a, b) => b.updatedAt - a.updatedAt));
        return { imported: 0, skipped };
      }

      notesToAdd.forEach((note) => {
        store.put(note);
        imported++;
      });

      tx.oncomplete = () => {
        getAllNotes(db).then((all) => {
          setNotes(all.sort((a, b) => b.updatedAt - a.updatedAt));
        });
      };
    });

    return { imported, skipped };
  }, []);

  const exportNotes = useCallback((): Note[] => {
    return JSON.parse(JSON.stringify(notes));
  }, [notes]);

  return {
    notes,
    loading,
    error,
    saveNote,
    debouncedSave,
    deleteNote,
    importNotes,
    exportNotes,
  };
}
