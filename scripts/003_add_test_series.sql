-- Create test_series table
CREATE TABLE IF NOT EXISTS public.test_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  total_exams INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "test_series_select_all" ON public.test_series FOR SELECT USING (true);
CREATE POLICY "test_series_insert_own" ON public.test_series FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "test_series_update_own" ON public.test_series FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "test_series_delete_own" ON public.test_series FOR DELETE USING (auth.uid() = admin_id);

-- Create test_series_exams junction table
CREATE TABLE IF NOT EXISTS public.test_series_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_series_id UUID NOT NULL REFERENCES public.test_series(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  exam_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(test_series_id, exam_id)
);

ALTER TABLE public.test_series_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "test_series_exams_select_all" ON public.test_series_exams FOR SELECT USING (true);
CREATE POLICY "test_series_exams_insert_via_series" ON public.test_series_exams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.test_series WHERE id = test_series_id AND admin_id = auth.uid())
);
CREATE POLICY "test_series_exams_delete_via_series" ON public.test_series_exams FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.test_series WHERE id = test_series_id AND admin_id = auth.uid())
);

-- Create test_series_enrollments table
CREATE TABLE IF NOT EXISTS public.test_series_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_series_id UUID NOT NULL REFERENCES public.test_series(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(test_series_id, student_id)
);

ALTER TABLE public.test_series_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "test_series_enrollments_select_own" ON public.test_series_enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "test_series_enrollments_insert_own" ON public.test_series_enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
