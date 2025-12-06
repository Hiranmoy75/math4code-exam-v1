import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const supabase = createClient();

export const useToggleCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ courseId, enabled }: { courseId: string; enabled: boolean }) => {
            const { error } = await supabase
                .from("courses")
                .update({ community_enabled: enabled })
                .eq("id", courseId);

            if (error) throw error;
        },
        onSuccess: (_, { courseId, enabled }) => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            queryClient.invalidateQueries({ queryKey: ["course", courseId] });
            queryClient.invalidateQueries({ queryKey: ["admin", "courses-with-channels"] });
            toast.success(enabled ? "Community enabled!" : "Community disabled");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to toggle community");
            console.error("Toggle community error:", error);
        }
    });
};
