import React, { useRef } from 'react';
import { Comment } from '../../types/comments';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  currentUserId?: string;
  canDeleteComments?: boolean;
  onDeleteComment?: (commentId: string) => void;
  isLoading?: boolean;
  isTyping?: boolean;
}

const CommentList: React.FC<CommentListProps> = ({
  comments, 
  currentUserId,
  canDeleteComments = false,
  onDeleteComment,
  isLoading = false,
  isTyping = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);


  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Cargando comentarios...</span>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No hay comentarios</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sé el primero en dejar un comentario sobre este pedido.</p>
        </div>
      </div>
    );
  }

  // Agrupar comentarios por fecha para mostrar separadores
  const groupedComments = comments.reduce((groups: { [key: string]: Comment[] }, comment) => {
    const date = new Date(comment.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(comment);
    return groups;
  }, {});

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateString === today) {
      return 'Hoy';
    } else if (dateString === yesterday) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div 
      ref={scrollRef}
      className="flex flex-col-reverse h-full w-full overflow-y-auto px-4 py-2 space-y-1
                 scrollbar-thin scrollbar-track-gray-100 dark:scrollbar-track-gray-800 
                 scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 
                 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500
                 scrollbar-track-rounded-full scrollbar-thumb-rounded-full"
    >
      {Object.entries(groupedComments)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .map(([dateString, dayComments]) => (
          <div key={dateString}>
            {/* Comentarios del día - se renderizan antes del separador en el DOM
                pero visualmente aparecen encima debido a flex-col-reverse */}
            {dayComments
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  canDeleteComments={canDeleteComments}
                  onDelete={onDeleteComment}
                />
              ))}

            {/* Separador de fecha */}
            <div className="flex items-center justify-center py-3">
              <div className="flex-1 border-t-2 border-gray-200 dark:border-gray-600"></div>
              <div className="px-4 py-1 text-xs font-bold text-gray-600 dark:text-gray-400
                            bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800
                            border border-gray-200 dark:border-gray-600 rounded-full shadow-sm">
                {formatDateSeparator(dateString)}
              </div>
              <div className="flex-1 border-t-2 border-gray-200 dark:border-gray-600"></div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default CommentList;