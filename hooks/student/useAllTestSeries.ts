"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface TestSeries {
    id: string;
    title: string;
    description: string | null;
    price: number;
    is_free: boolean;
    total_exams: number;
    status: string;
    admin_id: string;
    created_at: string;
}

export function useAllTestSeries() {
    const supabase = createClient();

    return useQuery({
        queryKey: ["all-test-series"],
        queryFn: async (): Promise<TestSeries[]> => {
            const { data, error } = await supabase
                .from("test_series")
                .select("*")
                .eq("status", "published")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
