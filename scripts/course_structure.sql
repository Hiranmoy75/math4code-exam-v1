-- ============================================================================
-- PERFORMANCE OPTIMIZATION: COURSE STRUCTURE & SCALING (10k+ USERS)
-- ============================================================================

-- 1. RPC Function to fetch full course structure (Modules + Lessons) in ONE request.
-- This replaces complex client-sides joins and reduces payload size drastically.
CREATE OR REPLACE FUNCTION public.get_course_structure(target_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', m.id,
            'title', m.title,
            'module_order', m.module_order,
            'lessons', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'id', l.id,
                        'title', l.title,
                        'content_type', l.content_type,
                        'content_url', l.content_url, -- Needed for player
                        'content_text', l.content_text, -- Needed for player
                        'is_free_preview', COALESCE(l.is_free_preview, false),
                        'lesson_order', l.lesson_order,
                        'duration', l.video_duration,
                        'video_provider', l.video_provider,
                        'bunny_video_id', l.bunny_video_id,
                        'bunny_library_id', l.bunny_library_id,
                        'is_live', l.is_live,
                        'meeting_date', l.meeting_date,
                        'meeting_url', l.meeting_url,
                        'meeting_platform', l.meeting_platform,
                        'exam_id', l.exam_id,
                        'description', l.description,
                        'is_downloadable', l.is_downloadable,
                        'created_at', l.created_at,
                        'updated_at', l.updated_at
                    ) ORDER BY l.lesson_order ASC
                ), '[]'::json)
                FROM public.lessons l
                WHERE l.module_id = m.id
            )
        ) ORDER BY m.module_order ASC
    ) INTO v_result
    FROM public.modules m
    WHERE m.course_id = target_course_id;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 2. HIGH PERFORMANCE INDEXES
-- Critical for handling high concurrency (10,000+ daily users)
-- These indexes ensure that filtering by IDs is instantaneous.

-- Index for finding modules of a course
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);

-- Index for finding lessons of a module
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);

-- Index for quickly filtering free preview lessons
CREATE INDEX IF NOT EXISTS idx_lessons_is_free_preview ON public.lessons(is_free_preview);

-- Composite index for Enrollments (Used heavily in access control)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course_status ON public.enrollments(user_id, course_id, status);

-- Index for sorted retrieval (Optional but good for fallback queries)
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules(course_id, module_order);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON public.lessons(module_id, lesson_order);

-- ============================================================================
-- MARKETPLACE & SEARCH OPTIMIZATION
-- ============================================================================

-- Index for filtering published courses
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON public.courses(is_published);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at);

-- GIN Index for fast text search (ILIKE) on course titles
-- Requires pg_trgm extension. If errors, run: CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_courses_title_trgm ON public.courses USING gin (title gin_trgm_ops);
