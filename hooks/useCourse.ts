import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export const useCourse = (courseId: string) => {
    const supabase = createClient();

    return useQuery({
        queryKey: ['course', courseId],
        queryFn: async ({ signal }) => {
            const { data, error } = await supabase
                .from('courses')
                .select(`
                    *,
                    creator:profiles!courses_user_id_fkey(full_name, avatar_url)
                `)
                .eq('id', courseId)
                .abortSignal(signal)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!courseId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30,   // 30 minutes
        retry: 1,
    });
};