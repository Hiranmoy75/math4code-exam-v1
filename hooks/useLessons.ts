import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface LessonSummary {
    id: string;
    module_id: string;
    title: string;
    content_type: 'video' | 'text' | 'pdf' | 'quiz';
    video_duration?: number;
    is_free_preview: boolean;
    lesson_order: number;
    is_live?: boolean;
    meeting_url?: string;
    meeting_date?: string;
    created_at: string;
    updated_at: string;
}

export interface ModuleStructure {
    id: string;
    title: string;
    module_order: number;
    lessons: LessonSummary[];
}

export const useLessons = (courseId: string) => {
    const supabase = createClient();

    return useQuery({
        queryKey: ['course-structure', courseId],
        queryFn: async ({ signal }) => { // 1. signal support
            // OPTIMIZATION: Use RPC for single round-trip fetch
            const { data, error } = await supabase
                .rpc('get_course_structure', { target_course_id: courseId });

            if (error) {
                // Fallback to standard query if RPC fails (e.g., function not created yet)
                console.warn("RPC failed, falling back to standard query:", error);
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('modules')
                    .select(`
                        id, 
                        title, 
                        module_order,
                        lessons (
                            id, 
                            title, 
                            module_id, 
                            content_type, 
                            video_duration, 
                            is_free_preview, 
                            lesson_order, 
                            is_live,
                            created_at, 
                            updated_at
                        )
                    `)
                    .eq('course_id', courseId)
                    .order('module_order', { ascending: true })
                    .abortSignal(signal);

                if (fallbackError) throw fallbackError;

                return fallbackData?.map((module: any) => ({
                    ...module,
                    lessons: (module.lessons || []).sort((a: any, b: any) => a.lesson_order - b.lesson_order)
                })) as ModuleStructure[];
            }

            // RPC returns presorted data via SQL ORDER BY
            return data as ModuleStructure[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30,   // 30 minutes
        retry: 1, // Fail fast optimization
        refetchOnWindowFocus: false,
    });
};
