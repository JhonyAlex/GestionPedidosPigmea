import React from 'react';
import { Comment, CommentFormData } from '../../types/comments';
import { useComments } from '../../hooks/useComments';
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
    <div className={`flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">
            Actividades y Comentarios
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {comments.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {comments.length}
            </span>
          )}
          
          {/* Indicador de conexión */}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">En tiempo real</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

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
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center text-sm text-gray-500">
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