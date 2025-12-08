import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

interface Course {
    id: string
    title: string
    description: string
    thumbnail_url: string | null
    price: number
    is_published: boolean
    created_at: string
    instructor_name: string
    is_enrolled: boolean
    total_lessons: number
}

export function useAllCourses(userId: string | undefined) {
    return useQuery({
        queryKey: ["all-courses", userId],
        queryFn: async () => {
            const supabase = createClient()

            // Call Optimized RPC
            // Currently fetching first 20. Can add pagination params later if needed.
            const { data, error } = await supabase
                .rpc('get_published_courses_with_meta', {
                    target_user_id: userId || null,
                    p_limit: 50, // Fetch 50 initially, usually enough for dashboard
                    p_offset: 0
                });

            if (error) {
                console.error("Error fetching all courses:", error);
                throw error;
            }

            return data as Course[];
        },
        enabled: userId !== undefined, // Wait for auth check to complete (it can be null for public, but not undefined)
    })
}
