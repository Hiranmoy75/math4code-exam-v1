-- Community System Migration
-- This migration creates all necessary tables for the community feature

-- 1. Add community_enabled column to courses table
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS community_enabled BOOLEAN DEFAULT TRUE;

-- 2. Create community_channels table
CREATE TABLE IF NOT EXISTS community_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'discussion', 'qa')),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, name)
);

-- 3. Create community_messages table
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES community_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_announcement BOOLEAN DEFAULT FALSE,
  parent_message_id UUID REFERENCES community_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create community_reactions table
CREATE TABLE IF NOT EXISTS community_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- 5. Create community_bookmarks table
CREATE TABLE IF NOT EXISTS community_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_channels_course ON community_channels(course_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_channel ON community_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_user ON community_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_parent ON community_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_reactions_message ON community_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_community_bookmarks_user ON community_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_community_bookmarks_message ON community_bookmarks(message_id);
CREATE INDEX IF NOT EXISTS idx_courses_community_enabled ON courses(community_enabled) WHERE community_enabled = TRUE;

-- RLS Policies

-- Enable RLS
ALTER TABLE community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_bookmarks ENABLE ROW LEVEL SECURITY;

-- Channels Policies
CREATE POLICY "view_channels" ON community_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_id
    AND c.community_enabled = TRUE
    AND (
      c.creator_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.course_id = c.id
        AND e.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "create_channels" ON community_channels
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_id
    AND c.creator_id = auth.uid()
  )
);

CREATE POLICY "update_channels" ON community_channels
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_id
    AND c.creator_id = auth.uid()
  )
);

-- Messages Policies
CREATE POLICY "view_messages" ON community_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM community_channels ch
    JOIN courses c ON c.id = ch.course_id
    WHERE ch.id = channel_id
    AND c.community_enabled = TRUE
    AND (
      c.creator_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.course_id = c.id
        AND e.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "create_messages" ON community_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_channels ch
    JOIN courses c ON c.id = ch.course_id
    WHERE ch.id = channel_id
    AND c.community_enabled = TRUE
    AND (
      -- Instructors can post anywhere
      c.creator_id = auth.uid() OR
      -- Students can post in discussions and Q&A
      (
        ch.type IN ('discussion', 'qa') AND
        EXISTS (
          SELECT 1 FROM enrollments e
          WHERE e.course_id = c.id
          AND e.user_id = auth.uid()
        )
      )
    )
  )
  AND user_id = auth.uid()
);

CREATE POLICY "update_own_messages" ON community_messages
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_messages" ON community_messages
FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM community_channels ch
    JOIN courses c ON c.id = ch.course_id
    WHERE ch.id = channel_id
    AND c.creator_id = auth.uid()
  )
);

-- Reactions Policies
CREATE POLICY "view_reactions" ON community_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM community_messages m
    JOIN community_channels ch ON ch.id = m.channel_id
    JOIN courses c ON c.id = ch.course_id
    WHERE m.id = message_id
    AND c.community_enabled = TRUE
  )
);

CREATE POLICY "manage_own_reactions" ON community_reactions
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Bookmarks Policies
CREATE POLICY "manage_own_bookmarks" ON community_bookmarks
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Function to auto-create default channels when community is enabled
CREATE OR REPLACE FUNCTION create_default_channels()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.community_enabled = TRUE AND (OLD.community_enabled IS NULL OR OLD.community_enabled = FALSE) THEN
    INSERT INTO community_channels (course_id, name, type, description)
    VALUES
      (NEW.id, 'announcements', 'announcement', 'Important updates and announcements from instructors'),
      (NEW.id, 'discussions', 'discussion', 'General discussions about the course'),
      (NEW.id, 'question-answer', 'qa', 'Ask questions and get help from peers and instructors')
    ON CONFLICT (course_id, name) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default channels
DROP TRIGGER IF EXISTS create_default_channels_trigger ON courses;
CREATE TRIGGER create_default_channels_trigger
AFTER INSERT OR UPDATE OF community_enabled ON courses
FOR EACH ROW
EXECUTE FUNCTION create_default_channels();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_community_channels_updated_at ON community_channels;
CREATE TRIGGER update_community_channels_updated_at
BEFORE UPDATE ON community_channels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_messages_updated_at ON community_messages;
CREATE TRIGGER update_community_messages_updated_at
BEFORE UPDATE ON community_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
