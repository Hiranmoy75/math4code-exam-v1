CREATE OR REPLACE FUNCTION get_course_learners(p_course_id UUID)
RETURNS TABLE (
  student_id UUID,
  enrolled_at TIMESTAMP WITH TIME ZONE,
  progress_percentage numeric(5,2),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.user_id,
    e.enrolled_at,
    e.progress_percentage,   -- ⬅️ return numeric(5,2)
    p.full_name,
    p.email,
    NULL::TEXT as avatar_url
  FROM enrollments e
  JOIN profiles p ON e.user_id = p.id
  WHERE e.course_id = p_course_id
  ORDER BY e.enrolled_at DESC;
END;
$$;
