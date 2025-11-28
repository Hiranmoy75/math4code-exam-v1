-- Add XP column to user_rewards
ALTER TABLE user_rewards 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Backfill XP based on total_coins (1 Coin = 10 XP)
UPDATE user_rewards 
SET xp = total_coins * 10 
WHERE xp = 0;
