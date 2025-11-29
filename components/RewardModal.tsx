"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, Flame, Hexagon, Trophy, Crown, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { useLeaderboard } from "@/hooks/useRewards";

interface RewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    userRewards: any;
    userProfile: any;
}

export function RewardModal({ isOpen, onClose, userRewards, userProfile }: RewardModalProps) {
    const { data: leaderboardData, isLoading: loading } = useLeaderboard('all_time', 20);
    const leaderboard = leaderboardData || [];

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />;
            case 1: return <Medal className="w-5 h-5 text-slate-400 fill-slate-400" />;
            case 2: return <Medal className="w-5 h-5 text-amber-700 fill-amber-700" />;
            default: return <span className="text-sm font-bold text-slate-500 w-5 text-center">{index + 1}</span>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md md:max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden gap-0">
                <DialogTitle className="sr-only">Rewards & Leaderboard</DialogTitle>
                <div className="grid md:grid-cols-2 h-[600px] md:h-[500px]">
                    {/* Left: User Summary */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                                <Avatar className="w-24 h-24 border-4 border-white/20 shadow-xl">
                                    <AvatarImage src={userProfile?.avatar_url} />
                                    <AvatarFallback className="text-2xl font-bold bg-indigo-800 text-white">
                                        {userProfile?.full_name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-indigo-600 shadow-lg flex items-center gap-1">
                                    <Trophy className="w-3 h-3" />
                                    <span>Rank #{leaderboard.findIndex(u => u.user_id === userRewards?.user_id) + 1 || "-"}</span>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold">{userProfile?.full_name || "Learner"}</h2>
                                <p className="text-indigo-200 text-sm">Keep pushing your limits!</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 w-full mt-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex flex-col items-center border border-white/10">
                                    <div className="bg-yellow-400/20 p-2 rounded-full mb-2">
                                        <Coins className="w-5 h-5 text-yellow-300" />
                                    </div>
                                    <span className="text-lg font-bold">{userRewards?.total_coins || 0}</span>
                                    <span className="text-xs text-indigo-200">Coins</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex flex-col items-center border border-white/10">
                                    <div className="bg-orange-500/20 p-2 rounded-full mb-2">
                                        <Flame className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <span className="text-lg font-bold">{userRewards?.current_streak || 0}</span>
                                    <span className="text-xs text-indigo-200">Streak</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex flex-col items-center border border-white/10">
                                    <div className="bg-purple-500/20 p-2 rounded-full mb-2">
                                        <Hexagon className="w-5 h-5 text-purple-300" />
                                    </div>
                                    <span className="text-lg font-bold">{userRewards?.xp || 0}</span>
                                    <span className="text-xs text-indigo-200">XP</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Leaderboard */}
                    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <h3 className="font-bold flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                Top Learners
                            </h3>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="h-14 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.map((user, index) => (
                                        <motion.div
                                            key={user.user_id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${user.user_id === userRewards?.user_id
                                                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm"
                                                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                        >
                                            <div className="w-8 flex justify-center">
                                                {getRankIcon(index)}
                                            </div>
                                            <Avatar className="w-10 h-10 border border-slate-200 dark:border-slate-700">
                                                <AvatarImage src={user.profiles?.avatar_url} />
                                                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                                                    {user.profiles?.full_name?.[0] || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${user.user_id === userRewards?.user_id ? "text-indigo-700 dark:text-indigo-300" : ""}`}>
                                                    {user.profiles?.full_name || "Anonymous"}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="flex items-center gap-0.5">
                                                        <Coins className="w-3 h-3 text-yellow-500" /> {user.total_coins}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Hexagon className="w-3 h-3 text-purple-500" /> {user.xp || 0} XP
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
