-- Create course_payments table to track course transaction attempts
CREATE TABLE IF NOT EXISTS public.course_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE, -- Our Order ID (e.g., ENR_...)
    provider_transaction_id TEXT, -- PhonePe Transaction ID
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    payment_method TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_course_payments_user_id ON public.course_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_payments_transaction_id ON public.course_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_course_payments_status ON public.course_payments(status);

-- Enable RLS on course_payments
ALTER TABLE public.course_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_payments
DROP POLICY IF EXISTS "Users can view their own course payments" ON public.course_payments;
CREATE POLICY "Users can view their own course payments"
    ON public.course_payments FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own course payments" ON public.course_payments;
CREATE POLICY "Users can insert their own course payments"
    ON public.course_payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own course payments" ON public.course_payments;
CREATE POLICY "Users can update their own course payments"
    ON public.course_payments FOR UPDATE
    USING (auth.uid() = user_id);

-- Add payment_id to enrollments table for traceability
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.course_payments(id);

-- Add comment
COMMENT ON TABLE public.course_payments IS 'Tracks course payment transactions';
