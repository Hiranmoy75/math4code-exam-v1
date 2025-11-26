import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface PublicTestSeries {
    id: string;
    title: string;
    description: string | null;
    price: number;
    thumbnail_url: string | null;
    created_at: string;
    creator_id: string;
}

export const usePublicTestSeries = () => {
    const supabase = createClient();

    return useQuery({
        queryKey: ["public-test-series"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("test_series")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as PublicTestSeries[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
