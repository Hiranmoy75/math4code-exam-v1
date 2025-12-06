import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useMessageReactions(messageId: string) {
    return useQuery({
        queryKey: ["message-reactions", messageId],
        queryFn: async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("community_reactions")
                .select("*")
                .eq("message_id", messageId);

            if (error) throw error;
            return data || [];
        },
    });
}

export function useToggleMessageReaction() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Check if reaction already exists
            const { data: existing, error: checkError } = await supabase
                .from("community_reactions")
                .select("id")
                .eq("message_id", messageId)
                .eq("user_id", user.id)
                .eq("emoji", emoji)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existing) {
                // Remove reaction
                const { error } = await supabase
                    .from("community_reactions")
                    .delete()
                    .eq("id", existing.id);

                if (error) throw error;
                return { action: "removed" };
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
                return { action: "added" };
            }
        },
        onSuccess: (_, variables) => {
            // Invalidate queries to refetch messages
            queryClient.invalidateQueries({ queryKey: ["community", "messages"] });
            queryClient.invalidateQueries({ queryKey: ["message-reactions", variables.messageId] });
        },
    });
}
