"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface TestSeriesProgress {
    id: string;
    title: string;
    description: string | null;
    progress: number;
    completedExams: number;
    totalExams: number;
    nextExamDate: string | null;
    nextExamName: string | null;
}

export function useStudentTestSeries(userId: string | undefined) {
    return useQuery({
        queryKey: ["student-test-series", userId],
        queryFn: async (): Promise<TestSeriesProgress[]> => {
            if (!userId) return [];

            const supabase = createClient();

            // Call Optimized RPC
            const { data, error } = await supabase
                .rpc('get_student_test_series_progress', { target_user_id: userId });

            if (error) {
                console.error("Error fetching test series progress:", error);
                throw error;
            }

            // Map RPC result to interface (handling snake_case to camelCase mapping if needed, 
            // though TS usually handles it if we match names. Here we need to map manually 
            // because RPC returns snake_case by default for columns)
            return (data || []).map((item: any) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                progress: item.progress,
                completedExams: item.completed_exams,
                totalExams: item.total_exams,
                nextExamDate: item.next_exam_date,
                nextExamName: item.next_exam_name
            }));
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        retry: 1,
    });
}
