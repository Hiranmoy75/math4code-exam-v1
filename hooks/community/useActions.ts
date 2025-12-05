import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const supabase = createClient();

export const useSendMessage = (channelId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ content, attachments = [] }: { content: string; attachments?: any[] }) => {
            console.log('📤 Sending message to channel:', channelId);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('❌ User not authenticated');
                throw new Error("Not authenticated");
            }

            console.log('👤 User:', user.id);

            const { data, error } = await supabase
                .from("community_messages")
                .insert({
                    channel_id: channelId,
                    user_id: user.id,
                    content,
                    attachments,
                })
                .select(`
                    *,
                    profiles!user_id (
                        full_name,
                        avatar_url,
                        role
                    )
                `)
                .single();

            if (error) {
                console.error('❌ Database insert error:', error);
                throw error;
            }

            console.log('✅ Message saved to database:', data);
            return data;
        },
        onMutate: async ({ content, attachments = [] }) => {
            console.log('⚡ Optimistic update for:', content.substring(0, 50));

            await queryClient.cancelQueries({ queryKey: ["community", "messages", channelId] });

            const previousMessages = queryClient.getQueryData(["community", "messages", channelId]);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { previousMessages };

            // Fetch user profile for optimistic message
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, avatar_url, role")
                .eq("id", user.id)
                .single();

            const optimisticMessage = {
                id: `temp-${Date.now()}`,
                content,
                channel_id: channelId,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                attachments,
                is_pinned: false,
                is_announcement: false,
                parent_message_id: null,
                profiles: profile || {
                    full_name: user.user_metadata.full_name || "You",
                    avatar_url: user.user_metadata.avatar_url,
                    role: user.user_metadata.role || "student",
                },
                community_reactions: [],
            };

            queryClient.setQueryData(["community", "messages", channelId], (old: any) => {
                if (!old) return { pages: [[optimisticMessage]], pageParams: [0] };

                const newPages = [...old.pages];
                newPages[0] = [optimisticMessage, ...newPages[0]];

                return {
                    ...old,
                    pages: newPages,
                };
            });

            return { previousMessages };
        },
        onSuccess: (data) => {
            console.log('✅ Message sent successfully:', data?.id);
            toast.success("Message sent!");
        },
        onError: (error: any, _, context) => {
            console.error('❌ Send message error:', error);

            if (context?.previousMessages) {
                queryClient.setQueryData(["community", "messages", channelId], context.previousMessages);
            }

            const errorMessage = error.message || "Failed to send message";
            toast.error(errorMessage);

            // Show more detailed error for debugging
            if (error.code) {
                console.error('Error code:', error.code);
                console.error('Error details:', error.details);
                console.error('Error hint:', error.hint);
            }
        },
        onSettled: () => {
            console.log('🔄 Invalidating queries for channel:', channelId);
            queryClient.invalidateQueries({ queryKey: ["community", "messages", channelId] });
        },
    });
};

export const useToggleReaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Check if reaction exists
            const { data: existing } = await supabase
                .from("community_reactions")
                .select("id")
                .eq("message_id", messageId)
                .eq("user_id", user.id)
                .eq("emoji", emoji)
                .single();

            if (existing) {
                // Remove reaction
                const { error } = await supabase
                    .from("community_reactions")
                    .delete()
                    .eq("id", existing.id);
                if (error) throw error;
            } else {
                // Add reaction
                const { error } = await supabase
                    .from("community_reactions")
                    .insert({
                        message_id: messageId,
                        user_id: user.id,
                        emoji,
                    });
                if (error) throw error;
            }
        },
        onSuccess: (_, { messageId }) => {
            // Invalidate specific message or channel messages
            queryClient.invalidateQueries({ queryKey: ["community", "messages"] });
        },
        onError: (error: any) => {
            toast.error("Failed to update reaction");
            console.error("Reaction error:", error);
        }
    });
};
