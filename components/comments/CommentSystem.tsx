import React, { useState, useRef, useEffect } from 'react'; // AÑADIDO: useRef y useEffect
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
  
  const { 
    comments, 
    isLoading, 
    isSubmitting, 
    error,
    addComment, 
    deleteComment 
  } = useComments(pedidoId);
  
  // AÑADIDO: Lógica de scroll movida aquí
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [comments, isLoading]); // Se ejecuta cuando los comentarios cambian o terminan de cargar

  const handleAddComment = async (data: CommentFormData) => {
    // ... (sin cambios aquí)
  };

  const handleDeleteComment = async (commentId: string) => {
    // ... (sin cambios aquí)
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* ... (sin cambios en la parte de error y estado de conexión) ... */}

      {/* AÑADIDO: ref={scrollRef} al div con overflow-y-auto */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          canDeleteComments={canDeleteComments}
          onDeleteComment={handleDeleteComment}
          isLoading={isLoading}
          isTyping={isTyping}
        />
      </div>

      {/* ... (sin cambios en la parte del input y aviso de auth) ... */}
    </div>
  );
};

export default CommentSystem;