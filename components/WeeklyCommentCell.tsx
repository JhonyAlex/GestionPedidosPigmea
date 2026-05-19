import { useState } from 'react';
import { WeeklyComment } from '../types/weeklyComments';

interface WeeklyCommentCellProps {
  comments: WeeklyComment[];
  onSave: (weekKey: string, message: string) => Promise<void>;
  onUpdate: (commentId: string, message: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  weekKey: string;
  currentUserId?: string;
}

const PREVIEW_WORD_COUNT = 4;

const getPreviewText = (message: string): string => {
  const words = message.split(/\s+/);
  return words.length > PREVIEW_WORD_COUNT
    ? words.slice(0, PREVIEW_WORD_COUNT).join(' ') + '...'
    : message;
};

const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `hace ${diffHrs}h`;
  return then.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
};

export const WeeklyCommentCell: React.FC<WeeklyCommentCellProps> = ({
  comments, onSave, onUpdate, onDelete, weekKey, currentUserId
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newText, setNewText] = useState('');

  const handleSave = async () => {
    if (!newText.trim()) return;
    try {
      await onSave(weekKey, newText.trim());
      setNewText('');
    } catch (err) {
      console.error('Error saving weekly comment:', err);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      await onUpdate(commentId, editText.trim());
      setEditingId(null);
      setEditText('');
    } catch (err) {
      console.error('Error editing weekly comment:', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await onDelete(commentId);
    } catch (err) {
      console.error('Error deleting weekly comment:', err);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300"
        title="Ver comentarios de la semana"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {comments.length > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-blue-600 rounded-full">
            {comments.length}
          </span>
        )}
        {comments.length > 0 && (
          <span className="text-slate-500 truncate max-w-[80px]">
            {getPreviewText(comments[0].message)}
          </span>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-gray-800">Comentarios de la semana</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin comentarios aún</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                    {editingId === c.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-md p-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                          <button onClick={() => handleEdit(c.id)} className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700">Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">{c.username}</span>
                            <span className="text-[10px] text-gray-400">{formatRelativeTime(c.createdAt)}</span>
                          </div>
                          {c.userId === currentUserId && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setEditingId(c.id); setEditText(c.message); }}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Editar"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Eliminar"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.message}</p>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t bg-gray-50 rounded-b-xl">
              <div className="flex gap-2">
                <textarea
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
                  placeholder="Escribir comentario..."
                  className="flex-1 text-sm border border-gray-300 rounded-md p-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
                <button
                  onClick={handleSave}
                  disabled={!newText.trim()}
                  className="self-end px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
