"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CheckCircle, Circle } from "lucide-react"
import { useLessonProgress, useMarkLessonComplete, useMarkLessonIncomplete } from "@/hooks/student/useLessonProgress"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface LessonNavigationProps {
    courseId: string
    currentLessonId: string
    prevLessonId: string | null
    nextLessonId: string | null
}

export function LessonNavigation({
    courseId,
    currentLessonId,
    prevLessonId,
    nextLessonId
}: LessonNavigationProps) {
    const [userId, setUserId] = useState<string | null>(null)
    const { data: lessonProgress } = useLessonProgress(userId || undefined, courseId)
    const { mutate: markComplete, isPending: isMarkingComplete } = useMarkLessonComplete()
    const { mutate: markIncomplete, isPending: isMarkingIncomplete } = useMarkLessonIncomplete()

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserId(user.id)
        }
        getUser()
    }, [])

    const isCompleted = lessonProgress?.some(p => p.lesson_id === currentLessonId && p.completed) || false

    const handleToggleComplete = () => {
        if (!userId) return

        if (isCompleted) {
            markIncomplete({ userId, lessonId: currentLessonId, courseId }, {
                onSuccess: () => toast.success("Lesson marked as incomplete"),
                onError: () => toast.error("Failed to mark incomplete")
            })
        } else {
            markComplete({ userId, lessonId: currentLessonId, courseId }, {
                onSuccess: () => toast.success("Lesson marked as complete"),
                onError: () => toast.error("Failed to mark complete")
            })
        }
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-8 border-t border-border gap-4">
            <Button variant="outline" className="gap-2 h-11 px-6 w-full sm:w-auto order-2 sm:order-1" disabled={!prevLessonId} asChild={!!prevLessonId}>
                {prevLessonId ? (
                    <Link href={`/learn/${courseId}?lessonId=${prevLessonId}`}>
                        <ChevronLeft className="h-4 w-4" /> Previous Lesson
                    </Link>
                ) : (
                    <span><ChevronLeft className="h-4 w-4" /> Previous Lesson</span>
                )}
            </Button>

            <Button
                variant="ghost"
                className="gap-2 text-muted-foreground hover:text-foreground flex w-full sm:w-auto order-3 sm:order-2"
                onClick={handleToggleComplete}
                disabled={isMarkingComplete || isMarkingIncomplete}
            >
                {isCompleted ? (
                    <>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Mark Incomplete
                    </>
                ) : (
                    <>
                        <Circle className="h-4 w-4" />
                        Mark Complete
                    </>
                )}
            </Button>

            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 px-6 shadow-md shadow-emerald-500/20 w-full sm:w-auto order-1 sm:order-3" disabled={!nextLessonId} asChild={!!nextLessonId}>
                {nextLessonId ? (
                    <Link href={`/learn/${courseId}?lessonId=${nextLessonId}`}>
                        Next Lesson <ChevronRight className="h-4 w-4" />
                    </Link>
                ) : (
                    <span>Next Lesson <ChevronRight className="h-4 w-4" /></span>
                )}
            </Button>
        </div>
    )
}
