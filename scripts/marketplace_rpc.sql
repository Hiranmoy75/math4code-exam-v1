-- ============================================================================
-- OPTIMIZATION LAYER 6: MARKETPLACE RPC
-- Optimization for browsing All Courses (Pagination + Lesson Counts)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_published_courses_with_meta(target_user_id uuid, p_limit int DEFAULT 20, p_offset int DEFAULT 0)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    thumbnail_url text,
    price numeric,
    is_published boolean,
    created_at timestamp with time zone,
    instructor_name text,
    total_lessons bigint,
    is_enrolled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.price,
        c.is_published,
        c.created_at,
        'Admin'::text as instructor_name, -- Placeholder until we join profiles properly
        (
            SELECT COUNT(l.id)
            FROM public.modules m
            JOIN public.lessons l ON m.id = l.module_id
            WHERE m.course_id = c.id
        ) as total_lessons,
        CASE 
            WHEN target_user_id IS NULL THEN false
            ELSE EXISTS (
                SELECT 1 FROM public.enrollments e 
                WHERE e.course_id = c.id 
                AND e.user_id = target_user_id 
                AND e.status = 'active'
            )
        END as is_enrolled
    FROM public.courses c
    WHERE c.is_published = true
    ORDER BY c.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;
