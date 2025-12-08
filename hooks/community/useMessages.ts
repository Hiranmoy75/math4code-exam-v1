import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CommunityMessage } from "@/types/community";

const supabase = createClient();

export const useChannelMessages = (channelId: string) => {
  const query = useInfiniteQuery({
    queryKey: ["community", "messages", channelId],
    queryFn: async ({ pageParam = 0 }) => {
      const pageSize = 20; // Reduced from 50 for performance
      const start = pageParam * pageSize;
      const end = start + pageSize - 1;

      const { data, error } = await supabase
        .from("community_messages")
        .select(`
          id,
          content,
          created_at,
          user_id,
          channel_id,
          attachments,
          is_pinned,
          is_announcement,
          parent_message_id,
          profiles:user_id (
            full_name,
            avatar_url,
            role
          ),
          community_reactions!message_id (
            id,
            emoji,
            user_id
          ),
          community_bookmarks!message_id (
            id,
            user_id
          )
        `)
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .range(start, end);

      if (error) {
        console.error('❌ Fetch messages error:', error);
        throw error;
      }

      return data as unknown as CommunityMessage[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length : undefined;
    },
    enabled: !!channelId,
    staleTime: 1000 * 60, // 1 minute stale time
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    refetchOnWindowFocus: false, // Prevent jarring refetch of chat on focus
  });

  // Real-time subscription
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!channelId) return;

    // console.log('🔌 Setting up realtime subscription for channel:', channelId);

    const channel = supabase
      .channel(`community_messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // console.log('📨 Realtime message received:', payload.new);

          // Fetch the complete message with profile
          const { data: newMessage, error } = await supabase
            .from("community_messages")
            .select(`
                id,
                content,
                created_at,
                user_id,
                channel_id,
                attachments,
                is_pinned,
                is_announcement,
                parent_message_id,
                profiles:user_id (
                    full_name,
                    avatar_url,
                    role
                ),
                community_reactions!message_id (
                    id,
                    emoji,
                    user_id
                )
            `)
            .eq("id", payload.new.id)
            .single();

          if (error) {
            console.error('❌ Error fetching new message:', error);
            return;
          }

          if (newMessage) {
            // console.log('✅ Adding message to cache:', newMessage.id);

            queryClient.setQueryData(["community", "messages", channelId], (old: any) => {
              if (!old) return { pages: [[newMessage]], pageParams: [0] };

              // Check if message already exists (optimistic update)
              const exists = old.pages[0].some((m: any) =>
                m.id === newMessage.id ||
                (m.id.startsWith('temp-') && m.content === newMessage.content && m.user_id === newMessage.user_id)
              );

              if (exists) {
                return old;
              }

              const newPages = [...old.pages];
              newPages[0] = [newMessage, ...newPages[0]];
              return { ...old, pages: newPages };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient]);

  return query;
};
