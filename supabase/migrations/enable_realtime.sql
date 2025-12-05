-- Enable Realtime for Community Tables
-- Run this in Supabase SQL Editor

-- Enable realtime publication for community tables
ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE community_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE community_channels;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename LIKE 'community%';

-- Expected output:
-- public | community_messages
-- public | community_reactions  
-- public | community_channels
