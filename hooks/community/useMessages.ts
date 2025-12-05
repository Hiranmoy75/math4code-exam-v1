import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CommunityMessage } from "@/types/community";

const supabase = createClient();

export const useChannelMessages = (channelId: string) => {
  const query = useInfiniteQuery({
    queryKey: ["community", "messages", channelId],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('📥 Fetching messages for channel:', channelId, 'page:', pageParam);

      const pageSize = 50;
      const start = pageParam * pageSize;
      const end = start + pageSize - 1;

      const { data, error } = await supabase
        .from("community_messages")
        .select(`
          *,
          profiles!user_id (
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
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .range(start, end);

      if (error) {
        console.error('❌ Fetch messages error:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} messages`);
      return data as CommunityMessage[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length : undefined;
    },
    enabled: !!channelId,
  });

  // Real-time subscription
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!channelId) return;

    console.log('🔌 Setting up realtime subscription for channel:', channelId);

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
          console.log('📨 Realtime message received:', payload.new);

          // Fetch the complete message with profile
          const { data: newMessage, error } = await supabase
            .from("community_messages")
            .select(`
                            *,
                            profiles!user_id (
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
            console.log('✅ Adding message to cache:', newMessage.id);

            queryClient.setQueryData(["community", "messages", channelId], (old: any) => {
              if (!old) return { pages: [[newMessage]], pageParams: [0] };

              // Check if message already exists (optimistic update)
              const exists = old.pages[0].some((m: any) =>
                m.id === newMessage.id ||
                (m.id.startsWith('temp-') && m.content === newMessage.content && m.user_id === newMessage.user_id)
              );

              if (exists) {
                console.log('⚠️ Message already exists in cache, skipping');
                return old;
              }

              const newPages = [...old.pages];
              newPages[0] = [newMessage, ...newPages[0]];
              return { ...old, pages: newPages };
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from channel:', channelId);
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient]);

  return query;
};
