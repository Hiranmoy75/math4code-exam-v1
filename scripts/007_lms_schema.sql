-- Update profiles role check to include 'creator'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'student', 'creator'));

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  thumbnail_url TEXT,
  category TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all')),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select_published" ON public.courses;
CREATE POLICY "courses_select_published" ON public.courses FOR SELECT USING (is_published = true OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "courses_insert_creator" ON public.courses;
CREATE POLICY "courses_insert_creator" ON public.courses FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "courses_update_creator" ON public.courses;
CREATE POLICY "courses_update_creator" ON public.courses FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "courses_delete_creator" ON public.courses;
CREATE POLICY "courses_delete_creator" ON public.courses FOR DELETE USING (auth.uid() = creator_id);

-- Create modules table
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  module_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules_select_all" ON public.modules;
CREATE POLICY "modules_select_all" ON public.modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "modules_insert_creator" ON public.modules;
CREATE POLICY "modules_insert_creator" ON public.modules FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND creator_id = auth.uid())
);

DROP POLICY IF EXISTS "modules_update_creator" ON public.modules;
CREATE POLICY "modules_update_creator" ON public.modules FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND creator_id = auth.uid())
);

DROP POLICY IF EXISTS "modules_delete_creator" ON public.modules;
CREATE POLICY "modules_delete_creator" ON public.modules FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND creator_id = auth.uid())
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'text', 'pdf', 'quiz')),
  content_url TEXT, -- For video/pdf
  content_text TEXT, -- For text lessons
  video_duration INTEGER, -- In seconds
  is_free_preview BOOLEAN DEFAULT false,
  lesson_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_select_all" ON public.lessons;
CREATE POLICY "lessons_select_all" ON public.lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "lessons_insert_creator" ON public.lessons;
CREATE POLICY "lessons_insert_creator" ON public.lessons FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON m.course_id = c.id
    WHERE m.id = module_id AND c.creator_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "lessons_update_creator" ON public.lessons;
CREATE POLICY "lessons_update_creator" ON public.lessons FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON m.course_id = c.id
    WHERE m.id = module_id AND c.creator_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "lessons_delete_creator" ON public.lessons;
CREATE POLICY "lessons_delete_creator" ON public.lessons FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON m.course_id = c.id
    WHERE m.id = module_id AND c.creator_id = auth.uid()
  )
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'refunded')),
  progress INTEGER DEFAULT 0, -- Percentage
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollments_select_own" ON public.enrollments;
CREATE POLICY "enrollments_select_own" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_select_creator" ON public.enrollments;
CREATE POLICY "enrollments_select_creator" ON public.enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND creator_id = auth.uid())
);
-- Insert is usually handled by backend after payment, but for now allow self-enrollment for free courses?
-- Let's allow insert if user is enrolling themselves
DROP POLICY IF EXISTS "enrollments_insert_own" ON public.enrollments;
CREATE POLICY "enrollments_insert_own" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert_enrolled" ON public.reviews;
CREATE POLICY "reviews_insert_enrolled" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = course_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
