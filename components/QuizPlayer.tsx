"use client"

import { useState, useEffect } from "react"
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
    const { data: attemptsData, refetch } = useQuery({
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
        refetchOnMount: true,
        refetchOnWindowFocus: true
    })

    // Determine status
    const completedAttempts = (attemptsData || []).filter((a: any) => a.status === 'submitted')
    // Use max_attempts from exam if available (including null for unlimited), otherwise use prop
    // We check for undefined because null is a valid value for unlimited
    const limit = exam.max_attempts !== undefined ? exam.max_attempts : maxAttempts

    // Calculate attempts left (only relevant if limit is not null)
    const attemptsLeft = limit !== null && limit !== undefined ? Math.max(0, limit - completedAttempts.length) : Infinity

    // Check if there is an active attempt (not submitted)
    const activeAttempt = (attemptsData || []).find((a: any) => a.status !== 'submitted')
    const hasAttempted = completedAttempts.length > 0 || !!activeAttempt

    const handleStart = () => {
        setView("exam")
    }

    const handleViewResult = (attempt: any) => {
        setSelectedAttempt(attempt)
        setView("result")
    }

    // Refetch attempts when returning to landing view
    useEffect(() => {
        if (view === "landing") {
            refetch()
        }
    }, [view, refetch])

    if (view === "exam") {
        return <EmbeddedExam examId={exam.id} onExit={() => setView("landing")} isRetake={hasAttempted && !activeAttempt} />
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
        <div className="bg-card dark:bg-card rounded-xl border border-border p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex-1 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">{exam.title}</h2>
                        <p className="text-muted-foreground">{exam.description || "Test your knowledge with this quiz."}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <FileQuestion className="w-5 h-5 text-primary" />
                            <span className="font-medium">{questionsCount} questions</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="font-medium">{exam.duration_minutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <ListChecks className="w-5 h-5 text-primary" />
                            <span className={`font-medium ${limit && attemptsLeft === 0 ? "text-destructive" : ""}`}>
                                {limit ? `${attemptsLeft} of ${limit} Attempts left` : "Unlimited Attempts"}
                            </span>
                        </div>
                    </div>

                    {/* Attempts History */}
                    {(completedAttempts.length > 0 || activeAttempt) && (
                        <div className="mt-6 border-t border-border pt-6">
                            <h3 className="font-semibold mb-4 text-foreground">Your Attempts</h3>
                            <div className="space-y-3">
                                {/* Show active attempt first if exists */}
                                {activeAttempt && (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                                {completedAttempts.length + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-foreground">
                                                    Attempt {completedAttempts.length + 1}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    In Progress • Started {new Date(activeAttempt.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleStart}
                                            className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                                        >
                                            Resume
                                        </Button>
                                    </div>
                                )}

                                {/* Show completed attempts */}
                                {completedAttempts.map((attempt, idx) => {
                                    const resultData = Array.isArray(attempt.result) ? attempt.result[0] : attempt.result
                                    return (
                                        <div key={attempt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {completedAttempts.length - idx}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-foreground">
                                                        Attempt {completedAttempts.length - idx}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
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
                        {(limit === null || limit === undefined || attemptsLeft > 0 || activeAttempt) && (
                            <Button
                                onClick={handleStart}
                                className={activeAttempt ? "bg-primary hover:bg-primary/90 text-primary-foreground" : (hasAttempted ? "bg-background border border-border text-foreground hover:bg-muted" : "bg-primary hover:bg-primary/90 text-primary-foreground")}
                            >
                                {activeAttempt ? "Resume Exam" : (hasAttempted ? "Retake Exam" : "Start Exam")}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="hidden md:block w-1/3">
                    <div className="aspect-square bg-primary/10 rounded-full flex items-center justify-center">
                        <Trophy className="w-24 h-24 text-primary/40" />
                    </div>
                </div>
            </div>
        </div>
    )
}
