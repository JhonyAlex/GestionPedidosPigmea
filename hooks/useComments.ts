import { useState, useEffect, useCallback } from 'react';
import { Comment, CommentSocketEvents } from '../types/comments';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import webSocketService from '../services/websocket';
import { MentionedUser } from '../utils/mentions';

interface UseCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  addComment: (message: string, mentionedUsers?: MentionedUser[]) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  refreshComments: () => Promise<void>;
}

export const useComments = (pedidoId: string): UseCommentsReturn => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Helper para obtener headers de autenticación
  const getAuthHeaders = useCallback(() => {
    if (!user?.id) return {};
    
    const headers: any = {
      'x-user-id': String(user.id),
      'x-user-role': user.role || 'OPERATOR'
    };
    
    // Enviar también los permisos del usuario
    if (user.permissions && Array.isArray(user.permissions)) {
      headers['x-user-permissions'] = JSON.stringify(user.permissions);
    }
    
    return headers;
  }, [user]);

  // Cargar comentarios inicial
  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/comments/${pedidoId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
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
  }, [pedidoId, getAuthHeaders]);

  // Agregar comentario
  const addComment = useCallback(async (message: string, mentionedUsers: MentionedUser[] = []) => {
    if (!user?.id || !user?.username) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          pedidoId,
          message: message.trim(),
          userId: user.id,
          userRole: user.role,
          username: user.username,
          mentionedUsers: mentionedUsers
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar el comentario');
      }

      const data = await response.json();
      
      // NO agregar comentario al estado local - dejar que WebSocket lo maneje
      // Esto evita duplicados y asegura que todos los usuarios vean lo mismo
      
      // Emitir actividad para WebSocket
      webSocketService.emitActivity(`Comentario agregado al pedido ${pedidoId}`, {
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
  }, [user, pedidoId, getAuthHeaders]);

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
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el comentario');
      }

      // Remover comentario del estado local
      setComments(prev => prev.filter(comment => comment.id !== commentId));

      // Emitir actividad para WebSocket
      webSocketService.emitActivity(`Comentario eliminado del pedido ${pedidoId}`, {
        pedidoId,
        commentId,
        action: 'comment_deleted'
      });

    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar el comentario');
      throw err;
    }
  }, [user, pedidoId, getAuthHeaders]);

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
    const handleCommentAdded = (comment: Comment) => {
      if (comment.pedidoId === pedidoId) {
        setComments(prev => {
          // Evitar duplicados
          const exists = prev.some(c => c.id === comment.id);
          if (exists) return prev;
          
          return [...prev, {
            ...comment,
            timestamp: new Date(comment.timestamp)
          }];
        });
      }
    };

    const handleCommentDeleted = (data: { commentId: string; pedidoId: string }) => {
      if (data.pedidoId === pedidoId) {
        setComments(prev => prev.filter(comment => comment.id !== data.commentId));
      }
    };

    // Suscribirse a eventos usando el servicio WebSocket
    const unsubscribeAdded = webSocketService.subscribeToCommentAdded(handleCommentAdded);
    const unsubscribeDeleted = webSocketService.subscribeToCommentDeleted(handleCommentDeleted);

    // Cleanup
    return () => {
      unsubscribeAdded();
      unsubscribeDeleted();
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