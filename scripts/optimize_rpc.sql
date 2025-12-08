-- ============================================================================
-- OPTIMIZATION LAYER 2: STORED FUNCTIONS (RPC)
-- Moved heavy logic from Client Side (Hooks) to Database Side for Dashboard
-- ============================================================================

-- 1. Optimized Function for Student Stats & Rank
CREATE OR REPLACE FUNCTION public.get_student_stats(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_exams INT;
    v_average_score NUMERIC;
    v_total_seconds NUMERIC;
    v_user_rank INT;
    v_result_json jsonb;
BEGIN
    SELECT
        COUNT(ea.id),
        COALESCE(AVG(r.percentage), 0),
        COALESCE(SUM(EXTRACT(EPOCH FROM (ea.submitted_at - ea.started_at))), 0)
    INTO
        v_total_exams,
        v_average_score,
        v_total_seconds
    FROM public.exam_attempts ea
    LEFT JOIN public.results r ON ea.id = r.attempt_id
    WHERE ea.student_id = target_user_id 
    AND ea.status IN ('submitted', 'graded');

    WITH student_scores AS (
        SELECT 
            ea.student_id, 
            AVG(r.percentage) as avg_pct
        FROM public.exam_attempts ea
        JOIN public.results r ON ea.id = r.attempt_id
        WHERE ea.status IN ('submitted', 'graded')
        GROUP BY ea.student_id
    )
    SELECT COUNT(*) + 1 INTO v_user_rank
    FROM student_scores
    WHERE avg_pct > v_average_score;

    v_result_json := json_build_object(
        'totalExams', v_total_exams,
        'averageScore', ROUND(v_average_score, 2),
        'totalTimeSpent', ROUND(v_total_seconds / 3600, 2),
        'rank', COALESCE(v_user_rank, 1)
    );

    RETURN v_result_json;
END;
$$;


-- 2. Optimized Function for Student Enrolled Courses with Progress
CREATE OR REPLACE FUNCTION public.get_student_courses_progress(target_user_id uuid)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    thumbnail_url text,
    progress_percentage numeric,
    last_accessed_at timestamp with time zone,
    total_lessons bigint,
    completed_lessons bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    course_record RECORD;
    new_progress NUMERIC;
    t_lessons BIGINT;
    c_lessons BIGINT;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS temp_course_progress (
        tmp_id uuid,
        tmp_title text,
        tmp_desc text,
        tmp_thumb text,
        tmp_prog numeric,
        tmp_last timestamp with time zone,
        tmp_total bigint,
        tmp_comp bigint
    ) ON COMMIT DROP;

    FOR course_record IN 
        SELECT 
            c.id as c_id, 
            c.title as c_title, 
            c.description as c_desc, 
            c.thumbnail_url as c_thumb, 
            e.last_accessed_at as e_last, 
            e.progress_percentage as old_progress, 
            e.id as enrollment_id, 
            e.status as e_status
        FROM public.enrollments e
        JOIN public.courses c ON e.course_id = c.id
        WHERE e.user_id = target_user_id 
        AND (e.status = 'active' OR e.status = 'completed')
    LOOP
        SELECT COUNT(*) INTO t_lessons
        FROM public.modules m
        JOIN public.lessons l ON m.id = l.module_id
        WHERE m.course_id = course_record.c_id;

        SELECT COUNT(*) INTO c_lessons
        FROM public.lesson_progress lp 
        WHERE lp.user_id = target_user_id 
        AND lp.course_id = course_record.c_id 
        AND lp.completed = true;

        IF t_lessons = 0 THEN
            new_progress := 0;
        ELSE
            new_progress := ROUND((c_lessons::numeric / t_lessons::numeric) * 100, 2);
        END IF;

        UPDATE public.enrollments 
        SET 
            progress_percentage = new_progress, 
            status = CASE WHEN new_progress < 100 AND status = 'completed' THEN 'active' ELSE status END,
            updated_at = now()
        WHERE public.enrollments.id = course_record.enrollment_id; 

        INSERT INTO temp_course_progress VALUES (
            course_record.c_id,
            course_record.c_title,
            course_record.c_desc,
            course_record.c_thumb,
            new_progress,
            course_record.e_last,
            t_lessons,
            c_lessons
        );
    END LOOP;

    RETURN QUERY 
    SELECT 
        tmp_id,
        tmp_title,
        tmp_desc,
        tmp_thumb,
        tmp_prog,
        tmp_last,
        tmp_total,
        tmp_comp
    FROM temp_course_progress;
END;
$$;


-- 3. Optimized Function for Admin Dashboard Stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(admin_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exams_count INT;
    v_questions_count INT;
    v_attempts_count INT;
    v_unique_students INT;
    v_result jsonb;
BEGIN
    SELECT COUNT(*) INTO v_exams_count
    FROM public.exams 
    WHERE admin_id = admin_uuid;

    SELECT COUNT(q.id) INTO v_questions_count
    FROM public.questions q
    JOIN public.sections s ON q.section_id = s.id
    JOIN public.exams e ON s.exam_id = e.id
    WHERE e.admin_id = admin_uuid;

    SELECT COUNT(ea.id) INTO v_attempts_count
    FROM public.exam_attempts ea
    JOIN public.exams e ON ea.exam_id = e.id
    WHERE e.admin_id = admin_uuid;

    SELECT COUNT(DISTINCT ea.student_id) INTO v_unique_students
    FROM public.exam_attempts ea
    JOIN public.exams e ON ea.exam_id = e.id
    WHERE e.admin_id = admin_uuid;

    v_result := json_build_object(
        'examsCount', COALESCE(v_exams_count, 0),
        'questionsCount', COALESCE(v_questions_count, 0),
        'attemptsCount', COALESCE(v_attempts_count, 0),
        'uniqueStudents', COALESCE(v_unique_students, 0)
    );

    RETURN v_result;
END;
$$;

-- 4. NEW: Optimized Function for Real-Time Charts (Last 7 Days)
CREATE OR REPLACE FUNCTION public.get_admin_chart_data(admin_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_chart_data jsonb;
BEGIN
    WITH last_7_days AS (
        SELECT generate_series(
            date_trunc('day', now()) - interval '6 days',
            date_trunc('day', now()),
            interval '1 day'
        ) as day_date
    ),
    daily_stats AS (
        SELECT 
            date_trunc('day', ea.submitted_at) as stat_date,
            COUNT(ea.id) as attempts,
            AVG(r.percentage) as avg_score
        FROM public.exam_attempts ea
        JOIN public.exams e ON ea.exam_id = e.id
        LEFT JOIN public.results r ON ea.id = r.attempt_id
        WHERE e.admin_id = admin_uuid
        AND ea.status = 'graded'
        AND ea.submitted_at >= (now() - interval '7 days')
        GROUP BY 1
    )
    SELECT json_agg(json_build_object(
        'name', to_char(d.day_date, 'Dy'), -- Mon, Tue...
        'attempts', COALESCE(s.attempts, 0),
        'avgScore', COALESCE(ROUND(s.avg_score, 0), 0)
    ) ORDER BY d.day_date) INTO v_chart_data
    FROM last_7_days d
    LEFT JOIN daily_stats s ON d.day_date = s.stat_date;

    RETURN v_chart_data;
END;
$$;

-- 5. NEW: Optimized Function for Course Structure (Modules & Lessons)
-- This reduces multiple DB round trips and payload size for fetching course content.
-- Critical for scaling to 10000+ students.
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
                        'is_free_preview', COALESCE(l.is_free_preview, false),
                        'lesson_order', l.lesson_order,
                        'duration', l.duration,
                        'video_provider', l.video_provider,
                        'is_live', l.is_live,
                        'meeting_date', l.meeting_date
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

-- PERFORMANCE INDEXES
-- Essential for fast lookups when 10000+ students are accessing data simultaneously.
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_is_free_preview ON public.lessons(is_free_preview);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id, status);
