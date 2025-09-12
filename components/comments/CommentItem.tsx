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
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'Supervisor':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'Operador':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'Visualizador':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  if (comment.isSystemMessage) {
    return (
      <div className="flex items-start space-x-3 py-2">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
            {comment.message}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatTimestamp(comment.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 py-3 group hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 -mx-2 transition-colors">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {comment.username.charAt(0).toUpperCase()}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {comment.username}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(comment.userRole)}`}>
            {comment.userRole}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTimestamp(comment.timestamp)}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
              (editado)
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-800 dark:text-gray-200 break-words">
          {comment.message}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;