"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquare, Loader2 } from "lucide-react";
import { useToggleCommunity } from "@/hooks/admin/useToggleCommunity";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface CommunityToggleProps {
    courseId: string;
    initialEnabled: boolean;
    className?: string;
    onToggle?: (enabled: boolean) => void;
}

export function CommunityToggle({ courseId, initialEnabled, className, onToggle }: CommunityToggleProps) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const { mutate: toggleCommunity, isPending } = useToggleCommunity();
    const router = useRouter(); // Need to import useRouter

    const handleToggle = (checked: boolean) => {
        setEnabled(checked);
        onToggle?.(checked); // Optimistic update parent

        toggleCommunity(
            { courseId, enabled: checked },
            {
                onSuccess: () => {
                    router.refresh();
                },
                onError: () => {
                    // Revert on error
                    setEnabled(!checked);
                    onToggle?.(!checked);
                }
            }
        );
    };

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className="flex items-center gap-2">
                <MessageSquare className={cn(
                    "w-4 h-4 transition-colors",
                    enabled ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-600"
                )} />
                <Label
                    htmlFor={`community-${courseId}`}
                    className={cn(
                        "text-sm font-medium cursor-pointer transition-colors",
                        enabled ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"
                    )}
                >
                    Community
                </Label>
            </div>
            <div className="relative">
                {isPending && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    </div>
                )}
                <Switch
                    id={`community-${courseId}`}
                    checked={enabled}
                    onCheckedChange={handleToggle}
                    disabled={isPending}
                    className={cn(
                        "transition-opacity",
                        isPending && "opacity-0"
                    )}
                />
            </div>
        </div>
    );
}
