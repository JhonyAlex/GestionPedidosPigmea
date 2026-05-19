import { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { Awareness } from 'y-protocols/awareness';
import { Socket } from 'socket.io-client';
import { SharedNote, listNotes, createNote, deleteNote, updateNoteTitle, loadNoteState, saveNoteState } from '@/services/notesApi';

interface PresenceInfo {
  userId: string;
  name: string;
  color: string;
}

const COLORS = ['#f783ac', '#89CFF0', '#77dd77', '#ffb347', '#b19cd9', '#ff6961', '#aec6cf', '#fdfd96'];

function getColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export interface UseCollaborativeNotesReturn {
  notes: SharedNote[];
  activeNoteId: string | null;
  editor: Editor | null;
  loading: boolean;
  error: string | null;
  presence: Record<string, PresenceInfo>;
  createNote: (title?: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveNoteId: (id: string | null) => void;
  updateTitle: (id: string, title: string) => Promise<void>;
}

export function useCollaborativeNotes(socket: Socket | null, userId: string, userName: string): UseCollaborativeNotesReturn {
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presence, setPresence] = useState<Record<string, PresenceInfo>>({});

  const ydocRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const loadNotes = useCallback(async () => {
    try {
      const data = await listNotes();
      setNotes(data);
    } catch {
      setError('Error cargando notas');
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  useEffect(() => {
    if (!socket || !activeNoteId) return;

    cancelledRef.current = false;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const awareness = new Awareness(ydoc);
    awarenessRef.current = awareness;
    awareness.setLocalState({ user: { id: userId, name: userName, color: getColor(userId) } });

    socket.emit('notes:join', activeNoteId);
    socket.emit('notes:presence', { noteId: activeNoteId, name: userName, color: getColor(userId) });

    const handlePresence = (data: { userId: string; name: string; color: string }) => {
      setPresence(prev => ({ ...prev, [data.userId]: { userId: data.userId, name: data.name, color: data.color } }));
    };
    const handlePresenceRemove = (data: { userId: string }) => {
      setPresence(prev => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    };
    socket.on('notes:presence', handlePresence);
    socket.on('notes:presence-remove', handlePresenceRemove);

    const handleSync = (data: { noteId: string; update: number[] }) => {
      if (data.noteId === activeNoteId && ydocRef.current) {
        Y.applyUpdate(ydocRef.current, new Uint8Array(data.update));
      }
    };
    socket.on('notes:yjs-update', handleSync);

    const handleUpdate = (update: Uint8Array) => {
      socket.emit('notes:yjs-update', { noteId: activeNoteId, update: Array.from(update) });
    };
    ydoc.on('update', handleUpdate);

    async function setup() {
      setLoading(true);
      setError(null);
      try {
        const stateBase64 = await loadNoteState(activeNoteId);
        if (cancelledRef.current) return;
        if (stateBase64) {
          const binary = Uint8Array.from(atob(stateBase64), c => c.charCodeAt(0));
          Y.applyUpdate(ydoc, binary);
        }

        const newEditor = new Editor({
          extensions: [
            StarterKit.configure({ history: false } as any),
            Collaboration.configure({ document: ydoc }),
            CollaborationCaret.configure({
              provider: { awareness } as any,
              user: { name: userName, color: getColor(userId) },
            }),
          ],
        });

        if (cancelledRef.current) { newEditor.destroy(); return; }
        setEditor(newEditor);
        setLoading(false);
      } catch {
        if (cancelledRef.current) return;
        setError('Error cargando nota');
        setLoading(false);
      }
    }

    saveTimerRef.current = setInterval(async () => {
      if (ydocRef.current && activeNoteId) {
        const state = Y.encodeStateAsUpdate(ydocRef.current);
        const b64 = btoa(String.fromCharCode(...state));
        try { await saveNoteState(activeNoteId, b64); } catch { /* silent */ }
      }
    }, 5000);

    setup();

    return () => {
      cancelledRef.current = true;
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      socket.emit('notes:leave', activeNoteId);
      socket.off('notes:presence', handlePresence);
      socket.off('notes:presence-remove', handlePresenceRemove);
      socket.off('notes:yjs-update', handleSync);
      ydoc.off('update', handleUpdate);
      setEditor(prev => { prev?.destroy(); return null; });
      awareness.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      awarenessRef.current = null;
    };
  }, [activeNoteId, socket, userId, userName]);

  const handleCreateNote = useCallback(async (title?: string) => {
    if (!socket) return;
    try {
      const note = await createNote(title);
      setNotes(prev => [note, ...prev]);
      setActiveNoteId(note.id);
    } catch {
      setError('Error creando nota');
    }
  }, [socket]);

  const handleDeleteNote = useCallback(async (id: string) => {
    try {
      await deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (activeNoteId === id) setActiveNoteId(null);
    } catch {
      setError('Error eliminando nota');
    }
  }, [activeNoteId]);

  const handleUpdateTitle = useCallback(async (id: string, title: string) => {
    try {
      const updated = await updateNoteTitle(id, title);
      setNotes(prev => prev.map(n => n.id === id ? updated : n));
    } catch {
      setError('Error actualizando título');
    }
  }, []);

  return { notes, activeNoteId, editor, loading, error, presence, createNote: handleCreateNote, deleteNote: handleDeleteNote, setActiveNoteId, updateTitle: handleUpdateTitle };
}
