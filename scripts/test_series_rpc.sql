-- ============================================================================
-- OPTIMIZATION LAYER 7: TEST SERIES RPC
-- Efficient fetching of enrolled test series progress in a single query
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_student_test_series_progress(target_user_id uuid)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    progress numeric,
    completed_exams bigint,
    total_exams bigint,
    next_exam_date timestamp with time zone,
    next_exam_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH series_stats AS (
        SELECT 
            tse.test_series_id,
            COUNT(DISTINCT tse.exam_id) as total_exams
        FROM public.test_series_exams tse
        GROUP BY tse.test_series_id
    ),
    completed_stats AS (
        SELECT 
            tse.test_series_id,
            COUNT(DISTINCT ea.exam_id) as completed_exams
        FROM public.test_series_exams tse
        JOIN public.exam_attempts ea ON tse.exam_id = ea.exam_id
        WHERE ea.student_id = target_user_id
        AND ea.status IN ('submitted', 'graded')
        GROUP BY tse.test_series_id
    ),
    next_exams AS (
        SELECT DISTINCT ON (tse.test_series_id)
            tse.test_series_id,
            e.start_time,
            e.title
        FROM public.test_series_exams tse
        JOIN public.exams e ON tse.exam_id = e.id
        WHERE e.start_time > now()
        ORDER BY tse.test_series_id, e.start_time ASC
    )
    SELECT 
        ts.id,
        ts.title,
        ts.description,
        -- Calculate Progress
        CASE 
            WHEN COALESCE(ss.total_exams, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(cs.completed_exams, 0)::numeric / ss.total_exams::numeric) * 100, 0)
        END as progress,
        COALESCE(cs.completed_exams, 0) as completed_exams,
        COALESCE(ss.total_exams, 0) as total_exams,
        ne.start_time as next_exam_date,
        ne.title as next_exam_name
    FROM public.test_series_enrollments e
    JOIN public.test_series ts ON e.test_series_id = ts.id
    LEFT JOIN series_stats ss ON ts.id = ss.test_series_id
    LEFT JOIN completed_stats cs ON ts.id = cs.test_series_id
    LEFT JOIN next_exams ne ON ts.id = ne.test_series_id
    WHERE e.student_id = target_user_id;
END;
$$;
