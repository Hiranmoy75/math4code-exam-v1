"use client";

import { useEffect } from "react";
import { checkStreak, awardCoins } from "@/app/actions/rewardActions";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export function RewardInitializer({ userId }: { userId: string }) {
    const pathname = usePathname();

    useEffect(() => {
        if (!userId) return;

        const initRewards = async () => {
            // New Flow: Trigger 'login' action. 
            // The DB Trigger handles Streak Updates + Coin Awards automatically.
            const loginRes = await awardCoins(userId, 'login');

            if (loginRes.success && loginRes.message) {
                toast.success(loginRes.message, {
                    icon: "🔥",
                    duration: 3000
                });
                // Dispatch event to refresh UI counters
                window.dispatchEvent(new Event("rewards-updated"));
            }
        };

        // Run once on mount (session start)
        initRewards();
    }, [userId]); // Dependency on userId ensures it runs when user is available

    return null; // This component renders nothing
}
