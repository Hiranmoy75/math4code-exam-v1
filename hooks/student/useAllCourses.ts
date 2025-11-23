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

            console.log("Fetching all courses...")

            // Fetch all published courses
            const { data: courses, error } = await supabase
                .from("courses")
                .select(`
                    id,
                    title,
                    description,
                    thumbnail_url,
                    price,
                    is_published,
                    created_at
                `)
                .eq("is_published", true)
                .order("created_at", { ascending: false })

            console.log("Courses query result:", { courses, error })

            if (error) {
                console.error("Error fetching courses:", error)
                throw error
            }

            if (!courses || courses.length === 0) {
                console.log("No published courses found")
                return []
            }

            console.log(`Found ${courses.length} published courses`)

            // Get user's enrollments if logged in
            let enrolledCourseIds: string[] = []
            if (userId) {
                const { data: enrollments } = await supabase
                    .from("enrollments")
                    .select("course_id")
                    .eq("user_id", userId)
                    .eq("status", "active")

                enrolledCourseIds = enrollments?.map((e: any) => e.course_id) || []
                console.log("Enrolled course IDs:", enrolledCourseIds)
            }

            // Get all modules for all courses in one query
            const courseIds = courses?.map(c => c.id) || []
            const { data: modules } = await supabase
                .from("modules")
                .select("id, course_id")
                .in("course_id", courseIds)

            console.log(`Found ${modules?.length || 0} modules`)

            // Get all lessons for these modules in one query
            const moduleIds = modules?.map(m => m.id) || []
            let lessons: any[] = []

            if (moduleIds.length > 0) {
                const { data: lessonsData } = await supabase
                    .from("lessons")
                    .select("id, module_id")
                    .in("module_id", moduleIds)

                lessons = lessonsData || []
            }

            console.log(`Found ${lessons.length} lessons`)

            // Create a map of course_id to lesson count
            const lessonCountMap = new Map<string, number>()
            modules?.forEach(module => {
                const moduleLessons = lessons?.filter(l => l.module_id === module.id) || []
                const currentCount = lessonCountMap.get(module.course_id) || 0
                lessonCountMap.set(module.course_id, currentCount + moduleLessons.length)
            })

            // Map courses with details
            const coursesWithDetails = (courses || []).map((course: any) => ({
                id: course.id,
                title: course.title,
                description: course.description,
                thumbnail_url: course.thumbnail_url,
                price: course.price,
                is_published: course.is_published,
                created_at: course.created_at,
                instructor_name: "Admin", // Default since created_by column doesn't exist
                is_enrolled: enrolledCourseIds.includes(course.id),
                total_lessons: lessonCountMap.get(course.id) || 0,
            } as Course))

            console.log("Final courses with details:", coursesWithDetails)

            return coursesWithDetails
        },
    })
}
