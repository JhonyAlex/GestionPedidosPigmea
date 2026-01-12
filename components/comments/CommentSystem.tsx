import React, { useState, useRef, useEffect } from 'react';
import { Comment, CommentFormData } from '../../types/comments';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { MentionedUser, parseMentions } from '../../utils/mentions';
import CommentList from './CommentList';
import CommentInput from './CommentInput';

interface CommentSystemProps {
  pedidoId: string;
  currentUserId?: string;
  currentUserRole?: string;
  canDeleteComments?: boolean;
  className?: string;
  isConnected?: boolean;
}

const CommentSystem: React.FC<CommentSystemProps> = ({ 
  pedidoId, 
  currentUserId, 
  currentUserRole,
  canDeleteComments = false,
  className = '',
  isConnected = false
}) => {
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<MentionedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const { 
    comments, 
    isLoading, 
    isSubmitting, 
    error,
    addComment, 
    deleteComment 
  } = useComments(pedidoId);

  // Cargar usuarios activos para menciones
  useEffect(() => {
    const loadActiveUsers = async () => {
      if (!user) return;
      
      try {
        setLoadingUsers(true);
        const response = await fetch('/api/users/active', {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
            'x-user-role': user.role,
            'x-user-permissions': JSON.stringify(user.permissions || [])
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error loading active users for mentions:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadActiveUsers();
  }, [user]);

  // Lógica de scroll movida a este componente
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      // Para un contenedor flex-col-reverse, el scroll se va al TOPE (0)
      // para mostrar los elementos que están visualmente ABAJO.
      // Usamos scrollIntoView en el último elemento para asegurar que sea visible.
      const lastComment = scrollRef.current.querySelector(':scope > div > div:first-child');
      if (lastComment) {
        lastComment.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [comments, isLoading]); // Se ejecuta cuando los comentarios cambian o terminan de cargar

  const handleAddComment = async (data: CommentFormData) => {
    if (!currentUserId || !currentUserRole) {
      throw new Error('Usuario no autenticado');
    }
    
    // Parsear menciones del mensaje
    const mentionedUsers = parseMentions(
      data.message,
      availableUsers,
      currentUserId,
      5 // Límite de 5 menciones
    );

    await addComment(data.message, mentionedUsers);
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-500 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-850 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-xs font-medium ${isConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Contenedor de la lista de comentarios con el scroll y la ref */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          canDeleteComments={canDeleteComments}
          onDeleteComment={handleDeleteComment}
          isLoading={isLoading}
          isTyping={isTyping}
        />
      </div>

      {/* CAMPO DE TEXTO Y BOTÓN (AHORA VISIBLES DE NUEVO) */}
      {currentUserId && currentUserRole && (
        <CommentInput
          onSubmit={handleAddComment}
          isSubmitting={isSubmitting}
          placeholder="Escribe una actividad o comentario... (@usuario para mencionar)"
          disabled={!currentUserId || !currentUserRole}
          onIsTypingChange={setIsTyping}
          availableUsers={availableUsers}
        />
      )}
    </div>
  );
};

export default CommentSystem;