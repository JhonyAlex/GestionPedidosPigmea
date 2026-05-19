import { useState, useEffect, useCallback } from 'react';
import { WeeklyComment } from '../types/weeklyComments';
import webSocketService from '../services/websocket';

interface UseWeeklyCommentsReturn {
  comments: WeeklyComment[];
  saveComment: (weekKey: string, message: string) => Promise<void>;
  updateComment: (commentId: string, message: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

const API_BASE = '/api';

const getAuthHeaders = () => {
  const saved = localStorage.getItem('pigmea_user');
  if (!saved) return {};
  const user = JSON.parse(saved);
  return {
    'x-user-id': String(user.id),
    'x-user-role': user.role || 'OPERATOR'
  };
};

export const useWeeklyComments = (): UseWeeklyCommentsReturn => {
  const [comments, setComments] = useState<WeeklyComment[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/planning/weekly-comments`, {
        headers: { ...getAuthHeaders(), 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Error loading weekly comments:', err);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const handlers = {
      added: (comment: WeeklyComment) => {
        setComments(prev => {
          if (prev.some(c => c.id === comment.id)) return prev;
          return [...prev, { ...comment, createdAt: new Date(comment.createdAt), updatedAt: new Date(comment.updatedAt) }];
        });
      },
      updated: (comment: WeeklyComment) => {
        setComments(prev => prev.map(c => c.id === comment.id ? { ...comment, createdAt: new Date(comment.createdAt), updatedAt: new Date(comment.updatedAt) } : c));
      },
      deleted: (data: { commentId: string }) => {
        setComments(prev => prev.filter(c => c.id !== data.commentId));
      }
    };

    const unsubAdded = webSocketService.subscribeToWeeklyCommentAdded(handlers.added);
    const unsubUpdated = webSocketService.subscribeToWeeklyCommentUpdated(handlers.updated);
    const unsubDeleted = webSocketService.subscribeToWeeklyCommentDeleted(handlers.deleted);

    return () => { unsubAdded(); unsubUpdated(); unsubDeleted(); };
  }, []);

  const saveComment = useCallback(async (weekKey: string, message: string) => {
    const saved = localStorage.getItem('pigmea_user');
    if (!saved) throw new Error('Usuario no autenticado');
    const user = JSON.parse(saved);

    const res = await fetch(`${API_BASE}/planning/weekly-comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ weekKey, message, userId: user.id, username: user.username, userRole: user.role })
    });

    if (!res.ok) throw new Error('Error al guardar comentario');
  }, []);

  const updateComment = useCallback(async (commentId: string, message: string) => {
    const res = await fetch(`${API_BASE}/planning/weekly-comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Error al actualizar comentario');
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    const res = await fetch(`${API_BASE}/planning/weekly-comments/${commentId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Error al eliminar comentario');
  }, []);

  return { comments, saveComment, updateComment, deleteComment };
};
