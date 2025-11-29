"use client";
import { useCurrentUser } from "@/hooks/student/useCurrentUser";
import { useRewards, useStreakHistory } from "@/hooks/useRewards";
import { useProfileQuery } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Coins, Flame, Share2, History, ArrowUpRight, Zap, Loader2 } from "lucide-react";
import MissionCard from "@/components/student/rewards/MissionCard";
import BadgeGrid from "@/components/student/rewards/BadgeGrid";
import Leaderboard from "@/components/student/rewards/Leaderboard";
import StreakCalendar from "@/components/student/rewards/StreakCalendar";
import { Badge } from "@/components/ui/badge";

export default function StudentRewardsPage() {
    const { data: user, isLoading: userLoading } = useCurrentUser();
    const { data: profile } = useProfileQuery();

    const {
        rewardStatus: rewards,
        missions,
        badges,
        transactions,
        statusLoading
    } = useRewards(user?.id);

    const { data: streakHistory } = useStreakHistory(user?.id || "");

    if (userLoading || statusLoading || !rewards) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    }

    const dailyProgress = (rewards.daily_coins_earned / 100) * 100;
    const earnedBadgeIds = badges?.map((b: any) => b.badge_id) || [];

    return (
        <div className="container max-w-6xl py-8 space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-none shadow-lg">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-indigo-100 font-medium mb-1">Total Coins</p>
                            <div className="text-4xl font-bold flex items-center gap-2">
                                <Coins className="w-8 h-8 opacity-80" />
                                {rewards.total_coins}
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Daily Cap</span>
                                <span>{rewards.daily_coins_earned}/100</span>
                            </div>
                            <Progress value={dailyProgress} className="h-1.5 bg-black/20" indicatorClassName="bg-white" />
                        </div>
                    </CardContent>
                </Card>

                {/* Replaced Streak Card with Calendar in main view, but keeping a summary here if desired, or removing it. 
                    For now, I'll keep the simple card for consistency with the grid layout, but maybe make it clickable to scroll to calendar? 
                    Actually, let's keep it as is for quick stats.
                */}
                <Card className="bg-gradient-to-br from-orange-400 to-amber-500 text-white border-none shadow-lg">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-orange-100 font-medium mb-1">Current Streak</p>
                            <div className="text-4xl font-bold flex items-center gap-2">
                                <Flame className="w-8 h-8 opacity-80" />
                                {rewards.current_streak} <span className="text-lg opacity-80">days</span>
                            </div>
                        </div>
                        <p className="text-sm mt-4 text-orange-100">
                            Longest: {rewards.longest_streak} days
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between h-full">
                        <div>
                            <h3 className="text-lg font-bold mb-1">Refer & Earn</h3>
                            <p className="text-muted-foreground text-sm mb-3">Invite friends and earn 100 coins each!</p>
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                                <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400 px-2">
                                    {profile?.referral_code || "LOADING..."}
                                </code>
                                <Share2 className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-500" />
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                                <Share2 className="w-8 h-8 text-indigo-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Missions & Badges */}
                <div className="lg:col-span-2 space-y-8">



                    {/* Daily Missions */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            Daily Missions
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {missions?.map((mission: any) => (
                                <MissionCard key={mission.id} mission={mission} />
                            ))}
                        </div>
                    </div>

                    {/* Badges */}
                    <BadgeGrid earnedBadgeIds={earnedBadgeIds} />

                    {/* Streak Calendar */}
                    <StreakCalendar
                        streakHistory={streakHistory || []}
                        currentStreak={rewards.current_streak}
                        longestStreak={rewards.longest_streak}
                    />

                    {/* Recent History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <History className="w-5 h-5" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {transactions && transactions.length > 0 ? (
                                    transactions.map((tx: any) => (
                                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600'}`}>
                                                    {tx.amount > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4 rotate-180" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{tx.description || tx.action_type}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(tx.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={tx.amount > 0 ? "default" : "destructive"} className={tx.amount > 0 ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
                                                {tx.amount > 0 ? "+" : ""}{tx.amount}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No transactions yet.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Leaderboard */}
                <div className="lg:col-span-1">
                    <Leaderboard currentUserId={user?.id || ""} />
                </div>
            </div>
        </div>
    );
}
