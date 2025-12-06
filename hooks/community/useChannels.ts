import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { CommunityChannel } from "@/types/community";

const supabase = createClient();

export const useChannels = (courseId: string) => {
    return useQuery<CommunityChannel[]>({
        queryKey: ["community", "channels", courseId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("community_channels")
                .select("*")
                .eq("course_id", courseId)
                .eq("is_active", true)
                .order("created_at", { ascending: true });

            if (error) throw error;
            return data as CommunityChannel[];
        },
        enabled: !!courseId,
    });
};
