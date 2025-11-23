"use client"

import { useEffect } from "react"
import { useMarkLessonComplete } from "@/hooks/student/useLessonProgress"
import { createClient } from "@/lib/supabase/client"

interface LessonTrackerProps {
    lessonId: string
    courseId: string
    children: React.ReactNode
}

export function LessonTracker({ lessonId, courseId, children }: LessonTrackerProps) {
    const { mutate: markComplete } = useMarkLessonComplete()

    useEffect(() => {
        const trackLesson = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user && lessonId) {
                // Mark lesson as complete after 3 seconds of viewing
                const timer = setTimeout(() => {
                    markComplete({
                        userId: user.id,
                        lessonId,
                        courseId,
                    })
                }, 3000)

                return () => clearTimeout(timer)
            }
        }

        trackLesson()
    }, [lessonId, courseId, markComplete])

    return <>{children}</>
}
