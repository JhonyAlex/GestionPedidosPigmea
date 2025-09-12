import React from 'react';
import { Comment, CommentFormData } from '../../types/comments';
import { useComments } from '../../hooks/useComments';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import CommentList from './CommentList';
import CommentInput from './CommentInput';

interface CommentSystemProps {
  pedidoId: string;
  currentUserId?: string;
  currentUserRole?: string;
  canDeleteComments?: boolean;
  className?: string;
}

const CommentSystem: React.FC<CommentSystemProps> = ({ 
  pedidoId, 
  currentUserId, 
  currentUserRole,
  canDeleteComments = false,
  className = ''
}) => {
  const { user } = useAuth();
  const { isConnected } = useWebSocket(user?.id || '', (user?.role as UserRole) || 'Visualizador');
  
  const { 
    comments, 
    isLoading, 
    isSubmitting, 
    error,
    addComment, 
    deleteComment 
  } = useComments(pedidoId);

  const handleAddComment = async (data: CommentFormData) => {
    if (!currentUserId || !currentUserRole) {
      throw new Error('Usuario no autenticado');
    }
    
    await addComment(data.message);
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* Error message */}
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

      {/* Connection status indicator */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
          </span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isConnected ? 'En tiempo real' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <CommentList
        comments={comments}
        currentUserId={currentUserId}
        canDeleteComments={canDeleteComments}
        onDeleteComment={handleDeleteComment}
        isLoading={isLoading}
      />

      {/* Input */}
      {currentUserId && currentUserRole && (
        <CommentInput
          onSubmit={handleAddComment}
          isSubmitting={isSubmitting}
          placeholder="Escribe una actividad o comentario..."
          disabled={!currentUserId || !currentUserRole}
        />
      )}

      {/* Auth warning */}
      {(!currentUserId || !currentUserRole) && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Inicia sesión para participar en la conversación
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSystem;