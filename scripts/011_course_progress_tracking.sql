-- Add lesson progress tracking
-- This script adds tables and columns for tracking student progress through courses

-- Create lesson_progress table to track individual lesson completion
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Add progress tracking columns to enrollments table
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_accessed_lesson_id UUID REFERENCES lessons(id),
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_progress ON enrollments(user_id, progress_percentage);

-- Enable RLS on lesson_progress
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_progress
DROP POLICY IF EXISTS "Users can view their own lesson progress" ON lesson_progress;
CREATE POLICY "Users can view their own lesson progress"
    ON lesson_progress FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own lesson progress" ON lesson_progress;
CREATE POLICY "Users can insert their own lesson progress"
    ON lesson_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own lesson progress" ON lesson_progress;
CREATE POLICY "Users can update their own lesson progress"
    ON lesson_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to calculate and update course progress
CREATE OR REPLACE FUNCTION update_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_lessons INTEGER;
    v_completed_lessons INTEGER;
    v_progress DECIMAL(5,2);
BEGIN
    -- Count total lessons in the course
    SELECT COUNT(*)
    INTO v_total_lessons
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = p_course_id;

    -- Count completed lessons
    SELECT COUNT(*)
    INTO v_completed_lessons
    FROM lesson_progress
    WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND completed = TRUE;

    -- Calculate progress percentage
    IF v_total_lessons > 0 THEN
        v_progress := (v_completed_lessons::DECIMAL / v_total_lessons::DECIMAL) * 100;
    ELSE
        v_progress := 0;
    END IF;

    -- Update enrollment progress
    UPDATE enrollments
    SET progress_percentage = v_progress,
        updated_at = NOW()
    WHERE user_id = p_user_id
    AND course_id = p_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update course progress when lesson progress changes
CREATE OR REPLACE FUNCTION trigger_update_course_progress()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_course_progress(NEW.user_id, NEW.course_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lesson_progress_update_trigger ON lesson_progress;
CREATE TRIGGER lesson_progress_update_trigger
AFTER INSERT OR UPDATE ON lesson_progress
FOR EACH ROW
EXECUTE FUNCTION trigger_update_course_progress();

-- Add comment
COMMENT ON TABLE lesson_progress IS 'Tracks individual lesson completion for students';
COMMENT ON COLUMN enrollments.progress_percentage IS 'Overall course completion percentage (0-100)';
