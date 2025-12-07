-- Migration: Replace Jitsi with Google Meet Live Classes
-- This script:
-- 1. Removes Jitsi-specific columns
-- 2. Adds generic live class columns for Google Meet/Zoom/Teams
-- 3. Simplifies the schema for external meeting links

-- Step 1: Add new live class columns
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS meeting_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS meeting_platform TEXT DEFAULT 'google_meet';

-- Step 2: Remove Jitsi-specific columns (no longer needed)
ALTER TABLE public.lessons 
DROP COLUMN IF EXISTS jitsi_meeting_id,
DROP COLUMN IF EXISTS jitsi_meeting_url;

-- Step 3: Drop Jitsi index
DROP INDEX IF EXISTS idx_lessons_jitsi_meeting_id;

-- Step 4: Create indexes for live classes
CREATE INDEX IF NOT EXISTS idx_lessons_is_live 
ON public.lessons(is_live) 
WHERE is_live = TRUE;

CREATE INDEX IF NOT EXISTS idx_lessons_meeting_date 
ON public.lessons(meeting_date) 
WHERE meeting_date IS NOT NULL;

-- Step 5: Update video_provider constraint to remove 'jitsi'
ALTER TABLE public.lessons 
DROP CONSTRAINT IF EXISTS lessons_video_provider_check;

ALTER TABLE public.lessons 
ADD CONSTRAINT lessons_video_provider_check 
CHECK (
    video_provider = ANY (
        ARRAY['youtube'::text, 'bunny'::text, 'direct'::text]
    )
);

-- Step 6: Add constraint for meeting_platform
ALTER TABLE public.lessons 
ADD CONSTRAINT lessons_meeting_platform_check 
CHECK (
    meeting_platform IS NULL OR
    meeting_platform = ANY (
        ARRAY['google_meet'::text, 'zoom'::text, 'teams'::text, 'other'::text]
    )
);

-- Step 7: Add helpful comments
COMMENT ON COLUMN public.lessons.is_live IS 'TRUE if this is a live class (not a recorded video)';
COMMENT ON COLUMN public.lessons.meeting_url IS 'External meeting link (Google Meet, Zoom, Teams, etc.)';
COMMENT ON COLUMN public.lessons.meeting_date IS 'Scheduled start time for the live class';
COMMENT ON COLUMN public.lessons.meeting_platform IS 'Platform for live class: google_meet, zoom, teams, or other';

-- Summary of changes:
-- ✅ Added: is_live, meeting_url, meeting_date, meeting_platform
-- ❌ Removed: jitsi_meeting_id, jitsi_meeting_url (embedded approach abandoned)
-- ✅ Kept: bunny_video_id, bunny_guid, bunny_library_id (for VOD uploads)
-- ✅ Updated: video_provider constraint (removed 'jitsi')
-- ✅ New approach: External meeting links (no embedding, no 5-min limit!)
