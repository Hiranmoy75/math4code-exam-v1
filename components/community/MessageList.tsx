import { useRef, useEffect } from "react";
import { useChannelMessages } from "@/hooks/community";
import { MessageCard } from "./MessageCard";
import { Loader2, Pin } from "lucide-react";
import { useUser } from "@/hooks/useUser";

interface MessageListProps {
    channelId: string;
}

export const MessageList = ({ channelId }: MessageListProps) => {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useChannelMessages(channelId);
    const { user } = useUser();
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on initial load
    useEffect(() => {
        if (!isLoading) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [isLoading, channelId]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-950/50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Loading messages...</p>
                </div>
            </div>
        );
    }

    const allMessages = data?.pages.flatMap((page) => page) || [];
    const pinnedMessages = allMessages.filter(m => m.is_pinned || m.is_announcement);
    const regularMessages = allMessages.filter(m => !m.is_pinned && !m.is_announcement).reverse();

    return (
        <div className="flex-1 overflow-y-auto flex flex-col bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-950/50 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {/* Pinned/Announcement Messages */}
            {pinnedMessages.length > 0 && (
                <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b border-blue-200 dark:border-blue-900/50 backdrop-blur-sm">
                    <div className="px-4 py-2 flex items-center gap-2 border-b border-blue-200/50 dark:border-blue-900/30">
                        <Pin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wide">
                            Pinned Messages
                        </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {pinnedMessages.reverse().map((message) => (
                            <MessageCard
                                key={message.id}
                                message={message}
                                isOwnMessage={message.user_id === user?.id}
                                isPinned={true}
                            />
                        ))}
                    </div>
                </div>
            )}

            {hasNextPage && (
                <div className="p-4 flex justify-center">
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 transition-colors px-4 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50"
                    >
                        {isFetchingNextPage ? "Loading..." : "Load older messages"}
                    </button>
                </div>
            )}

            <div className="flex-1 flex flex-col justify-end min-h-0 py-6">
                {regularMessages.length === 0 && pinnedMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
                            <span className="text-3xl">💬</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            No messages yet
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
                            Be the first to start the conversation! Share your thoughts, ask questions, or just say hi.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1 px-2">
                        {regularMessages.map((message) => (
                            <MessageCard
                                key={message.id}
                                message={message}
                                isOwnMessage={message.user_id === user?.id}
                            />
                        ))}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};
