import { useState, useEffect, useCallback } from 'react';
import { Comment, CommentSocketEvents } from '../types/comments';
import { useWebSocket } from './useWebSocket';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

declare global {
  interface Window {
    socket?: any;
  }
}

interface UseCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  addComment: (message: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  refreshComments: () => Promise<void>;
}

export const useComments = (pedidoId: string): UseCommentsReturn => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { emitActivity } = useWebSocket(user?.id || '', (user?.role as UserRole) || 'Visualizador');

  // Cargar comentarios inicial
  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/comments/${pedidoId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los comentarios');
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Error al cargar los comentarios');
    } finally {
      setIsLoading(false);
    }
  }, [pedidoId]);

  // Agregar comentario
  const addComment = useCallback(async (message: string) => {
    if (!user?.id || !user?.username) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pedidoId,
          message: message.trim(),
          userId: user.id,
          userRole: user.role,
          username: user.username
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar el comentario');
      }

      const data = await response.json();
      
      // Agregar comentario al estado local inmediatamente
      const newComment: Comment = {
        id: data.comment.id,
        pedidoId,
        userId: user.id,
        userRole: user.role,
        username: user.username,
        message: message.trim(),
        timestamp: new Date(data.comment.timestamp),
        isSystemMessage: false
      };
      
      setComments(prev => [...prev, newComment]);

      // Emitir actividad para WebSocket
      emitActivity(`Comentario agregado al pedido ${pedidoId}`, {
        pedidoId,
        commentId: data.comment.id,
        message: message.trim(),
        action: 'comment_added'
      });

    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar el comentario');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, pedidoId, emitActivity]);

  // Eliminar comentario
  const deleteComment = useCallback(async (commentId: string) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setError(null);

      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el comentario');
      }

      // Remover comentario del estado local
      setComments(prev => prev.filter(comment => comment.id !== commentId));

      // Emitir actividad para WebSocket
      emitActivity(`Comentario eliminado del pedido ${pedidoId}`, {
        pedidoId,
        commentId,
        action: 'comment_deleted'
      });

    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar el comentario');
      throw err;
    }
  }, [user, pedidoId, emitActivity]);

  // Refrescar comentarios
  const refreshComments = useCallback(async () => {
    await loadComments();
  }, [loadComments]);

  // Cargar comentarios al montar el componente
  useEffect(() => {
    if (pedidoId) {
      loadComments();
    }
  }, [pedidoId, loadComments]);

  // Escuchar eventos de WebSocket para comentarios en tiempo real
  useEffect(() => {
    if (!window.socket) return;

    const handleCommentAdded = (data: CommentSocketEvents['commentAdded']) => {
      if (data.pedidoId === pedidoId) {
        setComments(prev => {
          // Evitar duplicados
          const exists = prev.some(comment => comment.id === data.id);
          if (exists) return prev;
          
          return [...prev, {
            ...data,
            timestamp: new Date(data.timestamp)
          }];
        });
      }
    };

    const handleCommentDeleted = (data: CommentSocketEvents['commentDeleted']) => {
      if (data.pedidoId === pedidoId) {
        setComments(prev => prev.filter(comment => comment.id !== data.commentId));
      }
    };

    // Suscribirse a eventos de WebSocket
    window.socket.on('comment:added', handleCommentAdded);
    window.socket.on('comment:deleted', handleCommentDeleted);

    // Cleanup
    return () => {
      window.socket?.off('comment:added', handleCommentAdded);
      window.socket?.off('comment:deleted', handleCommentDeleted);
    };
  }, [pedidoId]);

  return {
    comments,
    isLoading,
    isSubmitting,
    error,
    addComment,
    deleteComment,
    refreshComments
  };
};