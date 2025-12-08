-- ============================================================================
-- OPTIMIZATION LAYER 3: CHART DATA RPC (DEBUG VERSION)
-- Relaxed constraints to find any data
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_chart_data(admin_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_chart_data jsonb;
BEGIN
    -- 1. Generate Last 7 Days Series
    WITH last_7_days AS (
        SELECT generate_series(
            date_trunc('day', now()) - interval '6 days',
            date_trunc('day', now()),
            interval '1 day'
        ) as day_date
    ),
    -- 2. Aggregate Daily Stats (Updated Logic)
    daily_stats AS (
        SELECT 
            -- Use started_at if submitted_at is null, cast to date
            date_trunc('day', COALESCE(ea.submitted_at, ea.started_at, ea.created_at)) as stat_date,
            COUNT(ea.id) as attempts,
            -- Use 0 if percentage is null
            AVG(COALESCE(r.percentage, 0)) as avg_score
        FROM public.exam_attempts ea
        JOIN public.exams e ON ea.exam_id = e.id
        LEFT JOIN public.results r ON ea.id = r.attempt_id
        WHERE e.admin_id = admin_uuid
        -- REMOVED STATUS CHECK: Now counts submitted, graded, started... everything to just show activity
        -- AND ea.status = 'graded' 
        AND (ea.submitted_at >= (now() - interval '7 days') OR ea.started_at >= (now() - interval '7 days'))
        GROUP BY 1
    )
    -- 3. Combine and Format JSON
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
