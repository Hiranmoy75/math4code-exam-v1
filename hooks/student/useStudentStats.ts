"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface StudentStats {
    totalExams: number;
    averageScore: number;
    totalTimeSpent: number;
    rank: number;
}

export function useStudentStats(userId: string | undefined) {
    return useQuery({
        queryKey: ["student-stats", userId],
        queryFn: async ({ signal }): Promise<StudentStats> => {
            if (!userId) {
                return {
                    totalExams: 0,
                    averageScore: 0,
                    totalTimeSpent: 0,
                    rank: 0,
                };
            }

            const supabase = createClient();

            // Call the optimized RPC function
            const { data, error } = await supabase
                .rpc('get_student_stats', { target_user_id: userId })
                .abortSignal(signal);

            if (error) {
                // Ignore AbortError caused by navigation
                if (error.code === '20' || error.message.includes('AbortError') || error.message.includes('aborted')) {
                    return { totalExams: 0, averageScore: 0, totalTimeSpent: 0, rank: 0 };
                }

                console.error("Error fetching student stats:", error.message);
                throw error;
            }

            return data as unknown as StudentStats;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1
    });
}
