-- Enable Realtime for notifications table
-- This is required for the client to receive 'INSERT' events
BEGIN;
  -- Check if the table is already in the publication to avoid errors (though ADD TABLE is usually idempotent or throws if exists, safe to just run)
  -- simpler approach:
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
COMMIT;
