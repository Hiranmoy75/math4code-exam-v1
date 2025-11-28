-- Add referral columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
    code_exists BOOLEAN;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = result) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to assign referral code on insert
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_referral_code ON profiles;
CREATE TRIGGER trigger_set_referral_code
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();

-- Backfill existing profiles
UPDATE profiles SET referral_code = generate_referral_code() WHERE referral_code IS NULL;

-- Update handle_new_user to process referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    referrer_id UUID;
BEGIN
    -- Check for referral code in metadata
    IF NEW.raw_user_meta_data->>'referred_by_code' IS NOT NULL THEN
        SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = NEW.raw_user_meta_data->>'referred_by_code';
    END IF;

    INSERT INTO public.profiles (id, full_name, role, avatar_url, referred_by)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        NEW.raw_user_meta_data->>'avatar_url',
        referrer_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
