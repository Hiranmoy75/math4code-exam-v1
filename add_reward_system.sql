-- Create user_rewards table
CREATE TABLE IF NOT EXISTS user_rewards (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_coins INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    daily_coins_earned INTEGER DEFAULT 0,
    last_coin_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reward_transactions table
CREATE TABLE IF NOT EXISTS reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- 'login', 'video_watch', 'quiz_completion', 'module_completion', 'referral', 'bonus'
    entity_id TEXT, -- ID of the video, quiz, or referred user
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for user_rewards
CREATE POLICY "Users can view their own rewards" 
ON user_rewards FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for reward_transactions
CREATE POLICY "Users can view their own transactions" 
ON reward_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Function to reset daily coins if date changed
CREATE OR REPLACE FUNCTION reset_daily_coins()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.last_coin_date < CURRENT_DATE THEN
        NEW.daily_coins_earned := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reset daily coins
DROP TRIGGER IF EXISTS trigger_reset_daily_coins ON user_rewards;
CREATE TRIGGER trigger_reset_daily_coins
BEFORE UPDATE ON user_rewards
FOR EACH ROW
EXECUTE FUNCTION reset_daily_coins();
