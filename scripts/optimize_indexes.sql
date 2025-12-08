-- ============================================================================
-- OPTIMIZATION LAYER 1: DATABASE INDEXING
-- Based on Audit of Schema (latest.sql): keys, jsonb, and sorting patterns
-- ============================================================================

-- 1. FOREIGN KEY INDEXES (Postgres does not auto-index FKs)
-- These prevent full table scans during joins and cascade deletes.

-- Chat System
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);

-- Payments & Commerce
CREATE INDEX IF NOT EXISTS idx_course_payments_user_id ON public.course_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_payments_course_id ON public.course_payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_series_id ON public.payments(series_id);

-- Courses & Enrollments
CREATE INDEX IF NOT EXISTS idx_courses_creator_id ON public.courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_last_accessed_lesson_id ON public.enrollments(last_accessed_lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_id ON public.enrollments(payment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON public.reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Lessons & Modules
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_exam_id ON public.lessons(exam_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id ON public.lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_sessions_lesson_id ON public.live_stream_sessions(lesson_id);

-- Exams & Questions
CREATE INDEX IF NOT EXISTS idx_exams_admin_id ON public.exams(admin_id);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON public.exams(created_by);
CREATE INDEX IF NOT EXISTS idx_sections_exam_id ON public.sections(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_section_id ON public.questions(section_id);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON public.options(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_id ON public.exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id ON public.exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt_id ON public.responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON public.responses(question_id);
CREATE INDEX IF NOT EXISTS idx_results_attempt_id ON public.results(attempt_id);
CREATE INDEX IF NOT EXISTS idx_section_results_result_id ON public.section_results(result_id);
CREATE INDEX IF NOT EXISTS idx_section_results_section_id ON public.section_results(section_id);
CREATE INDEX IF NOT EXISTS idx_student_uploaded_pdfs_uploader_id ON public.student_uploaded_pdfs(uploader_id);
CREATE INDEX IF NOT EXISTS idx_student_uploaded_pdfs_exam_id ON public.student_uploaded_pdfs(exam_id);

-- Test Series
CREATE INDEX IF NOT EXISTS idx_test_series_admin_id ON public.test_series(admin_id);
CREATE INDEX IF NOT EXISTS idx_test_series_enrollments_series_id ON public.test_series_enrollments(test_series_id);
CREATE INDEX IF NOT EXISTS idx_test_series_enrollments_student_id ON public.test_series_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_test_series_exams_series_id ON public.test_series_exams(test_series_id);
CREATE INDEX IF NOT EXISTS idx_test_series_exams_exam_id ON public.test_series_exams(exam_id);

-- Profiles & Community & Gamification & System
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_daily_missions_user_id ON public.daily_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_community_channels_course_id ON public.community_channels(course_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_channel_id ON public.community_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_user_id ON public.community_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_parent_id ON public.community_messages(parent_message_id); 
CREATE INDEX IF NOT EXISTS idx_community_reactions_message_id ON public.community_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_user_id ON public.community_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_community_bookmarks_message_id ON public.community_bookmarks(message_id);
CREATE INDEX IF NOT EXISTS idx_community_bookmarks_user_id ON public.community_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bunny_settings_user_id ON public.bunny_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_id ON public.reward_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON public.user_rewards(user_id);

-- 2. JSONB INDEXES (GIN) AND SORTING OPTIMIZATIONS
-- Speeds up searching within JSONB and sorting large datasets.

CREATE INDEX IF NOT EXISTS idx_course_payments_metadata ON public.course_payments USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_community_messages_attachments ON public.community_messages USING gin (attachments);
-- daily_missions now has a missions jsonb column in latest schema
CREATE INDEX IF NOT EXISTS idx_daily_missions_missions ON public.daily_missions USING gin (missions);

-- Composite Indexes for frequent sorting/filtering
-- Community Chat: Get messages for a channel, sorted by newest first
CREATE INDEX IF NOT EXISTS idx_community_messages_channel_created ON public.community_messages(channel_id, created_at DESC);

-- Notifications: Get users notifications sorted by newest
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Courses: List published courses by newest
CREATE INDEX IF NOT EXISTS idx_courses_published_created ON public.courses(is_published, created_at DESC);

-- Lessons: Order by module and sequence
CREATE INDEX IF NOT EXISTS idx_lessons_module_order ON public.lessons(module_id, lesson_order);

-- ENABLING PAGINATION OPTIMIZATIONS
-- Ensure 'created_at' is indexed where we do cursor-based or offset-based pagination
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_created_at ON public.exam_attempts(created_at DESC);

-- End of Optimization Script
