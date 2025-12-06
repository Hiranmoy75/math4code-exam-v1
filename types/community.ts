export type ChannelType = 'announcement' | 'discussion' | 'qa';

export interface CommunityChannel {
    id: string;
    course_id: string;
    name: string;
    type: ChannelType;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CommunityMessage {
    id: string;
    channel_id: string;
    user_id: string;
    content: string;
    attachments: any[]; // JSONB
    is_pinned: boolean;
    is_announcement: boolean;
    parent_message_id: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    profiles?: {
        full_name: string | null;
        avatar_url: string | null;
        role: string;
    };
    author?: {
        full_name: string | null;
        avatar_url: string | null;
        role: string;
    };
    reactions?: CommunityReaction[];
    community_reactions?: CommunityReaction[];
    community_bookmarks?: CommunityBookmark[];
    reply_count?: number;
}

export interface CommunityReaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
}

export interface CommunityBookmark {
    id: string;
    message_id: string;
    user_id: string;
    created_at: string;
}
