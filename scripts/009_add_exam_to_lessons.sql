-- Add exam_id column to lessons table to link quizzes/exams
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_lessons_exam_id ON public.lessons(exam_id);

-- Update the content_type check constraint to ensure quiz lessons have exam_id
-- Note: We'll handle this validation in the application layer
