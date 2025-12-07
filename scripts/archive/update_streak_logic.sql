-- Function to handle streak updates automatically
CREATE OR REPLACE FUNCTION public.handle_streak_update()
RETURNS TRIGGER AS $$
DECLARE
    v_last_activity_date date;
    v_current_streak integer;
    v_longest_streak integer;
    v_today date := CURRENT_DATE;
    v_yesterday date := CURRENT_DATE - 1;
BEGIN
    -- Only proceed if action is 'login'
    IF NEW.action_type <> 'login' THEN
        RETURN NEW;
    END IF;

    -- Fetch current user reward status
    SELECT last_activity_date, current_streak, longest_streak
    INTO v_last_activity_date, v_current_streak, v_longest_streak
    FROM public.user_rewards
    WHERE user_id = NEW.user_id;

    -- If no record exists, the app should have created it, but we can handle safe defaults
    IF v_current_streak IS NULL THEN
        v_current_streak := 0;
        v_longest_streak := 0;
    END IF;

    -- Logic:
    -- 1. If last activity was Today: Do nothing (already counted)
    -- 2. If last activity was Yesterday: Increment Streak
    -- 3. If last activity was Older: Reset Streak to 1

    IF v_last_activity_date = v_today THEN
        -- Already logged in today, do nothing to streak
        RETURN NEW;
        
    ELSIF v_last_activity_date = v_yesterday THEN
        -- Consecutive day
        v_current_streak := v_current_streak + 1;
        
    ELSE
        -- Missed a day (or first time)
        v_current_streak := 1;
    END IF;

    -- Update longest streak if needed
    IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
    END IF;

    -- Update the table
    UPDATE public.user_rewards
    SET 
        current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_activity_date = v_today,
        updated_at = now()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire on insert into reward_transactions
DROP TRIGGER IF EXISTS on_login_streak_update ON public.reward_transactions;
CREATE TRIGGER on_login_streak_update
AFTER INSERT ON public.reward_transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_streak_update();
