import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { useNotesDB, Note } from '@/hooks/useNotesDB';

const WIDGET_KEY = 'notes-widget-collapsed';
const MAX_TAB_CHARS = 22;
const WORDS_FOR_TAB = 3;

function stripHtml(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

function getTabName(content: string): string {
  const text = stripHtml(content).trim();
  if (!text) return 'Nueva nota';
  const words = text.split(/\s+/).slice(0, WORDS_FOR_TAB).join(' ');
  return words.length > MAX_TAB_CHARS
    ? words.slice(0, MAX_TAB_CHARS - 3) + '...'
    : words;
}

function generateId(): string {
  return 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

function createEmptyNote(): Note {
  const now = Date.now();
  return {
    id: generateId(),
    content: '',
    createdAt: now,
    updatedAt: now,
  };
}

type Notification = {
  message: string;
  type: 'success' | 'error' | 'info';
};

const NotesWidget: React.FC = () => {
  const { notes, loading, error, debouncedSave, deleteNote, importNotes, exportNotes } =
    useNotesDB();

  const [isOpen, setIsOpen] = useState(() => {
    try {
      return localStorage.getItem(WIDGET_KEY) === 'open';
    } catch {
      return false;
    }
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  const notify = useCallback((message: string, type: Notification['type'] = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    if (!isOpen && notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [isOpen, notes, activeNoteId]);

  useEffect(() => {
    try {
      localStorage.setItem(WIDGET_KEY, isOpen ? 'open' : 'closed');
    } catch {
      /* noop */
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const panel = panelRef.current;
      const toggle = widgetRef.current;
      if (panel && !panel.contains(e.target as Node) && toggle && !toggle.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (editorRef.current && activeNote) {
      if (editorRef.current.innerHTML !== activeNote.content) {
        editorRef.current.innerHTML = activeNote.content;
      }
    }
  }, [activeNoteId]);

  const handleCreateNote = useCallback(() => {
    const newNote = createEmptyNote();
    debouncedSave(newNote);
    setActiveNoteId(newNote.id);
  }, [debouncedSave]);

  const handleDeleteNote = useCallback(
    (id: string) => {
      deleteNote(id);
      setConfirmDelete(null);

      if (activeNoteId === id) {
        const remaining = notes.filter((n) => n.id !== id);
        setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
      }

      notify('Nota eliminada', 'success');
    },
    [deleteNote, activeNoteId, notes, debouncedSave, notify]
  );

  const handleEditorInput = useCallback(() => {
    if (editorRef.current && activeNote) {
      const content = editorRef.current.innerHTML;
      const updatedNote = { ...activeNote, content };
      debouncedSave(updatedNote);
    }
  }, [activeNote, debouncedSave]);

  const handleEditorKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
      }
    },
    []
  );

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleExport = useCallback(() => {
    const data = exportNotes();
    if (data.length === 0) {
      notify('No hay notas para exportar', 'info');
      return;
    }
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notas_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`${data.length} nota(s) exportada(s)`, 'success');
  }, [exportNotes, notify]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (!Array.isArray(parsed)) {
            notify('Formato de archivo invalido', 'error');
            return;
          }

          const validNotes = parsed
            .filter((n: Record<string, unknown>) => n.id && typeof n.content === 'string')
            .map((n: Record<string, unknown>) => ({
              id: n.id as string,
              content: n.content as string,
              createdAt: (n.createdAt as number) || Date.now(),
              updatedAt: (n.updatedAt as number) || Date.now(),
            }));

          if (validNotes.length === 0) {
            notify('No se encontraron notas validas', 'error');
            return;
          }

          const result = importNotes(validNotes);
          notify(
            `${result.imported} nota(s) importada(s)${result.skipped > 0 ? `, ${result.skipped} duplicada(s) saltada(s)` : ''}`,
            'success'
          );
        } catch {
          notify('Error al leer el archivo', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importNotes, notify]
  );

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  if (loading) return null;
  if (error) return null;

  return (
    <div ref={widgetRef} className="contents">
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="fixed top-3 right-3 z-[10000] w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-60 hover:opacity-100"
        aria-label={isOpen ? 'Cerrar notas' : 'Abrir notas'}
        title="Notas"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>

      {/* Widget Panel */}
      {isOpen && (
        <div ref={panelRef} className="fixed top-14 right-4 z-[10000] w-96 max-h-[85vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-200">
          {/* Notification */}
          {notification && (
            <div
              className={`px-4 py-2 text-sm font-medium ${
                notification.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : notification.type === 'error'
                    ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Notas
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handleExport}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Exportar notas"
                title="Exportar notas"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                onClick={handleImportClick}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Importar notas"
                title="Importar notas"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 pt-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto scrollbar-thin">
            {notes.map((note) => {
              const isActive = note.id === activeNoteId;
              return (
                <div
                  key={note.id}
                  className={`group flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-t-lg cursor-pointer transition-colors whitespace-nowrap max-w-[140px] ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={() => setActiveNoteId(note.id)}
                >
                  <span className="truncate">{getTabName(note.content)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (notes.length === 1) {
                        handleDeleteNote(note.id);
                      } else {
                        setConfirmDelete(note.id);
                      }
                    }}
                    className="ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label={`Eliminar ${getTabName(note.content)}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
            <button
              onClick={handleCreateNote}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Nueva nota"
              title="Nueva nota"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Delete Confirmation */}
          {confirmDelete && (
            <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/50">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                ¿Eliminar esta nota permanentemente?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteNote(confirmDelete)}
                  className="px-3 py-1 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-3 py-1 text-xs font-medium rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Editor Area */}
          {activeNote ? (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <ToolbarButton
                  label="Negrita"
                  icon="B"
                  command="bold"
                  editorRef={editorRef}
                  className="font-bold"
                />
                <ToolbarButton
                  label="Cursiva"
                  icon="I"
                  command="italic"
                  editorRef={editorRef}
                  className="italic"
                />
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
                <ToolbarButton
                  label="Titulo"
                  icon="H"
                  command="heading"
                  editorRef={editorRef}
                  className="font-bold text-[11px]"
                />
                <ToolbarButton
                  label="Lista"
                  icon="•"
                  command="insertUnorderedList"
                  editorRef={editorRef}
                  className="text-sm"
                />
              </div>

              {/* Content Editable */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onMouseUp={handleEditorInput}
                onKeyUp={handleEditorInput}
                onKeyDown={handleEditorKeyDown}
                className="flex-1 min-h-[300px] max-h-[50vh] overflow-y-auto px-4 py-3 text-sm text-gray-800 dark:text-gray-200 outline-none prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                  prose-h2:text-base prose-h2:mb-1 prose-h2:mt-2
                  prose-ul:my-1 prose-li:my-0.5
                  placeholder-gray-400"
                data-placeholder="Escribe tu nota aqui..."
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Crea una nueva nota para comenzar
              </p>
            </div>
          )}

          {/* Footer */}
          {activeNote && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {stripHtml(activeNote.content).trim().split(/\s+/).filter(Boolean).length} palabras
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(activeNote.updatedAt).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ToolbarButtonProps {
  label: string;
  icon: string;
  command: 'bold' | 'italic' | 'heading' | 'insertUnorderedList';
  editorRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  label,
  icon,
  command,
  editorRef,
  className = '',
}) => {
  const [isActive, setIsActive] = useState(false);

  const checkState = useCallback(() => {
    if (command === 'heading') {
      const block = document.queryCommandValue('formatBlock');
      setIsActive(block === 'h2' || block === '<h2>');
    } else {
      setIsActive(document.queryCommandState(command));
    }
  }, [command]);

  const handleClick = useCallback(() => {
    editorRef.current?.focus();
    if (command === 'heading') {
      const block = document.queryCommandValue('formatBlock');
      if (block === 'h2' || block === '<h2>') {
        document.execCommand('formatBlock', false, '<p>');
      } else {
        document.execCommand('formatBlock', false, '<h2>');
      }
    } else {
      document.execCommand(command, false);
    }
    setTimeout(checkState, 10);
  }, [command, editorRef, checkState]);

  useEffect(() => {
    checkState();
    document.addEventListener('selectionchange', checkState);
    return () => document.removeEventListener('selectionchange', checkState);
  }, [checkState]);

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleClick}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
        isActive
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
          : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
      } ${className}`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
};

export default NotesWidget;
