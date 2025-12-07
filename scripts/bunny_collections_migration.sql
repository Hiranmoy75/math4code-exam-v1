-- Add bunny_collection_id column to courses table
-- This stores the Bunny.net collection ID for organizing videos by course

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS bunny_collection_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.courses.bunny_collection_id IS 'Bunny.net collection (folder) ID for organizing course videos';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_bunny_collection_id 
ON public.courses(bunny_collection_id) 
WHERE bunny_collection_id IS NOT NULL;
