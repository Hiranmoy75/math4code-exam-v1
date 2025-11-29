import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const supabase = createClient();

export type Notification = {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    is_read: boolean;
    link?: string;
    created_at: string;
};

export const useNotifications = (userId?: string) => {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["notifications", userId],
        queryFn: async () => {
            if (!userId) return [];

            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(50); // Limit to last 50 notifications

            if (error) {
                console.error("Error fetching notifications:", error);
                throw error;
            }
            return data as Notification[];
        },
        enabled: !!userId,
        // Refetch every minute to keep fresh
        refetchInterval: 60000,
    });

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        },
        onError: () => {
            toast.error("Failed to update notification");
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            if (!userId) return;
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", userId)
                .eq("is_read", false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
            toast.success("All notifications marked as read");
        },
        onError: () => {
            toast.error("Failed to mark all as read");
        },
    });

    // Real-time subscription
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`notifications-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log("🔔 Realtime Notification Received:", payload);
                    const newNotification = payload.new as Notification;

                    // 1. Invalidate query to refresh list
                    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });

                    // 2. Show Toast (Show this FIRST so it's visible even if audio fails)
                    toast(newNotification.title, {
                        description: newNotification.message,
                        action: newNotification.link ? {
                            label: "View",
                            onClick: () => window.location.href = newNotification.link!
                        } : undefined,
                    });

                    // 3. Play Sound
                    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                    audio.play()
                        .then(() => console.log("🔊 Sound played successfully"))
                        .catch((e) => {
                            if (e.name === "NotAllowedError") {
                                console.warn("🔕 Audio blocked by browser. User must interact with the page first.");
                            } else {
                                console.error("❌ Error playing sound:", e);
                            }
                        });
                }
            )
            .subscribe((status) => {
                console.log(`📡 Notification Subscription Status: ${status}`);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, queryClient]);

    return {
        notifications,
        isLoading,
        unreadCount,
        markAsRead: markAsReadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate,
    };
};
