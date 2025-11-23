-- Create a secure function to fetch exam results
-- This bypasses RLS to allow admins to see all results for an exam
CREATE OR REPLACE FUNCTION get_exam_results(p_exam_id UUID)
RETURNS TABLE (
  attempt_id UUID,
  student_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  status TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  total_marks INTEGER,
  obtained_marks DECIMAL(10, 2),
  percentage DECIMAL(5, 2),
  rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ea.id as attempt_id,
    ea.student_id,
    p.full_name,
    p.email,
    NULL::TEXT as avatar_url,
    ea.status,
    ea.submitted_at,
    r.total_marks,
    r.obtained_marks,
    r.percentage,
    r.rank
  FROM exam_attempts ea
  JOIN profiles p ON ea.student_id = p.id
  LEFT JOIN results r ON ea.id = r.attempt_id
  WHERE ea.exam_id = p_exam_id
  ORDER BY r.percentage DESC NULLS LAST, ea.submitted_at DESC;
END;
$$;
