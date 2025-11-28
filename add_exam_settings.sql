-- Add result settings columns to exams table

-- Create enum for result visibility if it doesn't exist
DO $$ BEGIN
    CREATE TYPE result_visibility_type AS ENUM ('immediate', 'scheduled', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS result_visibility result_visibility_type DEFAULT 'immediate',
ADD COLUMN IF NOT EXISTS result_release_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS show_answers BOOLEAN DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN exams.result_visibility IS 'Controls when students can see their results: immediate, scheduled, or manual';
