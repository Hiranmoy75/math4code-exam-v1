-- ==========================================
-- MATH4CODE REWARD ENGINE (Database Layer)
-- ==========================================

-- 1. Helper Function: Calculate Level from XP
-- Formula: Level = Floor(Sqrt(XP / 100)) OR 1 (whichever is higher)
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp integer)
RETURNS integer AS $$
BEGIN
    RETURN GREATEST(1, floor(sqrt(p_xp::numeric / 100.0))::integer);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- 2. Main Trigger Function
CREATE OR REPLACE FUNCTION public.handle_reward_transaction()
RETURNS TRIGGER AS $$
DECLARE
    -- Current State Variables
    v_user_record public.user_rewards%ROWTYPE;
    v_today date := CURRENT_DATE;
    v_yesterday date := CURRENT_DATE - 1;
    
    -- Calculated Values
    v_new_streak integer;
    v_new_longest_streak integer;
    v_xp_gain integer;
    v_coins_gain integer;
    
    -- Constants
    c_xp_multiplier constant integer := 10; -- 1 Coin = 10 XP
    c_daily_cap constant integer := 100;    -- Max coins per day
BEGIN
    -- A. FETCH USER STATE (Locking the row for consistency)
    SELECT * INTO v_user_record 
    FROM public.user_rewards 
    WHERE user_id = NEW.user_id 
    FOR UPDATE;

    -- If user doesn't exist users_rewards, create them first (Safety Net)
    IF NOT FOUND THEN
        INSERT INTO public.user_rewards (user_id) VALUES (NEW.user_id)
        RETURNING * INTO v_user_record;
    END IF;

    -- B. INITIALIZE VARIABLES
    v_new_streak := v_user_record.current_streak;
    v_new_longest_streak := v_user_record.longest_streak;
    v_coins_gain := NEW.amount;
    v_xp_gain := NEW.amount * c_xp_multiplier;

    -- C. HANDLE DAILY RESET
    -- If the last coin earned date is NOT today, reset the daily counter
    IF v_user_record.last_coin_date IS NULL OR v_user_record.last_coin_date <> v_today THEN
        v_user_record.daily_coins_earned := 0;
    END IF;

    -- D. CHECK DAILY CAP (Optional: Adjust gain if over cap)
    -- Logic: If strictly enforcing cap in DB. 
    -- If (daily_earned + gain) > cap, gain = cap - daily_earned
    IF (v_user_record.daily_coins_earned + v_coins_gain) > c_daily_cap THEN
       v_coins_gain := GREATEST(0, c_daily_cap - v_user_record.daily_coins_earned);
       -- Adjust XP match the actual coin gain? Usually yes.
       v_xp_gain := v_coins_gain * c_xp_multiplier;
    END IF;

    -- E. UPDATE STREAK (Only for 'login' or 'visit' actions)
    IF NEW.action_type = 'login' THEN
        -- Logic:
        -- 1. Visited Today? -> No Change
        -- 2. Visited Yesterday? -> Streak + 1
        -- 3. Visited Long Ago? -> Streak = 1
        
        IF v_user_record.last_activity_date = v_today THEN
            -- No streak change, already counted
            NULL;
        ELSIF v_user_record.last_activity_date = v_yesterday THEN
            -- Consecutive day
            v_new_streak := v_new_streak + 1;
        ELSE
            -- Missed a day (Streak Broken!)
            v_new_streak := 1;
            
            -- STREAK BREAK PENALTY: Reset Coins
            -- User requested: "if someone streak is breaked then all the coin reset"
            -- We reset the accumulated coins to 0.
            -- Note: We still allow them to earn the coins for THIS current login transaction.
            v_user_record.total_coins := 0; 
        END IF;

        -- Update Longest Streak
        IF v_new_streak > v_new_longest_streak THEN
            v_new_longest_streak := v_new_streak;
        END IF;
        
        -- Update activity date
        v_user_record.last_activity_date := v_today;
    END IF;

    -- F. PERFORM UPDATE
    UPDATE public.user_rewards
    SET 
        -- Economy
        total_coins = total_coins + v_coins_gain,
        daily_coins_earned = v_user_record.daily_coins_earned + v_coins_gain,
        last_coin_date = v_today,
        
        -- XP & Level
        xp = xp + v_xp_gain,
        level = public.calculate_level(xp + v_xp_gain),
        
        -- Streak (Updated only if changed above)
        current_streak = v_new_streak,
        longest_streak = v_new_longest_streak,
        last_activity_date = COALESCE(v_user_record.last_activity_date, v_today),
        
        updated_at = now()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS on_reward_transaction_process ON public.reward_transactions;
CREATE TRIGGER on_reward_transaction_process
AFTER INSERT ON public.reward_transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_reward_transaction();
