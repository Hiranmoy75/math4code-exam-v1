-- Allow everyone to view user_rewards (needed for leaderboard)
-- First drop the restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view their own rewards" ON user_rewards;

-- Create a new policy allowing public read access
CREATE POLICY "Anyone can view user_rewards"
ON user_rewards FOR SELECT
USING (true);
