import { MentionedUser } from '../utils/mentions';

export interface Comment {
  id: string;
  pedidoId: string;
  userId: string;
  userRole: string;
  username: string;
  message: string;
  timestamp: Date;
  mentionedUsers?: MentionedUser[];
  isSystemMessage?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
}

export interface CommentFormData {
  message: string;
  mentionedUsers?: MentionedUser[];
}

export interface CommentSocketEvents {
  commentAdded: Comment;
  commentUpdated: Comment;
  commentDeleted: { commentId: string; pedidoId: string };
}