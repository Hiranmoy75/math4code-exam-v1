-- Fix RLS policies for user_rewards
-- Allow users to insert their own reward record (needed for initialization)
CREATE POLICY "Users can insert their own rewards"
ON user_rewards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reward record (needed for earning coins)
CREATE POLICY "Users can update their own rewards"
ON user_rewards FOR UPDATE
USING (auth.uid() = user_id);

-- Fix RLS policies for reward_transactions
-- Allow users to insert their own transactions
CREATE POLICY "Users can insert their own transactions"
ON reward_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);
