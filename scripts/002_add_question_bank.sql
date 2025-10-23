-- Create question_bank table for reusable questions
CREATE TABLE IF NOT EXISTS public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'MSQ', 'NAT')),
  marks INTEGER NOT NULL,
  negative_marks DECIMAL(5, 2) DEFAULT 0,
  correct_answer TEXT,
  explanation TEXT,
  subject TEXT,
  topic TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on question_bank
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_bank
CREATE POLICY "question_bank_select_own" ON public.question_bank FOR SELECT USING (auth.uid() = admin_id);
CREATE POLICY "question_bank_insert_own" ON public.question_bank FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "question_bank_update_own" ON public.question_bank FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "question_bank_delete_own" ON public.question_bank FOR DELETE USING (auth.uid() = admin_id);

-- Create question_bank_options table
CREATE TABLE IF NOT EXISTS public.question_bank_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on question_bank_options
ALTER TABLE public.question_bank_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_bank_options
CREATE POLICY "question_bank_options_select_own" ON public.question_bank_options FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.question_bank WHERE id = question_id AND admin_id = auth.uid())
);
