import React from 'react';
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
  // Se ha eliminado useRef y useEffect de aquí

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        {/* ... contenido de carga ... */}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        {/* ... contenido de "no hay comentarios" ... */}
      </div>
    );
  }

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
    
    if (dateString === today) return 'Hoy';
    if (dateString === yesterday) return 'Ayer';
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="flex flex-col-reverse px-4 py-2 space-y-1">
      {Object.entries(groupedComments)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .map(([dateString, dayComments]) => (
          <React.Fragment key={dateString}>
            <div className="space-y-1">
              {dayComments
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUserId}
                    canDeleteComments={canDeleteComments}
                    onDelete={onDeleteComment}
                  />
                ))}
            </div>
            <div className="flex items-center justify-center py-3 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex-1 border-t-2 border-gray-200 dark:border-gray-600"></div>
              <div className="px-4 py-1 text-xs font-bold text-gray-600 dark:text-gray-400
                            bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800
                            border border-gray-200 dark:border-gray-600 rounded-full shadow-sm">
                {formatDateSeparator(dateString)}
              </div>
              <div className="flex-1 border-t-2 border-gray-200 dark:border-gray-600"></div>
            </div>
          </React.Fragment>
        ))}
    </div>
  );
};

export default CommentList;