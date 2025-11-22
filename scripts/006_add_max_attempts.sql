-- Add max_attempts column to test_series_exams table
-- This allows admins to set a maximum number of attempts per exam in a test series
-- NULL or 0 means unlimited attempts

ALTER TABLE public.test_series_exams 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT NULL;

-- Add a comment to explain the column
COMMENT ON COLUMN public.test_series_exams.max_attempts IS 'Maximum number of attempts allowed for this exam. NULL or 0 means unlimited attempts.';
