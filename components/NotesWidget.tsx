import React, { useState, useRef, useEffect } from 'react';
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

  const { notes, activeNoteId, editor, loading, notesLoaded, error, presence, createNote, setActiveNoteId } =
    useCollaborativeNotes(socket, user?.id || '', user?.displayName || user?.username || '');

  const [isOpen, setIsOpen] = useState(() => {
    try { return localStorage.getItem(WIDGET_KEY) === 'open'; } catch { return embedded; }
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const autoCreatedRef = useRef(false);

  // Persist open/closed state
  useEffect(() => {
    try { localStorage.setItem(WIDGET_KEY, isOpen ? 'open' : 'closed'); } catch { /* noop */ }
  }, [isOpen]);

  // Auto-create single shared note if none exists — only after initial fetch completes
  useEffect(() => {
    if (notesLoaded && notes.length === 0 && !autoCreatedRef.current && createNote) {
      autoCreatedRef.current = true;
      createNote('Shared Notes');
    }
  }, [notesLoaded, notes.length, createNote]);

  // Set active note when notes load
  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId, setActiveNoteId]);

  // Click outside to close (floating mode only)
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

  const presenceCount = Object.keys(presence).length;

  const panelContent = (
    <div ref={panelRef} className={`w-full flex flex-col overflow-hidden ${embedded ? 'flex-1 min-h-0' : 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700'}`}>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading notes…</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Check your connection and try reloading.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header bar: title + presence + formatting toolbar */}
          <div className={`flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50/80 dark:bg-gray-800/50 ${embedded ? 'rounded-t-lg' : ''}`}>
            {/* Title — always visible */}
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mr-auto">Notas / Comentarios</h2>

            {/* Presence indicator */}
            {presenceCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {presenceCount}
              </span>
            )}

            {/* Formatting toolbar — fixed next to title */}
            {editor && (
              <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-gray-200 dark:border-gray-600">
                <ToolbarButton
                  isActive={editor.isActive('bold')}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  label="B"
                  title="Bold (Ctrl+B)"
                  className="font-bold"
                />
                <ToolbarButton
                  isActive={editor.isActive('italic')}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  label="I"
                  title="Italic (Ctrl+I)"
                  className="italic"
                />
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-0.5" />
                <ToolbarButton
                  isActive={editor.isActive('heading', { level: 2 })}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  label="H"
                  title="Heading"
                  className="font-bold text-[11px]"
                />
                <ToolbarButton
                  isActive={editor.isActive('bulletList')}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  label="•"
                  title="Bullet list"
                  className="text-base leading-none"
                />
              </div>
            )}
          </div>

          {/* Editor area */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto">
              <EditorContent
                editor={editor}
                className="h-full prose prose-sm dark:prose-invert max-w-none px-4 py-3 text-sm text-gray-800 dark:text-gray-200 outline-none prose-headings:font-semibold prose-h2:text-lg prose-h2:mb-1 prose-h2:mt-2 prose-h2:text-gray-900 dark:prose-h2:text-gray-100 prose-ul:my-1 prose-li:my-0.5 [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none [&_.ProseMirror]:h-full [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 dark:[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-500 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
              />
            </div>
          </div>

          {/* Fallback: editor mounting */}
          {!editor && !loading && !error && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Starting editor…</p>
            </div>
          )}
        </>
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
        aria-label={isOpen ? 'Close notes' : 'Open notes'}
        title="Shared Notes"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {isOpen && panelContent}
    </div>
  );
};

// ---- Static toolbar button component ----
interface ToolbarButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  title: string;
  className?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ isActive, onClick, label, title, className = '' }) => (
  <button
    type="button"
    onMouseDown={e => e.preventDefault()}
    onClick={onClick}
    className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${className} ${
      isActive
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
    }`}
    aria-label={title}
    title={title}
  >
    {label}
  </button>
);

export default NotesWidget;
