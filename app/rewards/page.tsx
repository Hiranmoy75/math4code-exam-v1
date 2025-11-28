import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Coins, Flame, Trophy, Calendar, Share2, History, ArrowUpRight } from "lucide-react";
import { getRewardStatus } from "@/app/actions/rewardActions";

export default async function RewardsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    const rewards = await getRewardStatus(user.id);

    const { data: transactions } = await supabase
        .from("reward_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

    if (!rewards) {
        return <div className="p-10 text-center">Loading rewards...</div>;
    }

    const dailyProgress = (rewards.daily_coins_earned / 100) * 100;

    return (
        <div className="container max-w-5xl py-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Rewards</h1>
                    <p className="text-muted-foreground">Track your progress, streaks, and coin history.</p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-800">
                    <Coins className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{rewards.total_coins}</span>
                    <span className="text-sm text-indigo-600/70 dark:text-indigo-400/70 ml-1">Total Coins</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Streak Card */}
                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                            <Flame className="w-5 h-5 fill-orange-500 text-orange-600" />
                            Current Streak
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-orange-900 dark:text-orange-100 mb-1">
                            {rewards.current_streak} <span className="text-lg font-medium text-orange-700/70 dark:text-orange-300/70">days</span>
                        </div>
                        <p className="text-sm text-orange-600/80 dark:text-orange-400/80">
                            Longest streak: {rewards.longest_streak} days
                        </p>
                    </CardContent>
                </Card>

                {/* Daily Cap Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            Daily Earnings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-2">
                            <div className="text-2xl font-bold">
                                {rewards.daily_coins_earned} <span className="text-sm font-medium text-muted-foreground">/ 100</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Resets at midnight</span>
                        </div>
                        <Progress value={dailyProgress} className="h-2" />
                    </CardContent>
                </Card>

                {/* Referral Card */}
                <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                            <Share2 className="w-5 h-5" />
                            Refer & Earn
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-purple-600/80 dark:text-purple-400/80 mb-3">
                            Share your code to earn 100 coins!
                        </p>
                        <div className="flex items-center gap-2 bg-white dark:bg-black/20 p-2 rounded-lg border border-purple-200 dark:border-purple-800">
                            <code className="flex-1 font-mono font-bold text-center text-purple-900 dark:text-purple-100">
                                {profile?.referral_code || "Generating..."}
                            </code>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        History
                    </CardTitle>
                    <CardDescription>Your recent coin transactions</CardDescription>
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
                                                {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString()}
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
                                No transactions yet. Start learning to earn coins!
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
