-- Add total_time_spent column to exam_attempts table
ALTER TABLE public.exam_attempts ADD COLUMN IF NOT EXISTS total_time_spent INTEGER DEFAULT 0;

-- Update RLS policy to allow updating total_time_spent
-- (Assuming existing update policy might be restrictive, but usually 'exam_attempts_insert_own' covers creation)
-- We need an update policy for students to update their own attempts (e.g. for timer)
CREATE POLICY "exam_attempts_update_own" ON public.exam_attempts FOR UPDATE USING (auth.uid() = student_id);
