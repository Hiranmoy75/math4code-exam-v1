import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

interface MarkLessonCompleteParams {
    userId: string
    lessonId: string
    courseId: string
}

import { awardCoins } from "@/app/actions/rewardActions";

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

            // --- REWARD TRIGGER ---
            // Award generic lesson completion coins
            // The Server Action handles duplicates/limits
            try {
                const rewardRes = await awardCoins(userId, 'lesson_completion', lessonId, 'Completed a lesson');
                console.log("Reward Result:", rewardRes);
            } catch (err) {
                console.error("Failed to award coins:", err);
            }
            // ----------------------

            return data
        },
        onSuccess: (_, variables) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["student-courses", variables.userId] })
            queryClient.invalidateQueries({ queryKey: ["lesson-progress", variables.userId, variables.courseId] })
            // Refresh rewards UI
            queryClient.invalidateQueries({ queryKey: ["user-rewards", variables.userId] })
        },
    })
}

export function useMarkLessonIncomplete() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ userId, lessonId, courseId }: MarkLessonCompleteParams) => {
            const supabase = createClient()

            console.log("Marking lesson incomplete:", { userId, lessonId, courseId });

            // Update lesson progress to incomplete
            const { data, error } = await supabase
                .from("lesson_progress")
                .update({
                    completed: false,
                    completed_at: null,
                })
                .eq("user_id", userId)
                .eq("lesson_id", lessonId)
                .eq("course_id", courseId)
                .select()
                .single()

            if (error) {
                console.error("Supabase update error:", error);
                throw error;
            }

            console.log("Lesson marked incomplete:", data);

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
