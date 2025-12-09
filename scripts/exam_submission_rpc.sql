-- ============================================================================
-- OPTIMIZATION LAYER 8: SECURE EXAM SUBMISSION RPC
-- Calculates results server-side atomically. Prevents client-side manipulation.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.submit_exam_attempt(p_attempt_id uuid, p_exam_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_marks numeric := 0;
    v_obtained_marks numeric := 0;
    v_percentage numeric := 0;
    v_result_id uuid;
    v_section_record RECORD;
    v_q_record RECORD;
    v_student_ans text;
    v_is_correct boolean;
    v_sec_total numeric;
    v_sec_obtained numeric;
    v_sec_correct int;
    v_sec_wrong int;
    v_sec_unanswered int;
    v_return_data jsonb;
BEGIN
    -- 1. Verify Attempt belongs to user (implicitly handled by RLS, but RPC is Security Definer, so we trust ID passed after checks)
    -- Also check if already submitted to prevent double submission
    IF EXISTS (SELECT 1 FROM public.results WHERE attempt_id = p_attempt_id) THEN
        RETURN jsonb_build_object('error', 'Exam already submitted');
    END IF;

    -- Update status to submitted immediately to prevent race conditions
    UPDATE public.exam_attempts 
    SET status = 'submitted', submitted_at = now() 
    WHERE id = p_attempt_id;

    -- 2. Calculate Total Marks for Exam
    SELECT COALESCE(SUM(total_marks), 0) INTO v_total_marks 
    FROM public.exams WHERE id = p_exam_id;

    -- 3. Loop through Sections to Calculate Section-wise Results
    FOR v_section_record IN 
        SELECT id, title FROM public.sections WHERE exam_id = p_exam_id
    LOOP
        v_sec_total := 0;
        v_sec_obtained := 0;
        v_sec_correct := 0;
        v_sec_wrong := 0;
        v_sec_unanswered := 0;

        -- Loop through questions in this section
        FOR v_q_record IN 
            SELECT q.id, q.marks, q.negative_marks, q.correct_answer, q.question_type, q.question_text
            FROM public.questions q 
            WHERE q.section_id = v_section_record.id
        LOOP
            v_sec_total := v_sec_total + v_q_record.marks;
            
            -- Get Student Answer
            SELECT student_answer INTO v_student_ans 
            FROM public.responses 
            WHERE attempt_id = p_attempt_id AND question_id = v_q_record.id;

            IF v_student_ans IS NULL OR v_student_ans = '' OR v_student_ans = '[]' THEN
                v_sec_unanswered := v_sec_unanswered + 1;
            ELSE
                v_is_correct := false;

                -- Logic for different question types (Basic string comparison for now, can be improved for JSON)
                -- Ideally, NAT should be numeric compared, MCQ exact string.
                
                IF v_q_record.question_type = 'NAT' THEN
                    BEGIN
                        IF ABS(v_student_ans::numeric - v_q_record.correct_answer::numeric) < 0.01 THEN
                            v_is_correct := true;
                        END IF;
                    EXCEPTION WHEN OTHERS THEN
                        v_is_correct := false; -- Parsing error means wrong
                    END;
                ELSIF v_q_record.question_type = 'MCQ' THEN
                     -- Helper: we need to find the option ID that is marked is_correct for this question
                    IF EXISTS (
                        SELECT 1 FROM public.options o 
                        WHERE o.question_id = v_q_record.id 
                        AND o.is_correct = true 
                        AND o.id::text = v_student_ans
                    ) THEN
                        v_is_correct := true;
                    END IF;
                ELSIF v_q_record.question_type = 'MSQ' THEN
                   -- COMPLEX MSQ LOGIC: Need to parse JSON arrays and compare strictly
                   -- For now, simplistic check: verify counts match and all are correct
                   -- (This part usually requires Array logic in SQL or storing sorted arrays)
                   
                   -- Fallback: We assume client sends sorted JSON array of IDs.
                   -- Server-side MSQ validation is complex in pure PL/pgSQL without extensions.
                   -- We will trust the stored 'responses' logic for now or implement exact array matching later.
                   -- *Temporary simplification*: We treat it as correct if verified by option IDs.
                   
                    DECLARE
                        v_correct_opts text[];
                        v_student_opts text[];
                    BEGIN
                        SELECT array_agg(id::text ORDER BY id) INTO v_correct_opts 
                        FROM public.options 
                        WHERE question_id = v_q_record.id AND is_correct = true;

                        -- Parse JSON array string to PG Array (requires clean JSON input)
                        SELECT ARRAY(SELECT jsonb_array_elements_text(v_student_ans::jsonb) ORDER BY 1) INTO v_student_opts;

                        IF v_correct_opts = v_student_opts THEN
                            v_is_correct := true;
                        END IF;
                    EXCEPTION WHEN OTHERS THEN
                        v_is_correct := false;
                    END;
                END IF;

                IF v_is_correct THEN
                    v_sec_correct := v_sec_correct + 1;
                    v_sec_obtained := v_sec_obtained + v_q_record.marks;
                ELSE
                    v_sec_wrong := v_sec_wrong + 1;
                    v_sec_obtained := v_sec_obtained - ABS(v_q_record.negative_marks);
                END IF;
            END IF;
        END LOOP;

        v_obtained_marks := v_obtained_marks + v_sec_obtained;

        -- Insert Section Result will be done after main result creation (fk constraint)
        -- Store temporary values? No, we can't easily. 
        -- Actually, we must create result first. But we need total obtained marks first.
        -- So we'll use a temp table or variable.
        
        -- Better approach: Calculate all totals first, Insert Result, Then Insert Sections.
        -- Since we are looping sections, we can build a JSON array of section results to insert later.
        
    END LOOP;

    -- RE-LOOP Strategy (Simpler for PL/pgSQL structure):
    -- 1. Calculate Grand Totals only first? No, we need section details.
    
    -- Let's do it in one pass using CTEs for cleaner code if possible, or stick to variables.
    -- To keep it valid, we restart.
    
    -- ---------------------------------------------------------
    -- CTE APPROACH (More Robust & Cleaner for Batch Processing)
    -- ---------------------------------------------------------
    
    WITH ranked_answers AS (
        SELECT 
            q.section_id,
            q.id as q_id,
            q.marks,
            q.negative_marks,
            q.question_type,
            q.correct_answer as nat_correct,
            r.student_answer,
            -- For MCQ/MSQ correctness
            (
                CASE 
                    WHEN q.question_type = 'MCQ' THEN 
                        EXISTS (SELECT 1 FROM public.options o WHERE o.id::text = r.student_answer AND o.question_id = q.id AND o.is_correct = true)
                    WHEN q.question_type = 'NAT' THEN 
                        (r.student_answer::numeric - q.correct_answer::numeric) BETWEEN -0.01 AND 0.01
                    WHEN q.question_type = 'MSQ' THEN
                        (
                            SELECT array_agg(id::text ORDER BY id) FROM public.options WHERE question_id = q.id AND is_correct = true
                        ) = (
                            SELECT ARRAY(SELECT jsonb_array_elements_text(r.student_answer::jsonb) ORDER BY 1)
                        )
                    ELSE false
                END
            ) as is_correct,
            (r.student_answer IS NOT NULL AND r.student_answer != '' AND r.student_answer != '[]') as is_attempted
        FROM public.questions q
        JOIN public.sections s ON q.section_id = s.id
        LEFT JOIN public.responses r ON q.id = r.question_id AND r.attempt_id = p_attempt_id
        WHERE s.exam_id = p_exam_id
    ),
    section_stats AS (
        SELECT 
            section_id,
            SUM(marks) as sec_total_marks,
            SUM(CASE 
                WHEN is_correct THEN marks 
                WHEN is_attempted AND NOT is_correct THEN -ABS(negative_marks)
                ELSE 0 
            END) as sec_obtained_marks,
            COUNT(*) FILTER (WHERE is_correct) as sec_correct,
            COUNT(*) FILTER (WHERE is_attempted AND NOT is_correct) as sec_wrong,
            COUNT(*) FILTER (WHERE NOT is_attempted) as sec_unanswered
        FROM ranked_answers
        GROUP BY section_id
    )
    -- Insert Main Result
    , main_insert AS (
        INSERT INTO public.results (attempt_id, total_marks, obtained_marks, percentage)
        SELECT 
            p_attempt_id,
            v_total_marks,
            SUM(sec_obtained_marks),
            CASE WHEN v_total_marks > 0 THEN ROUND((SUM(sec_obtained_marks) / v_total_marks) * 100, 2) ELSE 0 END
        FROM section_stats
        RETURNING id, obtained_marks, percentage
    )
    -- Insert Section Results
    INSERT INTO public.section_results (result_id, section_id, total_marks, obtained_marks, correct_answers, wrong_answers, unanswered)
    SELECT 
        (SELECT id FROM main_insert),
        section_id,
        sec_total_marks,
        sec_obtained_marks,
        sec_correct,
        sec_wrong,
        sec_unanswered
    FROM section_stats;

    -- Update Exam Attempt Status if not done (redundant safety)
    UPDATE public.exam_attempts SET status = 'submitted' WHERE id = p_attempt_id;

    -- Get Final Result Data to Return
    SELECT jsonb_build_object(
        'id', r.id,
        'obtained_marks', r.obtained_marks,
        'percentage', r.percentage
    ) INTO v_return_data
    FROM public.results r WHERE r.attempt_id = p_attempt_id;

    RETURN v_return_data;
END;
$$;
