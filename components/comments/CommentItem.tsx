import React from 'react';
import { Comment } from '../../types/comments';
import { formatDistanceToNow } from '../../utils/date';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  canDeleteComments?: boolean;
  onDelete?: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  currentUserId, 
  canDeleteComments = false,
  onDelete 
}) => {
  const isOwnComment = currentUserId === comment.userId;
  const canDelete = canDeleteComments || isOwnComment;

  const handleDelete = () => {
    if (onDelete && window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      onDelete(comment.id);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Hace un momento';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrador':
        return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700';
      case 'Supervisor':
        return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700';
      case 'Operador':
        return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700';
      case 'Visualizador':
        return 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
      default:
        return 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
    }
  };

  if (comment.isSystemMessage) {
    return (
      <div className="flex items-start space-x-3 py-3 px-3 -mx-1 rounded-xl 
                      bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-750
                      border border-amber-200 dark:border-gray-600 shadow-sm">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 dark:from-gray-600 dark:to-gray-700 
                          rounded-full flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-white dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-sm text-amber-800 dark:text-gray-200 italic font-medium bg-white dark:bg-gray-700 
                          rounded-lg px-3 py-2 border border-amber-200 dark:border-gray-600 shadow-sm">
            {comment.message}
          </div>
          <div className="text-xs text-amber-600 dark:text-gray-400 mt-2 font-medium">
            {formatTimestamp(comment.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 py-3 group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 
                    dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 rounded-xl px-3 -mx-1 transition-all duration-200
                    border border-transparent hover:border-blue-100 dark:hover:border-gray-600 hover:shadow-sm">
      <div className="flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full 
                        flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white dark:ring-gray-800">
          {comment.username.charAt(0).toUpperCase()}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {comment.username}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleColor(comment.userRole)}`}>
            {comment.userRole}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {formatTimestamp(comment.timestamp)}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic font-medium">
              (editado)
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-800 dark:text-gray-200 break-words leading-relaxed bg-gray-50 dark:bg-gray-700/50 
                        rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600 shadow-sm">
          {comment.message}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;