import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { CommunityChannel } from "@/types/community";

const supabase = createClient();

export interface AdminCourseWithChannels {
    id: string;
    title: string;
    thumbnail_url: string | null;
    category: string | null;
    community_enabled: boolean;
    channels: CommunityChannel[];
}

export const useAdminCoursesWithChannels = (userId: string | undefined) => {
    return useQuery({
        queryKey: ["admin", "courses-with-channels", userId],
        queryFn: async () => {
            if (!userId) return [];

            const { data, error } = await supabase
                .from("courses")
                .select(`
                    id,
                    title,
                    thumbnail_url,
                    category,
                    community_enabled
                `)
                .eq("creator_id", userId);

            if (error) throw error;

            // Fetch channels for each course
            const coursesWithChannels = await Promise.all(
                (data || []).map(async (course) => {
                    const { data: channels } = await supabase
                        .from("community_channels")
                        .select("*")
                        .eq("course_id", course.id)
                        .order("created_at", { ascending: true });

                    return {
                        ...course,
                        channels: channels || [],
                    };
                })
            );

            return coursesWithChannels as AdminCourseWithChannels[];
        },
        enabled: !!userId,
    });
};
