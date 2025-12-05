import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile, Loader2 } from "lucide-react";
import { useSendMessage } from "@/hooks/community";
import { cn } from "@/lib/utils";

interface MessageInputProps {
    channelId: string;
}

export const MessageInput = ({ channelId }: MessageInputProps) => {
    const [content, setContent] = useState("");
    const { mutate: sendMessage, isPending } = useSendMessage(channelId);

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
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="p-4 md:p-6 bg-white/80 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl">
            <div className="relative flex items-end gap-3 bg-slate-100/80 dark:bg-slate-800/80 p-3 rounded-2xl border-2 border-transparent focus-within:border-emerald-500/50 dark:focus-within:border-emerald-500/30 transition-all shadow-sm hover:shadow-md">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-slate-700/50 shrink-0"
                >
                    <Paperclip className="w-5 h-5" />
                </Button>

                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
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
