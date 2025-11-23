import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

interface MarkLessonCompleteParams {
    userId: string
    lessonId: string
    courseId: string
}

export function useMarkLessonComplete() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ userId, lessonId, courseId }: MarkLessonCompleteParams) => {
            const supabase = createClient()

            console.log("Upserting lesson progress:", { userId, lessonId, courseId });

            // Upsert lesson progress
            const { data, error } = await supabase
                .from("lesson_progress")
                .upsert(
                    {
                        user_id: userId,
                        lesson_id: lessonId,
                        course_id: courseId,
                        completed: true,
                        completed_at: new Date().toISOString(),
                    },
                    {
                        onConflict: "user_id,lesson_id",
                    }
                )
                .select()
                .single()

            if (error) {
                console.error("Supabase upsert error:", error);
                throw error;
            }

            console.log("Lesson progress upserted:", data);

            // Update last accessed lesson in enrollment
            await supabase
                .from("enrollments")
                .update({
                    last_accessed_lesson_id: lessonId,
                    last_accessed_at: new Date().toISOString(),
                })
                .eq("user_id", userId)
                .eq("course_id", courseId)

            return data
        },
        onSuccess: (_, variables) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["student-courses", variables.userId] })
            queryClient.invalidateQueries({ queryKey: ["lesson-progress", variables.userId, variables.courseId] })
        },
    })
}

export function useLessonProgress(userId: string | undefined, courseId: string | undefined) {
    return useQuery({
        queryKey: ["lesson-progress", userId, courseId],
        queryFn: async () => {
            if (!userId || !courseId) return []

            const supabase = createClient()

            const { data, error } = await supabase
                .from("lesson_progress")
                .select("*")
                .eq("user_id", userId)
                .eq("course_id", courseId)

            if (error) throw error

            return data || []
        },
        enabled: !!userId && !!courseId,
    })
}
