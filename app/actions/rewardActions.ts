"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionType = 'login' | 'video_watch' | 'quiz_completion' | 'module_completion' | 'referral' | 'bonus' | 'mission_complete';

const REWARD_RULES = {
    login: { coins: 5, limit: 1 },
    video_watch: { coins: 10, limit: 10 },
    quiz_completion: { coins: 15, limit: 10 },
    quiz_bonus: { coins: 10, limit: 10 },
    module_completion: { coins: 50, limit: 5 },
    referral: { coins: 100, limit: 10 },
    streak_3: { coins: 10, limit: 1 },
    streak_7: { coins: 30, limit: 1 },
    streak_30: { coins: 100, limit: 1 },
    mission_complete: { coins: 20, limit: 3 }
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

    // Check if same day
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

        // Check Badge: Streak Master
        if (newStreak >= 7) await checkBadgeUnlock(userId, 'streak_7');
        if (newStreak >= 30) await checkBadgeUnlock(userId, 'streak_30');

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
        // Create if not exists (simplified for brevity, similar to getRewardStatus)
        const { data } = await supabase.from("user_rewards").insert({ user_id: userId }).select().single();
        status = data;
    }

    if (!status) return { success: false, message: "Could not initialize rewards" };

    // Update Daily Mission Progress (Run this before coin checks so missions update even if daily cap is reached)
    if (action === 'login') await updateMissionProgress(userId, 'login');
    if (action === 'video_watch') await updateMissionProgress(userId, 'video');
    if (action == 'quiz_completion') await updateMissionProgress(userId, 'quiz');

    // 2. Check daily cap
    if (status.last_coin_date !== today) {
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
        case 'mission_complete': coins = REWARD_RULES.mission_complete.coins; break;
        case 'bonus': coins = 10; break;
    }

    // 4. Adjust for cap
    if (status.daily_coins_earned + coins > DAILY_COIN_CAP) {
        coins = DAILY_COIN_CAP - status.daily_coins_earned;
    }

    if (coins <= 0) return { success: false, message: "Daily limit reached!" };

    // 5. Check for duplicate actions
    // STRICT LOGIN CHECK: If action is login, entityId MUST be today's date
    if (action === 'login') {
        entityId = today;
    }

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

    // Update Daily Mission Progress - MOVED TO TOP
    // if (action === 'login') await updateMissionProgress(userId, 'login');
    // if (action === 'video_watch') await updateMissionProgress(userId, 'video');
    // if (action === 'quiz_completion') await updateMissionProgress(userId, 'quiz');

    const newTotalCoins = status.total_coins + coins;
    const newXp = (status.xp || 0) + (coins * 10);
    const newWeeklyXp = (status.weekly_xp || 0) + (coins * 10);

    // Level calculation (simple formula: level = sqrt(xp / 100))
    const newLevel = Math.floor(Math.sqrt(newXp / 100)) || 1;

    await supabase.from("user_rewards").update({
        total_coins: newTotalCoins,
        daily_coins_earned: status.daily_coins_earned + coins,
        last_coin_date: today,
        xp: newXp,
        weekly_xp: newWeeklyXp,
        level: newLevel
    }).eq("user_id", userId);

    // Check for Level Up Badge
    if (newLevel > (status.level || 1)) {
        // Could trigger a notification here
    }

    revalidatePath("/student");

    return { success: true, coins, message: `⭐ Awesome +${coins} coins!` };
}

export async function getLeaderboard(type: 'weekly' | 'all_time' = 'all_time', limit: number = 10) {
    const supabase = await createClient();

    const sortColumn = type === 'weekly' ? 'weekly_xp' : 'total_coins'; // or xp

    const { data } = await supabase
        .from("user_rewards")
        .select(`
            total_coins,
            xp,
            weekly_xp,
            level,
            current_streak,
            user_id,
            profiles:user_id (
                full_name,
                avatar_url
            )
        `)
        .order(sortColumn, { ascending: false })
        .limit(limit);

    return data?.map((entry: any) => ({
        ...entry,
        profiles: Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
    })) || [];
}

export async function checkModuleCompletion(userId: string, moduleId: string) {
    const supabase = await createClient();
    const { data: lessons } = await supabase.from("lessons").select("id").eq("module_id", moduleId);
    if (!lessons || lessons.length === 0) return;

    const { data: completed } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("completed", true)
        .in("lesson_id", lessons.map(l => l.id));

    const completedCount = completed?.length || 0;
    if (completedCount === lessons.length) {
        return await awardCoins(userId, 'module_completion', moduleId, 'Completed a module!');
    }
    return null;
}

export async function checkFirstLessonReward(userId: string) {
    const supabase = await createClient();
    const { count } = await supabase
        .from("lesson_progress")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", userId)
        .eq("completed", true);

    if (count !== 1) return;

    const { data: profile } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("id", userId)
        .single();

    if (!profile?.referred_by) return;

    const referrerId = profile.referred_by;
    const { data: existing } = await supabase
        .from("reward_transactions")
        .select("*")
        .eq("user_id", referrerId)
        .eq("action_type", 'referral')
        .eq("entity_id", userId)
        .single();

    if (existing) return;

    // Award referrer
    await awardCoins(referrerId, 'referral', userId, `Referral bonus for user ${userId}`);

    // Check Badge for Referrer
    await checkBadgeUnlock(referrerId, 'social_butterfly');
}

// --- NEW GAMIFICATION FUNCTIONS ---

export async function getDailyMissions(userId: string) {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    let { data: missionData } = await supabase
        .from("daily_missions")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .single();

    if (!missionData) {
        // Generate new missions
        const missions = [
            { id: 'login', title: 'Daily Login', reward: 5, progress: 0, goal: 1, completed: false, icon: 'Zap' },
            { id: 'quiz', title: 'Complete a Quiz', reward: 20, progress: 0, goal: 1, completed: false, icon: 'Brain' },
            { id: 'video', title: 'Watch a Video', reward: 10, progress: 0, goal: 1, completed: false, icon: 'Play' }
        ];

        const { data } = await supabase
            .from("daily_missions")
            .insert({ user_id: userId, date: today, missions })
            .select()
            .single();
        missionData = data;
    }

    return missionData?.missions || [];
}

export async function updateMissionProgress(userId: string, type: 'login' | 'quiz' | 'video') {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    let { data: missionData } = await supabase
        .from("daily_missions")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .single();

    if (!missionData) {
        // Ensure missions exist for today
        await getDailyMissions(userId);

        // Retry fetch
        const { data: retryData } = await supabase
            .from("daily_missions")
            .select("*")
            .eq("user_id", userId)
            .eq("date", today)
            .single();

        missionData = retryData;
    }

    if (!missionData) return;

    let updated = false;
    const newMissions = missionData.missions.map((m: any) => {
        if (m.id === type && !m.completed) {
            m.progress += 1;
            updated = true; // Mark as updated whenever progress changes

            if (m.progress >= m.goal) {
                m.completed = true;
                // Award mission bonus
                awardCoins(userId, 'mission_complete', `${today}-${type}`, `Mission Complete: ${m.title}`);
            }
        }
        return m;
    });

    if (updated) {
        await supabase
            .from("daily_missions")
            .update({ missions: newMissions })
            .eq("id", missionData.id);

        revalidatePath("/student");
    }
}

export async function checkBadgeUnlock(userId: string, badgeId: string) {
    const supabase = await createClient();

    // Check if already has badge
    const { data: existing } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", userId)
        .eq("badge_id", badgeId)
        .single();

    if (existing) return;

    // Logic to verify if they actually earned it could go here, 
    // but usually we call this function when we KNOW they met the condition.

    await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badgeId
    });

    // Could return a notification object
}

export async function getUserBadges(userId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", userId);
    return data || [];
}

export async function getStreakHistory(userId: string) {
    const supabase = await createClient();

    // Fetch dates from reward_transactions
    const { data } = await supabase
        .from("reward_transactions")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (!data) return [];

    // Extract unique dates (YYYY-MM-DD)
    const uniqueDates = new Set(
        data.map(item => item.created_at.split('T')[0])
    );

    return Array.from(uniqueDates);
}
