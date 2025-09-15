import React, { useState, useRef } from 'react';
import { Comment, CommentFormData } from '../../types/comments';
import { useComments } from '../../hooks/useComments';
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
  const listRef = useRef<{ scrollToBottom: (behavior?: ScrollBehavior) => void }>(null);
  
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
    listRef.current?.scrollToBottom('smooth');
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
      <div className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-850 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
            </span>
            {comments.length > 0 && (
              <div className="h-1 w-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-sm shadow-green-300 dark:shadow-green-700' : 'bg-red-500 shadow-sm shadow-red-300 dark:shadow-red-700'}`}></div>
            <span className={`text-xs font-medium ${isConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Comments List - Takes all available space */}
      <div className="flex-1 min-h-0">
        <CommentList
          ref={listRef}
          comments={comments}
          currentUserId={currentUserId}
          canDeleteComments={canDeleteComments}
          onDeleteComment={handleDeleteComment}
          isLoading={isLoading}
          isTyping={isTyping}
        />
      </div>

      {/* Input - Fixed at bottom */}
      {currentUserId && currentUserRole && (
        <CommentInput
          onSubmit={handleAddComment}
          isSubmitting={isSubmitting}
          placeholder="Escribe una actividad o comentario..."
          disabled={!currentUserId || !currentUserRole}
          onIsTypingChange={setIsTyping}
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