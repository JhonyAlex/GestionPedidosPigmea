import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { useCollaborativeNotes } from '@/hooks/useCollaborativeNotes';
import { webSocketService } from '@/services/websocket';
import { useAuth } from '@/contexts/AuthContext';

const WIDGET_KEY = 'notes-widget-collapsed';

interface NotesWidgetProps {
  embedded?: boolean;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ embedded = false }) => {
  const { user } = useAuth();
  const socket = webSocketService.isSocketConnected() ? webSocketService.getSocket() : null;

  const { notes, activeNoteId, editor, loading, error, presence, createNote, deleteNote, setActiveNoteId } =
    useCollaborativeNotes(socket, user?.id || '', user?.displayName || user?.username || '');

  const [isOpen, setIsOpen] = useState(() => {
    try { return localStorage.getItem(WIDGET_KEY) === 'open'; } catch { return embedded; }
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(WIDGET_KEY, isOpen ? 'open' : 'closed'); } catch { /* noop */ }
  }, [isOpen]);

  useEffect(() => {
    if ((!isOpen || embedded) && notes.length > 0 && !activeNoteId) setActiveNoteId(notes[0].id);
  }, [isOpen, embedded, notes, activeNoteId, setActiveNoteId]);

  useEffect(() => {
    if (!isOpen || embedded) return;
    const handleClickOutside = (e: MouseEvent) => {
      const panel = panelRef.current;
      const toggle = widgetRef.current;
      if (panel && !panel.contains(e.target as Node) && toggle && !toggle.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, embedded]);

  const handleCreateNote = useCallback(() => { createNote(); }, [createNote]);
  const handleDeleteNote = useCallback((id: string) => { deleteNote(id); setConfirmDelete(null); }, [deleteNote]);

  if (loading) return null;
  if (error) return null;

  const activeNote = notes.find(n => n.id === activeNoteId) || null;
  const presenceCount = Object.keys(presence).length;

  const panelContent = (
    <div ref={panelRef} className={`w-full flex flex-col overflow-hidden ${embedded ? 'min-h-[400px] max-h-[500px]' : 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700'}`}>
      {/* Header — hidden in embedded mode (parent provides section title) */}
      {!embedded && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Notas compartidas</h2>
            {presenceCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {presenceCount}
              </span>
            )}
          </div>
          <button
            onClick={handleCreateNote}
            className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors"
            aria-label="Nueva nota"
            title="Nueva nota"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {/* Embedded toolbar: row with presence + new note button */}
      {embedded && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl">
          <div className="flex items-center gap-2">
            {presenceCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {presenceCount} {presenceCount === 1 ? 'conectado' : 'conectados'}
              </span>
            )}
          </div>
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            aria-label="Nueva nota"
            title="Nueva nota"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
        {notes.map(note => (
          <div
            key={note.id}
            className={`group flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-t-lg cursor-pointer transition-colors whitespace-nowrap max-w-[140px] ${
              note.id === activeNoteId
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
            onClick={() => setActiveNoteId(note.id)}
          >
            <span className="truncate">{note.title}</span>
            <button
              onClick={e => { e.stopPropagation(); notes.length === 1 ? handleDeleteNote(note.id) : setConfirmDelete(note.id); }}
              className="ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              aria-label={`Eliminar ${note.title}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/50">
          <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">¿Eliminar esta nota permanentemente?</p>
          <div className="flex gap-2">
            <button onClick={() => handleDeleteNote(confirmDelete)} className="px-3 py-1 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 transition-colors">Eliminar</button>
            <button onClick={() => setConfirmDelete(null)} className="px-3 py-1 text-xs font-medium rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {/* Editor */}
      {activeNote ? (
        <div className="flex flex-col flex-1 min-h-0">
          <EditorToolbar editor={editor} />
          <div className="flex-1 min-h-[200px] overflow-y-auto">
            <EditorContent editor={editor} className="prose prose-sm dark:prose-invert max-w-none px-4 py-3 text-sm text-gray-800 dark:text-gray-200 outline-none prose-headings:font-semibold prose-h2:text-base prose-h2:mb-1 prose-h2:mt-2 prose-ul:my-1 prose-li:my-0.5" />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <p className="text-sm text-gray-400 dark:text-gray-500">Crea una nueva nota para comenzar</p>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return panelContent;
  }

  return (
    <div ref={widgetRef} className="contents">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 right-3 z-[10000] w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-60 hover:opacity-100"
        aria-label={isOpen ? 'Cerrar notas' : 'Abrir notas'}
        title="Notas compartidas"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {isOpen && panelContent}
    </div>
  );
};

interface EditorToolbarProps { editor: import('@tiptap/react').Editor | null; }

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors font-bold ${
          editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}
        aria-label="Negrita"
        title="Negrita"
      >
        B
      </button>
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors italic ${
          editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}
        aria-label="Cursiva"
        title="Cursiva"
      >
        I
      </button>
      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors font-bold text-[11px] ${
          editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}
        aria-label="Título"
        title="Título"
      >
        H
      </button>
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors text-lg leading-none ${
          editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}
        aria-label="Lista"
        title="Lista"
      >
        •
      </button>
    </div>
  );
};

export default NotesWidget;
