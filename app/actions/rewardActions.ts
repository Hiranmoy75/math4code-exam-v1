"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionType = 'login' | 'video_watch' | 'quiz_completion' | 'module_completion' | 'referral' | 'bonus';

const REWARD_RULES = {
    login: { coins: 5, limit: 1 },
    video_watch: { coins: 10, limit: 10 }, // effectively unlimited within daily cap
    quiz_completion: { coins: 15, limit: 10 },
    quiz_bonus: { coins: 10, limit: 10 },
    module_completion: { coins: 50, limit: 5 },
    referral: { coins: 100, limit: 10 },
    streak_3: { coins: 10, limit: 1 },
    streak_7: { coins: 30, limit: 1 },
    streak_30: { coins: 100, limit: 1 },
};

const DAILY_COIN_CAP = 100;

export async function getRewardStatus(userId: string) {
    const supabase = await createClient();
    let { data } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (!data) {
        // Initialize if not exists
        const { data: newData, error } = await supabase
            .from("user_rewards")
            .insert({ user_id: userId })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                // Duplicate key (race condition), fetch again
                const { data: retryData } = await supabase
                    .from("user_rewards")
                    .select("*")
                    .eq("user_id", userId)
                    .single();
                data = retryData;
            } else {
                console.error("Error creating user_rewards in getRewardStatus:", error);
                return null;
            }
        } else {
            data = newData;
        }
    }

    return data;
}

export async function checkStreak(userId: string) {
    const supabase = await createClient();

    // Get current reward status
    let { data: rewardStatus } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (!rewardStatus) {
        // Initialize if not exists
        const { data: newStatus, error } = await supabase
            .from("user_rewards")
            .insert({ user_id: userId, current_streak: 1, last_activity_date: new Date().toISOString() })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                // Duplicate key, fetch again
                const { data: retryData } = await supabase
                    .from("user_rewards")
                    .select("*")
                    .eq("user_id", userId)
                    .single();
                rewardStatus = retryData;
            } else {
                console.error("Error creating user_rewards in checkStreak:", error);
                return { streak: 0, message: "System error" };
            }
        } else {
            rewardStatus = newStatus;
            return { streak: 1, message: "🔥 First day! Let's start a streak!" };
        }
    }

    if (!rewardStatus) return { streak: 0, message: "Error" };

    const lastActivity = new Date(rewardStatus.last_activity_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastActivity.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if same day (already handled, but good to be safe)
    const isSameDay = lastActivity.toDateString() === today.toDateString();

    if (isSameDay) {
        return { streak: rewardStatus.current_streak, message: null };
    }

    // Check if yesterday (streak continues)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = lastActivity.toDateString() === yesterday.toDateString();

    let newStreak = rewardStatus.current_streak;
    let message = null;

    if (isYesterday) {
        newStreak += 1;
        message = "🔥 Great job! Your streak is alive!";

        // Check milestones
        if (newStreak === 3) await awardCoins(userId, 'bonus', undefined, 'Streak Milestone: 3 Days');
        if (newStreak === 7) await awardCoins(userId, 'bonus', undefined, 'Streak Milestone: 7 Days');
        if (newStreak === 30) await awardCoins(userId, 'bonus', undefined, 'Streak Milestone: 30 Days');

    } else {
        // Gap >= 2 days, reset streak
        newStreak = 1;
        message = "Don’t give up! Ekdin break normal. Baro shathe abar shuru kori.";
    }

    // Update streak
    await supabase.from("user_rewards").update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, rewardStatus.longest_streak),
        last_activity_date: new Date().toISOString()
    }).eq("user_id", userId);

    return { streak: newStreak, message };
}

export async function awardCoins(
    userId: string,
    action: ActionType,
    entityId?: string,
    description?: string
) {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // 1. Get current status
    let { data: status } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (!status) {
        // Create if not exists
        const { data, error } = await supabase
            .from("user_rewards")
            .insert({ user_id: userId })
            .select()
            .single();

        if (error) {
            // If error is duplicate key (race condition), fetch again
            if (error.code === '23505') {
                const { data: retryData } = await supabase
                    .from("user_rewards")
                    .select("*")
                    .eq("user_id", userId)
                    .single();
                status = retryData;
            } else {
                console.error("Error creating user_rewards:", error);
                return { success: false, message: "System error" };
            }
        } else {
            status = data;
        }
    }

    if (!status) {
        return { success: false, message: "Could not initialize rewards" };
    }

    // 2. Check daily cap
    if (status.last_coin_date !== today) {
        // Reset daily limit if new day (handled by trigger usually, but good to have logic here too)
        status.daily_coins_earned = 0;
    }

    if (status.daily_coins_earned >= DAILY_COIN_CAP) {
        return { success: false, message: "Daily limit reached! Come back tomorrow." };
    }

    // 3. Calculate coins
    let coins = 0;
    switch (action) {
        case 'login': coins = REWARD_RULES.login.coins; break;
        case 'video_watch': coins = REWARD_RULES.video_watch.coins; break;
        case 'quiz_completion': coins = REWARD_RULES.quiz_completion.coins; break;
        case 'module_completion': coins = REWARD_RULES.module_completion.coins; break;
        case 'referral': coins = REWARD_RULES.referral.coins; break;
        case 'bonus': coins = 10; break; // Default bonus
    }

    // 4. Adjust for cap
    if (status.daily_coins_earned + coins > DAILY_COIN_CAP) {
        coins = DAILY_COIN_CAP - status.daily_coins_earned;
    }

    if (coins <= 0) return { success: false, message: "Daily limit reached!" };

    // 5. Check for duplicate actions (e.g. watching same video twice today)
    if (entityId) {
        const { data: existing } = await supabase
            .from("reward_transactions")
            .select("*")
            .eq("user_id", userId)
            .eq("action_type", action)
            .eq("entity_id", entityId)
            .gte("created_at", `${today}T00:00:00`)
            .single();

        if (existing) {
            return { success: false, message: "Already rewarded for this today!" };
        }
    }

    // 6. Update DB
    await supabase.from("reward_transactions").insert({
        user_id: userId,
        amount: coins,
        action_type: action,
        entity_id: entityId,
        description: description || `Reward for ${action}`
    });

    await supabase.from("user_rewards").update({
        total_coins: status.total_coins + coins,
        daily_coins_earned: status.daily_coins_earned + coins,
        last_coin_date: today,
        xp: (status.xp || 0) + (coins * 10) // 1 Coin = 10 XP
    }).eq("user_id", userId);

    revalidatePath("/"); // Revalidate to update UI

    return { success: true, coins, message: `⭐ Awesome +${coins} coins!` };
}

export async function getLeaderboard(limit: number = 10) {
    const supabase = await createClient();

    const { data } = await supabase
        .from("user_rewards")
        .select(`
            total_coins,
            xp,
            current_streak,
            user_id,
            profiles:user_id (
                full_name,
                avatar_url
            )
        `)
        .order("total_coins", { ascending: false })
        .limit(limit);

    return data;
}

export async function checkModuleCompletion(userId: string, moduleId: string) {
    const supabase = await createClient();

    // 1. Get all lessons in module
    const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .eq("module_id", moduleId);

    if (!lessons || lessons.length === 0) return;

    // 2. Get completed lessons
    const { data: completed } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("completed", true)
        .in("lesson_id", lessons.map(l => l.id));

    const completedCount = completed?.length || 0;
    const totalCount = lessons.length;

    // 3. If all completed, award coins
    if (completedCount === totalCount) {
        return await awardCoins(userId, 'module_completion', moduleId, 'Completed a module!');
    }

    return null;
}

export async function checkFirstLessonReward(userId: string) {
    const supabase = await createClient();

    // 1. Check if user has completed exactly 1 lesson (this one)
    const { count } = await supabase
        .from("lesson_progress")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", userId)
        .eq("completed", true);

    if (count !== 1) return; // Not the first lesson or already rewarded (if logic is correct)

    // 2. Check if user was referred
    const { data: profile } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("id", userId)
        .single();

    if (!profile?.referred_by) return;

    const referrerId = profile.referred_by;

    // 3. Award coins to referrer
    // Check if already awarded for this user
    const { data: existing } = await supabase
        .from("reward_transactions")
        .select("*")
        .eq("user_id", referrerId)
        .eq("action_type", 'referral')
        .eq("entity_id", userId)
        .single();

    if (existing) return;

    return await awardCoins(referrerId, 'referral', userId, `Referral bonus for user ${userId}`);
}
