-- ============================================================================
-- OPTIMIZATION LAYER 5: CHAT INDEXING
-- Crucial for handling 1000+ Concurrent Students
-- ============================================================================

-- 1. Index for Sorting Messages (Most important for initial load)
CREATE INDEX IF NOT EXISTS idx_community_messages_channel_created 
ON public.community_messages (channel_id, created_at DESC);

-- 2. Index for Foreign Keys (For fast joins with profiles)
CREATE INDEX IF NOT EXISTS idx_community_messages_user_id 
ON public.community_messages (user_id);

-- 3. Index for Reactions (If used heavily)
CREATE INDEX IF NOT EXISTS idx_community_reactions_message_id 
ON public.community_reactions (message_id);

-- 4. Index for Bookmarks
CREATE INDEX IF NOT EXISTS idx_community_bookmarks_user_id 
ON public.community_bookmarks (user_id);

-- 5. VACUUM ANALYZE (Run this to refresh stats for query planner)
-- Note: You might need to run this manually in SQL Editor if this script fails on permission
-- BUT the indexes above are safe to create.

COMMENT ON TABLE public.community_messages IS 'Optimized for high-concurrency chat';
