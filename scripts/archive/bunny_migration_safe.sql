-- =====================================================
-- Bunny.net Video System - Database Migration
-- =====================================================
-- This script adds support for Bunny.net video hosting
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create bunny_settings table
CREATE TABLE IF NOT EXISTS public.bunny_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bunny_api_key TEXT NOT NULL,
    bunny_library_id TEXT NOT NULL,
    bunny_stream_library_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Add Bunny.net columns to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS video_provider TEXT DEFAULT 'youtube',
ADD COLUMN IF NOT EXISTS video_type TEXT DEFAULT 'vod',
ADD COLUMN IF NOT EXISTS bunny_video_id TEXT,
ADD COLUMN IF NOT EXISTS bunny_guid TEXT,
ADD COLUMN IF NOT EXISTS bunny_stream_id TEXT,
ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'ready',
ADD COLUMN IF NOT EXISTS stream_key TEXT,
ADD COLUMN IF NOT EXISTS rtmp_url TEXT,
ADD COLUMN IF NOT EXISTS bunny_library_id TEXT;

-- 3. Create live_stream_sessions table
CREATE TABLE IF NOT EXISTS public.live_stream_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    bunny_stream_id TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    status TEXT DEFAULT 'scheduled',
    viewer_count INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_bunny_video_id ON public.lessons(bunny_video_id);
CREATE INDEX IF NOT EXISTS idx_lessons_bunny_stream_id ON public.lessons(bunny_stream_id);
CREATE INDEX IF NOT EXISTS idx_lessons_video_provider ON public.lessons(video_provider);
CREATE INDEX IF NOT EXISTS idx_lessons_video_type ON public.lessons(video_type);
CREATE INDEX IF NOT EXISTS idx_bunny_settings_user_id ON public.bunny_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_sessions_lesson_id ON public.live_stream_sessions(lesson_id);

-- 5. Update existing video lessons to use YouTube provider
UPDATE public.lessons 
SET video_provider = 'youtube' 
WHERE content_type = 'video' 
AND video_provider IS NULL;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.bunny_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_sessions ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for bunny_settings
DROP POLICY IF EXISTS "Users can view own bunny settings" ON public.bunny_settings;
CREATE POLICY "Users can view own bunny settings" 
ON public.bunny_settings FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bunny settings" ON public.bunny_settings;
CREATE POLICY "Users can insert own bunny settings" 
ON public.bunny_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bunny settings" ON public.bunny_settings;
CREATE POLICY "Users can update own bunny settings" 
ON public.bunny_settings FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bunny settings" ON public.bunny_settings;
CREATE POLICY "Users can delete own bunny settings" 
ON public.bunny_settings FOR DELETE 
USING (auth.uid() = user_id);

-- 8. Create RLS policies for live_stream_sessions
DROP POLICY IF EXISTS "Anyone can view live stream sessions" ON public.live_stream_sessions;
CREATE POLICY "Anyone can view live stream sessions" 
ON public.live_stream_sessions FOR SELECT 
USING (true);

DROP POLICY IF NOT EXISTS "Admins can manage live stream sessions" ON public.live_stream_sessions;
CREATE POLICY "Admins can manage live stream sessions" 
ON public.live_stream_sessions FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bunny_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for bunny_settings
DROP TRIGGER IF EXISTS update_bunny_settings_timestamp ON public.bunny_settings;
CREATE TRIGGER update_bunny_settings_timestamp
BEFORE UPDATE ON public.bunny_settings
FOR EACH ROW
EXECUTE FUNCTION update_bunny_settings_updated_at();

-- 11. Create trigger for live_stream_sessions
DROP TRIGGER IF EXISTS update_live_stream_sessions_timestamp ON public.live_stream_sessions;
CREATE TRIGGER update_live_stream_sessions_timestamp
BEFORE UPDATE ON public.live_stream_sessions
FOR EACH ROW
EXECUTE FUNCTION update_bunny_settings_updated_at();

-- =====================================================
-- Migration Complete!
-- =====================================================
-- Next steps:
-- 1. Go to /admin/settings/bunny
-- 2. Enter your Bunny.net credentials
-- 3. Test and save
-- 4. Go to Course Builder
-- 5. Edit a video lesson
-- 6. You'll see 3 tabs: YouTube | Upload Video | Go Live
-- =====================================================

SELECT 'Bunny.net migration completed successfully!' as message;
