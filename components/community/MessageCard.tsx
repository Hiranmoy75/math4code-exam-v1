import { CommunityMessage } from "@/types/community";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Smile, Trash2, Bookmark, Pin, Megaphone, Plus } from "lucide-react";
import { useToggleReaction, useToggleBookmark } from "@/hooks/community";
import { useToggleMessageReaction } from "@/hooks/community/useMessageReactions";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface MessageCardProps {
    message: CommunityMessage;
    isOwnMessage: boolean;
    isPinned?: boolean;
    onDelete?: () => void;
    channelId?: string;
}

// Common emoji reactions
const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

export const MessageCard = ({ message, isOwnMessage, isPinned = false, onDelete, channelId }: MessageCardProps) => {
    const { mutate: toggleReaction } = useToggleReaction();
    const { mutate: toggleBookmark } = useToggleBookmark(channelId);
    const { mutate: toggleMessageReaction } = useToggleMessageReaction();
    const { user } = useUser();
    const { toast } = useToast();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleReaction = (emoji: string) => {
        toggleMessageReaction({ messageId: message.id, emoji });
        setShowEmojiPicker(false);
    };

    const handleBookmark = () => {
        const isBookmarked = message.community_bookmarks?.some(b => b.user_id === user?.id) || false;
        toggleBookmark(
            { messageId: message.id, isBookmarked },
            {
                onSuccess: () => {
                    toast({
                        title: isBookmarked ? "Bookmark removed" : "Bookmark added",
                        description: isBookmarked
                            ? "Message removed from your bookmarks"
                            : "Message saved to your bookmarks",
                        duration: 3000,
                    });
                },
            }
        );
    };

    // Check if current user has bookmarked this message
    const isBookmarked = message.community_bookmarks?.some(b => b.user_id === user?.id) || false;

    // Group reactions by emoji
    const reactionCounts = message.community_reactions?.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const userReactions = new Set(
        message.community_reactions?.filter(r => r.user_id === user?.id).map(r => r.emoji)
    );

    // Parse message content for mentions
    const renderMessageContent = (content: string) => {
        const mentionRegex = /@(\w+)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            // Add text before mention
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }
            // Add mention with styling
            parts.push(
                <span key={match.index} className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-100 dark:bg-emerald-900/30 px-1 rounded">
                    @{match[1]}
                </span>
            );
            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }

        return parts.length > 0 ? parts : content;
    };

    return (
        <div className={cn(
            "group relative px-4 md:px-6 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors",
            isPinned && "bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-500"
        )}>
            {isPinned && (
                <div className="absolute top-2 right-4 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <Pin className="w-3 h-3" />
                    <span className="font-medium">Pinned</span>
                </div>
            )}

            <div className="flex gap-3">
                <Avatar className="h-10 w-10 shrink-0 border-2 border-white dark:border-slate-800 shadow-sm">
                    <AvatarImage src={message.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-600 text-white font-semibold">
                        {message.profiles?.full_name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {message.profiles?.full_name || "Unknown User"}
                        </span>
                        {message.profiles?.role === "admin" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                                <Megaphone className="w-3 h-3" />
                                Admin
                            </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                    </div>

                    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                        {renderMessageContent(message.content)}
                    </div>

                    {/* Reactions Display */}
                    {reactionCounts && Object.keys(reactionCounts).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {Object.entries(reactionCounts).map(([emoji, count]) => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    className={cn(
                                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all hover:scale-105",
                                        userReactions.has(emoji)
                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/50"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    )}
                                >
                                    <span>{emoji}</span>
                                    <span>{count}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                >
                                    <Smile className="w-4 h-4 mr-1" />
                                    React
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" align="start">
                                <div className="flex gap-1">
                                    {EMOJI_REACTIONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReaction(emoji)}
                                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xl"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBookmark}
                            className={cn(
                                "h-7 px-2 text-xs",
                                isBookmarked
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                            )}
                        >
                            <Bookmark className={cn("w-4 h-4 mr-1", isBookmarked && "fill-current")} />
                            {isBookmarked ? "Saved" : "Save"}
                        </Button>

                        {isOwnMessage && onDelete && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDelete}
                                className="h-7 px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
