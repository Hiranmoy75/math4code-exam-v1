import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Lesson } from "@/lib/types";

export const useLesson = (lessonId: string) => {
    const supabase = createClient();

    return useQuery({
        queryKey: ['lesson', lessonId],
        queryFn: async ({ signal }) => { // 1. signal support
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .eq('id', lessonId)
                .abortSignal(signal) // 2. Attach signal
                .single();

            if (error) throw error;
            return data as Lesson;
        },
        enabled: !!lessonId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30,   // 30 minutes
        retry: 1, // Fail fast
        refetchOnWindowFocus: false,
    });
};
