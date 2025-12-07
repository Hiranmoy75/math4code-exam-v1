-- ============================================================================
-- BUNNY.NET VIDEO HOSTING SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- This schema adds support for Bunny.net video hosting (VOD + Live Streaming)
-- while maintaining backward compatibility with YouTube videos
-- ============================================================================

-- 1. Create table to store Bunny.net credentials per admin/organization
CREATE TABLE IF NOT EXISTS public.bunny_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    bunny_api_key text NOT NULL,
    bunny_library_id text NOT NULL,
    bunny_stream_library_id text, -- For live streaming (optional, can be same as VOD)
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT bunny_settings_pkey PRIMARY KEY (id),
    CONSTRAINT bunny_settings_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT bunny_settings_user_unique UNIQUE (user_id)
);

-- Enable RLS for security
ALTER TABLE public.bunny_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view/edit their own settings
CREATE POLICY "Users can view their own bunny settings"
    ON public.bunny_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bunny settings"
    ON public.bunny_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bunny settings"
    ON public.bunny_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bunny settings"
    ON public.bunny_settings FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Update lessons table to support multiple video providers and types
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS video_provider text 
    CHECK (video_provider IN ('youtube', 'bunny', 'direct')) 
    DEFAULT 'youtube';

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS video_type text 
    CHECK (video_type IN ('vod', 'live')) 
    DEFAULT 'vod';

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS bunny_video_id text;

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS bunny_guid text;

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS bunny_stream_id text;

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS video_status text 
    CHECK (video_status IN ('processing', 'ready', 'live', 'ended', 'error')) 
    DEFAULT 'ready';

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS stream_key text; -- For live streaming

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS rtmp_url text; -- For live streaming

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_lessons_bunny_video_id 
    ON public.lessons(bunny_video_id) WHERE bunny_video_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_bunny_stream_id 
    ON public.lessons(bunny_stream_id) WHERE bunny_stream_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_video_provider 
    ON public.lessons(video_provider);

CREATE INDEX IF NOT EXISTS idx_lessons_video_type 
    ON public.lessons(video_type);

-- 3. Set default values for existing lessons (backward compatibility)
UPDATE public.lessons 
SET 
    video_provider = 'youtube',
    video_type = 'vod',
    video_status = 'ready'
WHERE 
    content_type = 'video' 
    AND video_provider IS NULL;

-- 4. Create a table to track live stream sessions (optional, for analytics)
CREATE TABLE IF NOT EXISTS public.live_stream_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    lesson_id uuid NOT NULL,
    bunny_stream_id text NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    viewer_count integer DEFAULT 0,
    duration_seconds integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT live_stream_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT live_stream_sessions_lesson_id_fkey FOREIGN KEY (lesson_id) 
        REFERENCES public.lessons(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.live_stream_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view live stream sessions
CREATE POLICY "Anyone can view live stream sessions"
    ON public.live_stream_sessions FOR SELECT
    USING (true);

-- Policy: Only admins can insert/update live stream sessions
CREATE POLICY "Admins can manage live stream sessions"
    ON public.live_stream_sessions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Create function to update lesson video status
CREATE OR REPLACE FUNCTION update_lesson_video_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_lessons_video_status_trigger ON public.lessons;
CREATE TRIGGER update_lessons_video_status_trigger
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW
    WHEN (OLD.video_status IS DISTINCT FROM NEW.video_status)
    EXECUTE FUNCTION update_lesson_video_status();

-- 6. Add comments for documentation
COMMENT ON TABLE public.bunny_settings IS 'Stores Bunny.net API credentials for each admin user';
COMMENT ON COLUMN public.lessons.video_provider IS 'Video hosting provider: youtube, bunny, or direct URL';
COMMENT ON COLUMN public.lessons.video_type IS 'Type of video: vod (video on demand) or live (live stream)';
COMMENT ON COLUMN public.lessons.bunny_video_id IS 'Bunny.net video ID for VOD content';
COMMENT ON COLUMN public.lessons.bunny_stream_id IS 'Bunny.net stream ID for live streaming';
COMMENT ON COLUMN public.lessons.video_status IS 'Current status of the video: processing, ready, live, ended, error';
COMMENT ON COLUMN public.lessons.stream_key IS 'RTMP stream key for live streaming (OBS/Zoom)';
COMMENT ON COLUMN public.lessons.rtmp_url IS 'RTMP server URL for live streaming';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Created bunny_settings table with RLS policies
-- ✅ Updated lessons table with new columns
-- ✅ Added indexes for performance
-- ✅ Set default values for existing records
-- ✅ Created live_stream_sessions tracking table
-- ✅ Added triggers and functions
-- ============================================================================
