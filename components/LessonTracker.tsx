"use client"

import { useEffect } from "react"

import { useMarkLessonComplete } from "@/hooks/student/useLessonProgress"
import { createClient } from "@/lib/supabase/client"
import { checkModuleCompletion, checkFirstLessonReward } from "@/app/actions/rewardActions"
import { toast } from "sonner"

interface LessonTrackerProps {
    lessonId: string
    courseId: string
    moduleId?: string
    children: React.ReactNode
}

export function LessonTracker({ lessonId, courseId, moduleId, children }: LessonTrackerProps) {
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
                    }, {
                        onSuccess: async () => {
                            if (moduleId) {
                                const res = await checkModuleCompletion(user.id, moduleId)
                                if (res?.success && res.message) {
                                    toast.success(res.message, { icon: "🪙" })
                                }
                            }

                            // Check for first lesson reward (referral)
                            await checkFirstLessonReward(user.id)
                        }
                    })
                }, 3000)

                return () => clearTimeout(timer)
            }
        }

        trackLesson()
    }, [lessonId, courseId, markComplete])

    return <>{children}</>
}
