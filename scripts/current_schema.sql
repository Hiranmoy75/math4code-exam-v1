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
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
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
