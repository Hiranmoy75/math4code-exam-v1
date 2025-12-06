import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useChannelUsers(channelId: string | undefined) {
    return useQuery({
        queryKey: ["channel-users", channelId],
        queryFn: async () => {
            if (!channelId) return [];

            const supabase = createClient();

            // Get the channel to find its course
            const { data: channel } = await supabase
                .from("community_channels")
                .select("course_id")
                .eq("id", channelId)
                .single();

            if (!channel) return [];

            // Get all users enrolled in this course
            const { data: enrollments } = await supabase
                .from("enrollments")
                .select(`
                    user_id,
                    profiles:user_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq("course_id", channel.course_id);

            if (!enrollments) return [];

            // Format the data
            return enrollments.map((enrollment: any) => ({
                id: enrollment.profiles.id,
                full_name: enrollment.profiles.full_name,
                avatar_url: enrollment.profiles.avatar_url,
            }));
        },
        enabled: !!channelId,
    });
}
