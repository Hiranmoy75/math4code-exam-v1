-- Add is_downloadable column to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_downloadable BOOLEAN DEFAULT TRUE;
