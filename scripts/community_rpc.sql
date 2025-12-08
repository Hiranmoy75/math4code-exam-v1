-- ============================================================================
-- OPTIMIZATION LAYER 4: COMMUNITY RPC
-- High Performance Chat Loading for 1000+ Students
-- ============================================================================

-- Function to get channels with last message and participant count in ONE request
CREATE OR REPLACE FUNCTION public.get_channels_with_meta(target_course_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    is_private boolean,
    course_id uuid,
    created_at timestamp with time zone,
    last_message_content text,
    last_message_time timestamp with time zone,
    last_message_user text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.is_private,
        c.course_id,
        c.created_at,
        (
            SELECT content 
            FROM public.community_messages m 
            WHERE m.channel_id = c.id 
            ORDER BY m.created_at DESC 
            LIMIT 1
        ) as last_message_content,
        (
            SELECT created_at 
            FROM public.community_messages m 
            WHERE m.channel_id = c.id 
            ORDER BY m.created_at DESC 
            LIMIT 1
        ) as last_message_time,
        (
            SELECT p.full_name 
            FROM public.community_messages m 
            JOIN public.profiles p ON m.user_id = p.id
            WHERE m.channel_id = c.id 
            ORDER BY m.created_at DESC 
            LIMIT 1
        ) as last_message_user
    FROM public.community_channels c
    WHERE c.course_id = target_course_id
    AND c.is_active = true
    ORDER BY c.created_at ASC;
END;
$$;
