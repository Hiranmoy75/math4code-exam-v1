-- Add show_results_immediately column to exams table for admin control
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS show_results_immediately BOOLEAN DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.exams.show_results_immediately IS 'Controls whether students can see results immediately after quiz submission';
