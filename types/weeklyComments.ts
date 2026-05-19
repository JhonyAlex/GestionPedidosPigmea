export interface WeeklyComment {
  id: string;
  weekKey: string;
  userId: string;
  username: string;
  userRole: string;
  message: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
