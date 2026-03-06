-- Migration 040: Optimize action_history and notifications indexes
-- Description: Add missing composite indexes for production performance

-- action_history: composite index for filtered context queries
CREATE INDEX IF NOT EXISTS idx_action_history_context_type_id ON action_history(context_type, context_id);

-- action_history: timestamp DESC for ordering (the existing idx may lack DESC)
CREATE INDEX IF NOT EXISTS idx_action_history_timestamp_desc ON action_history(timestamp DESC);

-- notifications: composite index for fast unread count per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read);

-- notifications: timestamp DESC for ordering
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp_desc ON notifications(timestamp DESC);
