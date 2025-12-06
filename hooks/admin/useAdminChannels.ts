import { createClient } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CommunityChannel } from "@/types/community";

export const useUpdateChannel = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ channelId, name, description, type }: { channelId: string; name: string; description?: string; type?: "announcement" | "discussion" | "qa" }) => {
            const supabase = createClient();
            const updates: any = { name };
            if (description !== undefined) updates.description = description;
            if (type !== undefined) updates.type = type;

            const { data, error } = await supabase
                .from("community_channels")
                .update(updates)
                .eq("id", channelId)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            toast.success("Channel updated successfully");
            queryClient.invalidateQueries({ queryKey: ["admin", "courses-with-channels"] });
            queryClient.invalidateQueries({ queryKey: ["channels"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update channel");
        },
    });
};

import { AdminCourseWithChannels } from "./useAdminCoursesWithChannels";

export const useDeleteChannel = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ channelId, courseId }: { channelId: string; courseId: string }) => {
            const supabase = createClient();
            console.log("Creating supabase client for delete...");

            // 1. Fetch all message IDs to clean up dependent tables
            console.log("Fetching message IDs for channel:", channelId);
            const { data: messages, error: fetchError } = await supabase
                .from("community_messages")
                .select("id")
                .eq("channel_id", channelId);

            if (fetchError) {
                console.error("Error fetching messages:", fetchError);
            }

            const messageIds = messages?.map(m => m.id) || [];
            console.log(`Found ${messageIds.length} messages to clean up.`);

            if (messageIds.length > 0) {
                // 2. Delete Reactions
                console.log("Deleting reactions...");
                const { error: reactionError } = await supabase
                    .from("community_reactions")
                    .delete()
                    .in("message_id", messageIds);
                if (reactionError) console.error("Error deleting reactions:", reactionError);

                // 3. Delete Bookmarks
                console.log("Deleting bookmarks...");
                const { error: bookmarkError } = await supabase
                    .from("community_bookmarks")
                    .delete()
                    .in("message_id", messageIds);
                if (bookmarkError) console.error("Error deleting bookmarks:", bookmarkError);
            }

            // 4. Delete Messages (Manual Cascade)
            console.log("Deleting messages for channel:", channelId);
            const { error: msgError } = await supabase
                .from("community_messages")
                .delete()
                .eq("channel_id", channelId);

            if (msgError) {
                console.error("Error deleting messages:", msgError);
            }

            // 5. Delete Channel
            console.log("Deleting channel:", channelId);
            const { error } = await supabase
                .from("community_channels")
                .delete()
                .eq("id", channelId);

            if (error) {
                console.error("Error deleting channel:", error);
                throw new Error(error.message);
            }

            console.log("Channel deleted successfully");
            return { channelId, courseId };
        },
        onMutate: async ({ channelId, courseId }) => {
            console.log("Optimistic update start");
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["admin", "courses-with-channels"] });

            // Snapshot the previous value
            const previousCourses = queryClient.getQueryData<AdminCourseWithChannels[]>(["admin", "courses-with-channels"]);

            // Optimistically update to the new value
            if (previousCourses) {
                queryClient.setQueryData<AdminCourseWithChannels[]>(["admin", "courses-with-channels"], (old) => {
                    if (!old) return [];
                    return old.map(course => {
                        if (course.id === courseId) {
                            return {
                                ...course,
                                channels: course.channels.filter(ch => ch.id !== channelId)
                            };
                        }
                        return course;
                    });
                });
            }

            // Return a context object with the snapshotted value
            return { previousCourses };
        },
        onError: (err, newTodo, context: any) => {
            if (context?.previousCourses) {
                queryClient.setQueryData(["admin", "courses-with-channels"], context.previousCourses);
            }
            toast.error(err.message || "Failed to delete channel");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "courses-with-channels"] });
            queryClient.invalidateQueries({ queryKey: ["channels"] });
        },
        onSuccess: () => {
            toast.success("Channel deleted");
        },
    });
};
