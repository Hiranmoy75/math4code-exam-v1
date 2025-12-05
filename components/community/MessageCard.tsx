import { CommunityMessage } from "@/types/community";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Smile, Trash2 } from "lucide-react";
import { useToggleReaction } from "@/hooks/community";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";

interface MessageCardProps {
    message: CommunityMessage;
    isOwnMessage: boolean;
    isPinned?: boolean;
    onDelete?: () => void;
}

export const MessageCard = ({ message, isOwnMessage, isPinned = false, onDelete }: MessageCardProps) => {
    const { mutate: toggleReaction } = useToggleReaction();
    const { user } = useUser();

    const handleReaction = (emoji: string) => {
        toggleReaction({ messageId: message.id, emoji });
    };

    // Group reactions by emoji
    const reactionCounts = message.reactions?.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const userReactions = new Set(
        message.reactions?.filter(r => r.user_id === user?.id).map(r => r.emoji)
    );

    return (
        <div className={cn(
            "group flex gap-3 py-2 px-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/50",
            isOwnMessage ? "flex-row-reverse" : "flex-row"
        )}>
            <Avatar className="w-8 h-8 mt-1 border border-border shrink-0">
                <AvatarImage src={message.profiles?.avatar_url || ""} />
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {message.profiles?.full_name?.[0] || "U"}
                </AvatarFallback>
            </Avatar>

            <div className={cn(
                "flex flex-col max-w-[75%]",
                isOwnMessage ? "items-end" : "items-start"
            )}>
                <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-xs font-medium text-foreground">
                        {isOwnMessage ? "You" : (message.profiles?.full_name || "Unknown User")}
                    </span>
                    {message.profiles?.role === "admin" && (
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded font-medium uppercase">
                            Admin
                        </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                </div>

                <div className={cn(
                    "relative px-4 py-2 rounded-2xl text-sm shadow-sm break-words whitespace-pre-wrap",
                    isOwnMessage
                        ? "bg-emerald-600 text-white rounded-tr-sm"
                        : "bg-white dark:bg-slate-800 border border-border text-foreground rounded-tl-sm"
                )}>
                    {message.content}

                    {/* Reaction Button (Floating) */}
                    <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                        isOwnMessage ? "-left-10" : "-right-10"
                    )}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full bg-background border border-border shadow-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => handleReaction("👍")}
                        >
                            <Smile className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </div>
                </div>

                {/* Reactions Display */}
                {(Object.keys(reactionCounts || {}).length > 0) && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap justify-end">
                        {Object.entries(reactionCounts || {}).map(([emoji, count]) => (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                className={cn(
                                    "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border transition-all shadow-sm",
                                    userReactions.has(emoji)
                                        ? "bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400"
                                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <span>{emoji}</span>
                                <span className="font-medium">{count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {isOwnMessage && onDelete && (
                    <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={onDelete}
                            className="text-[10px] text-red-500 hover:underline flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
