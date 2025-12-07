-- Migration: Replace Bunny.net live streaming with Jitsi Meet
-- This script:
-- 1. Removes unused Bunny.net live streaming columns (bunny_stream_id, stream_key, rtmp_url)
-- 2. Adds Jitsi Meet columns for live classes
-- 3. Updates constraints to include 'jitsi' as a video provider

-- Step 1: Add Jitsi Meet columns
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS jitsi_meeting_id TEXT,
ADD COLUMN IF NOT EXISTS jitsi_meeting_url TEXT;

-- Step 2: Remove unused Bunny.net live streaming columns
-- These were for RTMP streaming which Bunny.net Stream doesn't actually support
ALTER TABLE public.lessons 
DROP COLUMN IF EXISTS bunny_stream_id,
DROP COLUMN IF EXISTS stream_key,
DROP COLUMN IF EXISTS rtmp_url;

-- Step 3: Drop the old bunny_stream_id index (if it exists)
DROP INDEX IF EXISTS idx_lessons_bunny_stream_id;

-- Step 4: Create index for Jitsi meeting ID
CREATE INDEX IF NOT EXISTS idx_lessons_jitsi_meeting_id 
ON public.lessons(jitsi_meeting_id) 
WHERE jitsi_meeting_id IS NOT NULL;

-- Step 5: Update video_provider check constraint to include 'jitsi'
ALTER TABLE public.lessons 
DROP CONSTRAINT IF EXISTS lessons_video_provider_check;

ALTER TABLE public.lessons 
ADD CONSTRAINT lessons_video_provider_check 
CHECK (
    video_provider = ANY (
        ARRAY['youtube'::text, 'bunny'::text, 'direct'::text, 'jitsi'::text]
    )
);

-- Step 6: Add helpful comments
COMMENT ON COLUMN public.lessons.jitsi_meeting_id IS 'Jitsi Meet meeting ID for live classes';
COMMENT ON COLUMN public.lessons.jitsi_meeting_url IS 'Full Jitsi Meet URL for joining the live class';
COMMENT ON COLUMN public.lessons.bunny_video_id IS 'Bunny.net video ID for VOD (uploaded videos only)';
COMMENT ON COLUMN public.lessons.bunny_guid IS 'Bunny.net GUID for VOD videos';
COMMENT ON COLUMN public.lessons.bunny_library_id IS 'Bunny.net library ID';

-- Summary of changes:
-- ✅ Added: jitsi_meeting_id, jitsi_meeting_url
-- ❌ Removed: bunny_stream_id, stream_key, rtmp_url (unused RTMP columns)
-- ✅ Kept: bunny_video_id, bunny_guid, bunny_library_id (for VOD uploads)
-- ✅ Updated: video_provider constraint to include 'jitsi'
