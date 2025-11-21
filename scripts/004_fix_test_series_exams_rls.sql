-- Fix RLS policy for test_series_exams update (needed for reordering/upsert)
CREATE POLICY "test_series_exams_update_via_series" ON public.test_series_exams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.test_series WHERE id = test_series_id AND admin_id = auth.uid())
);
