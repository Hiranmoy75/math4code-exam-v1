-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  session_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'ai'::text])),
  content text NOT NULL,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);
CREATE TABLE public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  title text NOT NULL,
  user_id uuid,
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.course_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid,
  amount numeric NOT NULL,
  transaction_id text NOT NULL UNIQUE,
  provider_transaction_id text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text, 'refunded'::text])),
  payment_method text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT course_payments_pkey PRIMARY KEY (id),
  CONSTRAINT course_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT course_payments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price numeric DEFAULT 0,
  thumbnail_url text,
  category text,
  level text CHECK (level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'all'::text])),
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  enrolled_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'refunded'::text, 'pending'::text])),
  progress integer DEFAULT 0,
  progress_percentage numeric DEFAULT 0.00,
  last_accessed_lesson_id uuid,
  last_accessed_at timestamp with time zone,
  payment_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT enrollments_last_accessed_lesson_id_fkey FOREIGN KEY (last_accessed_lesson_id) REFERENCES public.lessons(id),
  CONSTRAINT enrollments_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.course_payments(id)
);
CREATE TABLE public.exam_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL,
  student_id uuid NOT NULL,
  started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  submitted_at timestamp with time zone,
  status text NOT NULL DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'submitted'::text, 'graded'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  total_time_spent integer DEFAULT 0,
  CONSTRAINT exam_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT exam_attempts_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id),
  CONSTRAINT exam_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.exams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  total_marks integer NOT NULL,
  negative_marking numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  created_by uuid,
  creator_role text DEFAULT 'student'::text CHECK (creator_role = ANY (ARRAY['student'::text, 'admin'::text])),
  is_practice boolean DEFAULT false,
  show_results_immediately boolean DEFAULT true,
  max_attempts integer,
  CONSTRAINT exams_pkey PRIMARY KEY (id),
  CONSTRAINT exams_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id),
  CONSTRAINT exams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.lesson_progress (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  course_id uuid NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  time_spent integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lesson_progress_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id),
  CONSTRAINT lesson_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL,
  title text NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['video'::text, 'text'::text, 'pdf'::text, 'quiz'::text])),
  content_url text,
  content_text text,
  video_duration integer,
  is_free_preview boolean DEFAULT false,
  lesson_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  exam_id uuid,
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id),
  CONSTRAINT lessons_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id)
);
CREATE TABLE public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  module_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT modules_pkey PRIMARY KEY (id),
  CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  option_text text NOT NULL,
  option_order integer NOT NULL,
  is_correct boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT options_pkey PRIMARY KEY (id),
  CONSTRAINT options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  series_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  phonepe_transaction_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT payments_series_id_fkey FOREIGN KEY (series_id) REFERENCES public.test_series(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'student'::text, 'creator'::text])),
  full_name text,
  avatar_url text,
  referral_code text UNIQUE,
  referred_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.question_bank (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  title text NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type = ANY (ARRAY['MCQ'::text, 'MSQ'::text, 'NAT'::text])),
  marks integer NOT NULL,
  negative_marks numeric DEFAULT 0,
  correct_answer text,
  explanation text,
  subject text,
  topic text,
  difficulty text CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT question_bank_pkey PRIMARY KEY (id),
  CONSTRAINT question_bank_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.question_bank_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  option_text text NOT NULL,
  option_order integer NOT NULL,
  is_correct boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT question_bank_options_pkey PRIMARY KEY (id),
  CONSTRAINT question_bank_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.question_bank(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type = ANY (ARRAY['MCQ'::text, 'MSQ'::text, 'NAT'::text])),
  marks integer NOT NULL,
  negative_marks numeric DEFAULT 0,
  correct_answer text,
  explanation text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id)
);
CREATE TABLE public.responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL,
  question_id uuid NOT NULL,
  student_answer text,
  is_marked_for_review boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT responses_pkey PRIMARY KEY (id),
  CONSTRAINT responses_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id),
  CONSTRAINT responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL,
  total_marks integer NOT NULL,
  obtained_marks numeric NOT NULL,
  percentage numeric NOT NULL,
  rank integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT results_pkey PRIMARY KEY (id),
  CONSTRAINT results_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.section_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  result_id uuid NOT NULL,
  section_id uuid NOT NULL,
  total_marks integer NOT NULL,
  obtained_marks numeric NOT NULL,
  correct_answers integer NOT NULL,
  wrong_answers integer NOT NULL,
  unanswered integer NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT section_results_pkey PRIMARY KEY (id),
  CONSTRAINT section_results_result_id_fkey FOREIGN KEY (result_id) REFERENCES public.results(id),
  CONSTRAINT section_results_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id)
);
CREATE TABLE public.sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL,
  title text NOT NULL,
  duration_minutes integer NOT NULL,
  total_marks integer NOT NULL,
  section_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sections_pkey PRIMARY KEY (id),
  CONSTRAINT sections_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id)
);
CREATE TABLE public.student_uploaded_pdfs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uploader_id uuid,
  file_path text NOT NULL,
  file_url text,
  status text DEFAULT 'processing'::text,
  exam_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_uploaded_pdfs_pkey PRIMARY KEY (id),
  CONSTRAINT student_uploaded_pdfs_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.profiles(id),
  CONSTRAINT student_uploaded_pdfs_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id)
);
CREATE TABLE public.test_series (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  is_free boolean DEFAULT false,
  total_exams integer DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT test_series_pkey PRIMARY KEY (id),
  CONSTRAINT test_series_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.test_series_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_series_id uuid NOT NULL,
  student_id uuid NOT NULL,
  enrolled_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  progress real DEFAULT '0'::real,
  completed_exams integer NOT NULL DEFAULT 0,
  total_exams integer NOT NULL DEFAULT 0,
  next_exam_date date,
  CONSTRAINT test_series_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT test_series_enrollments_test_series_id_fkey FOREIGN KEY (test_series_id) REFERENCES public.test_series(id),
  CONSTRAINT test_series_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.test_series_exams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_series_id uuid NOT NULL,
  exam_id uuid NOT NULL,
  exam_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  max_attempts integer,
  CONSTRAINT test_series_exams_pkey PRIMARY KEY (id),
  CONSTRAINT test_series_exams_test_series_id_fkey FOREIGN KEY (test_series_id) REFERENCES public.test_series(id),
  CONSTRAINT test_series_exams_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id)
);

CREATE TABLE public.user_rewards (
  user_id uuid NOT NULL,
  total_coins integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  daily_coins_earned integer DEFAULT 0,
  last_coin_date date,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  weekly_xp integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_rewards_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.reward_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  action_type text NOT NULL,
  entity_id text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reward_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT reward_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id text NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_badges_user_badge_unique UNIQUE (user_id, badge_id)
);

CREATE TABLE public.daily_missions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_type text NOT NULL,
  target integer NOT NULL,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_missions_pkey PRIMARY KEY (id),
  CONSTRAINT daily_missions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ============================================================================
-- NOTIFICATIONS SCHEMA (from fix_notifications_schema.sql)
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean DEFAULT false,
  link text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true); 

-- Create a function to easily add notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_link text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTIFICATION TRIGGERS (from triggers_notifications_v2.sql)
-- ============================================================================

-- Function to notify ALL users when a new course is launched (published)
CREATE OR REPLACE FUNCTION notify_all_users_new_course()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if the course is being published
  IF (TG_OP = 'INSERT' AND NEW.is_published = true) OR
     (TG_OP = 'UPDATE' AND NEW.is_published = true AND OLD.is_published = false) THEN
     
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT 
      id, 
      'New Course Launched! 🚀', 
      'Check out our new course: ' || NEW.title, 
      'info', 
      '/courses/' || NEW.id
    FROM public.profiles;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for courses table
DROP TRIGGER IF EXISTS on_course_published ON public.courses;
CREATE TRIGGER on_course_published
AFTER INSERT OR UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION notify_all_users_new_course();

-- Function to notify enrolled users when a new lesson is added
CREATE OR REPLACE FUNCTION notify_enrolled_users_new_lesson()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id uuid;
  v_course_title text;
BEGIN
  -- Get course details via module
  SELECT c.id, c.title
  INTO v_course_id, v_course_title
  FROM public.modules m
  JOIN public.courses c ON m.course_id = c.id
  WHERE m.id = NEW.module_id;

  -- Notify ALL enrolled users (active status), regardless of price
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT 
    e.user_id, 
    'New Lesson Added 📚', 
    'A new lesson "' || NEW.title || '" has been added to ' || v_course_title, 
    'info', 
    '/learn/' || v_course_id || '?lessonId=' || NEW.id
  FROM public.enrollments e
  WHERE e.course_id = v_course_id AND e.status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for lessons table
DROP TRIGGER IF EXISTS on_lesson_added ON public.lessons;
CREATE TRIGGER on_lesson_added
AFTER INSERT ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION notify_enrolled_users_new_lesson();

-- ============================================================================
-- REALTIME CONFIGURATION (from enable_realtime_notifications.sql)
-- ============================================================================

-- Enable Realtime for notifications table
BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
COMMIT;

-- ============================================================================
-- COMMUNITY SYSTEM SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.community_channels (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('announcement', 'discussion', 'qa')),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_channels_pkey PRIMARY KEY (id),
    CONSTRAINT community_channels_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.community_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    channel_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb,
    is_pinned boolean DEFAULT false,
    is_announcement boolean DEFAULT false,
    reply_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_messages_pkey PRIMARY KEY (id),
    CONSTRAINT community_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.community_channels(id) ON DELETE CASCADE,
    CONSTRAINT community_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.community_reactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL,
    user_id uuid NOT NULL,
    emoji text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_reactions_pkey PRIMARY KEY (id),
    CONSTRAINT community_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.community_messages(id) ON DELETE CASCADE,
    CONSTRAINT community_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT community_reactions_unique UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.community_bookmarks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_bookmarks_pkey PRIMARY KEY (id),
    CONSTRAINT community_bookmarks_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.community_messages(id) ON DELETE CASCADE,
    CONSTRAINT community_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT community_bookmarks_unique UNIQUE (message_id, user_id)
);

