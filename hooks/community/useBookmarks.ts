import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useMentions = () => {
    return useQuery({
        queryKey: ['community', 'mentions'],
        queryFn: async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get user's name to search for mentions
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (!profile?.full_name) return [];

            // Search for messages that mention the user
            const { data, error } = await supabase
                .from('community_messages')
                .select(`
                    *,
                    profiles!user_id (
                        full_name,
                        avatar_url,
                        role
                    ),
                    community_reactions (
                        id,
                        emoji,
                        user_id
                    ),
                    community_bookmarks (
                        id,
                        user_id
                    ),
                    community_channels!channel_id (
                        id,
                        name,
                        course_id,
                        courses (
                            id,
                            title
                        )
                    )
                `)
                .ilike('content', `%@${profile.full_name}%`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data || [];
        },
    });
};

export const useBookmarkedMessages = () => {
    return useQuery({
        queryKey: ['community', 'bookmarks'],
        queryFn: async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('community_bookmarks')
                .select(`
                    id,
                    created_at,
                    community_messages (
                        id,
                        content,
                        created_at,
                        channel_id,
                        user_id,
                        is_pinned,
                        is_announcement,
                        profiles:user_id (
                            full_name,
                            avatar_url,
                            role
                        ),
                        community_reactions (
                            id,
                            emoji,
                            user_id
                        ),
                        community_bookmarks (
                            id,
                            user_id
                        ),
                        community_channels (
                            id,
                            name,
                            course_id,
                            courses (
                                id,
                                title
                            )
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to include message details
            return data?.map((bookmark: any) => ({
                bookmarkId: bookmark.id,
                bookmarkedAt: bookmark.created_at,
                message: bookmark.community_messages,
            })) || [];
        },
    });
};

export const useToggleBookmark = (channelId?: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ messageId, isBookmarked }: { messageId: string; isBookmarked: boolean }) => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            if (isBookmarked) {
                // Remove bookmark
                const { error } = await supabase
                    .from('community_bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('message_id', messageId);

                if (error) throw error;
                return { action: 'removed' };
            } else {
                // Add bookmark - check if it already exists first
                const { data: existing } = await supabase
                    .from('community_bookmarks')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('message_id', messageId)
                    .single();

                if (existing) {
                    return { action: 'added' };
                }

                const { error } = await supabase
                    .from('community_bookmarks')
                    .insert({
                        user_id: user.id,
                        message_id: messageId,
                    });

                if (error) {
                    if (error.code === '23505') {
                        return { action: 'added' };
                    }
                    throw error;
                }
                return { action: 'added' };
            }
        },
        onSuccess: (data) => {
            // Invalidate all message queries
            if (channelId) {
                queryClient.invalidateQueries({ queryKey: ['community', 'messages', channelId] });
            }
            queryClient.invalidateQueries({ queryKey: ['community', 'bookmarks'] });
            queryClient.invalidateQueries({ queryKey: ['community', 'messages'] });

            toast({
                title: data.action === 'added' ? 'Message bookmarked' : 'Bookmark removed',
                description: data.action === 'added' ? 'Message saved to bookmarks' : 'Message removed from bookmarks',
            });
        },
        onError: (error) => {
            console.error('Bookmark error:', error);
            toast({
                title: 'Failed to update bookmark',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive',
            });
        },
    });
};
