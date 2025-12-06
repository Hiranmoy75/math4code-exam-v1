import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const supabase = createClient();

export const useCreateChannel = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            courseId,
            name,
            type,
            description
        }: {
            courseId: string;
            name: string;
            type: 'announcement' | 'discussion' | 'qa';
            description: string;
        }) => {
            const { data, error } = await supabase
                .from("community_channels")
                .insert({
                    course_id: courseId,
                    name: name.toLowerCase().replace(/\s+/g, '-'),
                    type,
                    description,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["community", "channels"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "courses-with-channels"] });
            toast.success("Channel created successfully!");
        },
        onError: (error: any) => {
            if (error.code === '23505') {
                toast.error("A channel with this name already exists");
            } else {
                toast.error(error.message || "Failed to create channel");
            }
            console.error("Create channel error:", error);
        }
    });
};
