import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile, Loader2 } from "lucide-react";
import { useSendMessage } from "@/hooks/community";
import { useChannelUsers } from "@/hooks/community/useChannelUsers";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageInputProps {
    channelId: string;
}

export const MessageInput = ({ channelId }: MessageInputProps) => {
    const [content, setContent] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState("");
    const [mentionStartPos, setMentionStartPos] = useState(0);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { mutate: sendMessage, isPending } = useSendMessage(channelId);
    const { data: users = [] } = useChannelUsers(channelId);

    // Filter users based on mention search
    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(mentionSearch.toLowerCase())
    );

    // Detect @ mentions
    useEffect(() => {
        const cursorPos = textareaRef.current?.selectionStart || 0;
        const textBeforeCursor = content.substring(0, cursorPos);
        const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

        if (lastAtSymbol !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
            // Check if there's no space after @
            if (!textAfterAt.includes(' ')) {
                setMentionSearch(textAfterAt);
                setMentionStartPos(lastAtSymbol);
                setShowMentions(true);
                setSelectedMentionIndex(0);
                return;
            }
        }
        setShowMentions(false);
    }, [content]);

    const insertMention = (userName: string) => {
        const beforeMention = content.substring(0, mentionStartPos);
        const afterCursor = content.substring(textareaRef.current?.selectionStart || 0);
        const newContent = `${beforeMention}@${userName} ${afterCursor}`;
        setContent(newContent);
        setShowMentions(false);

        // Focus back on textarea
        setTimeout(() => {
            textareaRef.current?.focus();
            const newCursorPos = mentionStartPos + userName.length + 2;
            textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!content.trim() || isPending) return;

        sendMessage(
            { content },
            {
                onSuccess: () => setContent(""),
            }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && filteredUsers.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedMentionIndex((prev) =>
                    prev < filteredUsers.length - 1 ? prev + 1 : prev
                );
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertMention(filteredUsers[selectedMentionIndex].full_name);
                return;
            }
            if (e.key === "Escape") {
                setShowMentions(false);
                return;
            }
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="p-4 md:p-6 bg-white/80 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl relative">
            {/* Mention Dropdown */}
            {showMentions && filteredUsers.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto z-50">
                    <div className="p-2 space-y-1">
                        {filteredUsers.map((user, index) => (
                            <button
                                key={user.id}
                                onClick={() => insertMention(user.full_name)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                                    index === selectedMentionIndex
                                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                                        : "hover:bg-slate-100 dark:hover:bg-slate-700"
                                )}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-600 text-white text-xs">
                                        {user.full_name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{user.full_name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="relative flex items-end gap-3 bg-slate-100/80 dark:bg-slate-800/80 p-3 rounded-2xl border-2 border-transparent focus-within:border-emerald-500/50 dark:focus-within:border-emerald-500/30 transition-all shadow-sm hover:shadow-md">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-slate-700/50 shrink-0"
                >
                    <Paperclip className="w-5 h-5" />
                </Button>

                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Use @ to mention someone)"
                    disabled={isPending}
                    className="min-h-[48px] max-h-[180px] border-0 bg-transparent focus-visible:ring-0 resize-none py-3 px-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
                    rows={1}
                />

                <div className="flex items-center gap-2 pb-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-slate-700/50"
                    >
                        <Smile className="w-5 h-5" />
                    </Button>
                    <Button
                        onClick={() => handleSubmit()}
                        disabled={!content.trim() || isPending}
                        size="icon"
                        className={cn(
                            "h-10 w-10 rounded-xl transition-all duration-200 shadow-md",
                            content.trim() && !isPending
                                ? "bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-emerald-500/50 dark:shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                                : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-60"
                        )}
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </Button>
                </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-500 mt-2.5 text-center flex items-center justify-center gap-2">
                <span>Press</span>
                <kbd className="font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-[10px] font-semibold">Enter</kbd>
                <span>to send</span>
            </div>
        </div>
    );
};
