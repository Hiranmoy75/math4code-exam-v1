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
        queryFn: async () => {
            if (!userId) return []

            const supabase = createClient()

            // Fetch enrolled courses with progress
            const { data: enrollments, error } = await supabase
                .from("enrollments")
                .select(`
                    course_id,
                    progress_percentage,
                    last_accessed_at,
                    courses (
                        id,
                        title,
                        description,
                        thumbnail_url
                    )
                `)
                .eq("user_id", userId)
                .eq("status", "active")

            if (error) {
                console.error("Error fetching enrolled courses:", error)
                throw error
            }

            if (!enrollments || enrollments.length === 0) return []

            const courseIds = enrollments.map((e: any) => e.courses.id)

            // Get all modules for enrolled courses
            const { data: modules } = await supabase
                .from("modules")
                .select("id, course_id")
                .in("course_id", courseIds)

            // Get all lessons for these modules
            const moduleIds = modules?.map(m => m.id) || []
            const { data: lessons } = await supabase
                .from("lessons")
                .select("id, module_id")
                .in("module_id", moduleIds)

            // Get completed lessons for this user
            const { data: completedLessons } = await supabase
                .from("lesson_progress")
                .select("lesson_id, course_id")
                .eq("user_id", userId)
                .eq("completed", true)
                .in("course_id", courseIds)

            // Create maps for counting
            const lessonCountMap = new Map<string, number>()
            const completedCountMap = new Map<string, number>()

            // Count total lessons per course
            modules?.forEach(module => {
                const moduleLessons = lessons?.filter(l => l.module_id === module.id) || []
                const currentCount = lessonCountMap.get(module.course_id) || 0
                lessonCountMap.set(module.course_id, currentCount + moduleLessons.length)
            })

            // Count completed lessons per course
            completedLessons?.forEach(cl => {
                const currentCount = completedCountMap.get(cl.course_id) || 0
                completedCountMap.set(cl.course_id, currentCount + 1)
            })

            // Map enrollments to courses with progress
            const coursesWithProgress = enrollments.map((enrollment: any) => {
                const course = enrollment.courses
                return {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    thumbnail_url: course.thumbnail_url,
                    progress_percentage: enrollment.progress_percentage || 0,
                    last_accessed_at: enrollment.last_accessed_at,
                    total_lessons: lessonCountMap.get(course.id) || 0,
                    completed_lessons: completedCountMap.get(course.id) || 0,
                } as EnrolledCourse
            })

            return coursesWithProgress
        },
        enabled: !!userId,
    })
}
