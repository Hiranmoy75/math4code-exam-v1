"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useEnrollmentStatus(userId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: ["enrollment-status", userId],
        queryFn: async (): Promise<Set<string>> => {
            if (!userId) return new Set();

            const { data, error } = await supabase
                .from("test_series_enrollments")
                .select("test_series_id")
                .eq("student_id", userId);

            if (error) throw error;

            // Return a Set of enrolled series IDs for quick lookup
            return new Set(data?.map((e) => e.test_series_id) || []);
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}
