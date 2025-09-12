export interface Comment {
  id: string;
  pedidoId: string;
  userId: string;
  userRole: string;
  username: string;
  message: string;
  timestamp: Date;
  isSystemMessage?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
}

export interface CommentFormData {
  message: string;
}

export interface CommentSocketEvents {
  commentAdded: Comment;
  commentUpdated: Comment;
  commentDeleted: { commentId: string; pedidoId: string };
}