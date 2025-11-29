import { useState } from "react";
import { useRewards } from "@/hooks/useRewards";
import { Gift, Flame, Hexagon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { RewardModal } from "./RewardModal";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function RewardDisplay({ userId, userProfile }: { userId: string; userProfile?: any }) {
    const { rewardStatus: rewards } = useRewards(userId);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch profile if not provided
    const { data: fetchedProfile } = useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            const supabase = createClient();
            const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
            return data;
        },
        enabled: !userProfile,
        staleTime: 1000 * 60 * 5
    });

    const profile = userProfile || fetchedProfile;

    if (!rewards) return null;

    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 sm:gap-6 mr-4 cursor-pointer hover:opacity-90 transition-opacity"
            >
                {/* Coins (Gift Icon) */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                                <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-orange-400 fill-orange-400/20" />
                                <AnimatePresence mode="popLayout">
                                    <motion.span
                                        key={rewards.total_coins}
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -10, opacity: 0 }}
                                        className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200"
                                    >
                                        {rewards.total_coins}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Total Coins</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Streak (Flame in Circle) */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="hidden sm:flex items-center gap-2">
                                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${rewards.current_streak > 0 ? "bg-orange-100 dark:bg-orange-900/30" : "bg-slate-200 dark:bg-slate-800"}`}>
                                    <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${rewards.current_streak > 0 ? "text-orange-500 fill-orange-500 animate-pulse" : "text-slate-400 fill-slate-400"}`} />
                                </div>
                                <span className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">{rewards.current_streak}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Daily Streak</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* XP (Hexagon) */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                                    <Hexagon className="w-full h-full text-blue-200 dark:text-blue-900 fill-blue-100 dark:fill-blue-900/50" />
                                    <span className="absolute text-[8px] sm:text-[10px] font-bold text-blue-600 dark:text-blue-400">XP</span>
                                </div>
                                <span className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">{rewards.xp || 0}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>XP Progress</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <RewardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userRewards={rewards}
                userProfile={profile}
            />
        </>
    );
}
