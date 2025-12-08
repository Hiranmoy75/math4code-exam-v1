import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { CommunityChannel } from "@/types/community";

// Extended interface to include metadata
interface ChannelWithMeta extends CommunityChannel {
    last_message_content?: string;
    last_message_time?: string;
    last_message_user?: string;
}

const supabase = createClient();

export const useChannels = (courseId: string) => {
    return useQuery<ChannelWithMeta[]>({
        queryKey: ["community", "channels", courseId],
        queryFn: async () => {
            // Use the Optimized RPC for fast loading
            const { data, error } = await supabase
                .rpc('get_channels_with_meta', { target_course_id: courseId });

            if (error) {
                console.error("Error fetching channels:", error);
                throw error;
            }

            return data as ChannelWithMeta[];
        },
        enabled: !!courseId
    });
};
