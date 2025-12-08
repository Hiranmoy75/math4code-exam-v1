import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

interface EnrolledCourse {
    id: string
    title: string
    description: string
    thumbnail_url: string | null
    progress_percentage: number
    last_accessed_at: string | null
    total_lessons: number
    completed_lessons: number
}

export function useStudentCourses(userId: string | undefined) {
    return useQuery({
        queryKey: ["student-courses", userId],
        queryFn: async ({ signal }) => {
            if (!userId) {
                return []
            }

            const supabase = createClient()

            // Call the optimized RPC function
            const { data, error } = await supabase
                .rpc('get_student_courses_progress', { target_user_id: userId })
                .abortSignal(signal);

            if (error) {
                // Ignore AbortError caused by navigation
                if (error.code === '20' || error.message.includes('AbortError') || error.message.includes('aborted')) {
                    return [];
                }

                console.error("Error fetching enrolled courses from RPC:", error.message);
                throw error
            }

            return data as EnrolledCourse[]
        },
        enabled: !!userId,
        staleTime: 0, // Keeping 0 for now as per your request for immediate updates
    })
}
