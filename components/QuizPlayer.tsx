"use client"

import { useState } from "react"
import { EmbeddedExam, PreviousResultView } from "@/components/EmbeddedExam"
import { Button } from "@/components/ui/button"
import { Clock, FileQuestion, ListChecks, Trophy } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

interface QuizPlayerProps {
    exam: {
        id: string
        title: string
        duration_minutes: number
        total_marks: number
        description?: string
        max_attempts?: number
    }
    attempts: any[]
    userId: string
    questionsCount: number
    maxAttempts?: number
}

export function QuizPlayer({ exam, attempts, userId, questionsCount, maxAttempts = 1 }: QuizPlayerProps) {
    const [view, setView] = useState<"landing" | "exam" | "result">("landing")
    const [selectedAttempt, setSelectedAttempt] = useState<any>(null)

    // Fetch attempts with React Query to ensure freshness after submission
    const { data: attemptsData } = useQuery({
        queryKey: ["exam-attempts", exam.id, userId],
        queryFn: async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from("exam_attempts")
                .select("*, result:results(*)")
                .eq("exam_id", exam.id)
                .eq("student_id", userId)
                .order("created_at", { ascending: false })
            return data || []
        },
        initialData: attempts,
        staleTime: 0,
        refetchOnMount: true
    })

    // Determine status
    const completedAttempts = (attemptsData || []).filter((a: any) => a.status === 'submitted')
    // Use max_attempts from exam if available (including null for unlimited), otherwise use prop
    // We check for undefined because null is a valid value for unlimited
    const limit = exam.max_attempts !== undefined ? exam.max_attempts : maxAttempts

    // Calculate attempts left (only relevant if limit is not null)
    const attemptsLeft = limit !== null && limit !== undefined ? Math.max(0, limit - completedAttempts.length) : Infinity
    const hasAttempted = completedAttempts.length > 0

    const handleStart = () => {
        setView("exam")
    }

    const handleViewResult = (attempt: any) => {
        setSelectedAttempt(attempt)
        setView("result")
    }

    if (view === "exam") {
        return <EmbeddedExam examId={exam.id} onExit={() => setView("landing")} isRetake={hasAttempted} />
    }

    if (view === "result") {
        return (
            <div className="space-y-4">
                <Button
                    variant="ghost"
                    onClick={() => setView("landing")}
                    className="pl-0 hover:pl-2 transition-all"
                >
                    ← Back to Quiz Details
                </Button>
                <PreviousResultView
                    examId={exam.id}
                    userId={userId}
                    onRetake={() => setView("exam")}
                    attemptId={selectedAttempt?.id}
                    initialResult={selectedAttempt?.result}
                />
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-[#0d1117] rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex-1 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{exam.title}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{exam.description || "Test your knowledge with this quiz."}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <FileQuestion className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">{questionsCount} questions</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">{exam.duration_minutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <ListChecks className="w-5 h-5 text-blue-500" />
                            <span className={`font-medium ${limit && attemptsLeft === 0 ? "text-rose-500" : ""}`}>
                                {limit ? `${attemptsLeft} of ${limit} Attempts left` : "Unlimited Attempts"}
                            </span>
                        </div>
                    </div>

                    {/* Attempts History */}
                    {hasAttempted && (
                        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
                            <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Your Attempts</h3>
                            <div className="space-y-3">
                                {completedAttempts.map((attempt, idx) => {
                                    const resultData = Array.isArray(attempt.result) ? attempt.result[0] : attempt.result
                                    return (
                                        <div key={attempt.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                                    {completedAttempts.length - idx}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                        Attempt {completedAttempts.length - idx}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {new Date(attempt.submitted_at).toLocaleDateString()} • Score: {resultData?.score ?? resultData?.obtained_marks ?? "N/A"}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewResult(attempt)}
                                                className="h-8"
                                            >
                                                View Result
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-4">
                        {(limit === null || limit === undefined || attemptsLeft > 0) && (
                            <Button
                                onClick={handleStart}
                                className={hasAttempted ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-transparent dark:border-slate-700 dark:text-slate-300" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
                            >
                                {hasAttempted ? "Retake Exam" : "Start Exam"}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="hidden md:block w-1/3">
                    <div className="aspect-square bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                        <Trophy className="w-24 h-24 text-indigo-200 dark:text-indigo-800" />
                    </div>
                </div>
            </div>
        </div>
    )
}
