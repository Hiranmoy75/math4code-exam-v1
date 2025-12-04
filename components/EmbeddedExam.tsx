"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { awardCoins } from "@/app/actions/rewardActions"
import { useExamSession, useSubmitExam, useSaveAnswer, useUpdateTimer } from "@/hooks/student/useExamSession"
import { useExamResult } from "@/hooks/useExamResult"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Clock, CheckCircle2, Loader2, ArrowLeft, Flag, TrendingUp, Award, Target, BarChart3,
    Menu, X, AlertTriangle, Save, ListChecks, Maximize, Minimize, PauseCircle
} from "lucide-react"
import { renderWithLatex } from "@/lib/renderWithLatex"
import { useRouter } from "next/navigation"
import { useLessonContext } from "@/context/LessonContext"

interface EmbeddedExamProps {
    examId: string
    onExit?: () => void
}

interface QuizResult {
    id: string
    score: number
    total_marks: number
    percentage: number
    passed: boolean
    time_taken: number
    correct_answers: number
    wrong_answers: number
    unattempted: number
}

// Component to show detailed question analysis
function QuestionAnalysisView({
    structured,
    responseMap,
    onBack
}: {
    structured: any[],
    responseMap: Record<string, any>,
    onBack: () => void
}) {
    const [activeSectionIdx, setActiveSectionIdx] = useState(0)

    const allQuestions = structured.flatMap(s => s.questions)
    const activeSection = structured[activeSectionIdx]

    return (
        <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm flex flex-col h-[80vh]">
            {/* Header */}
            <div className="bg-card border-b border-border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground px-0 md:px-3">
                        <ArrowLeft className="w-4 h-4 mr-2" /> <span className="hidden md:inline">Back to Result</span><span className="md:hidden">Back</span>
                    </Button>
                    <h2 className="text-lg font-bold text-foreground truncate">Question Analysis</h2>
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {structured.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSectionIdx(i)}
                            className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${activeSectionIdx === i
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {s.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {activeSection?.questions.map((q: any, idx: number) => {
                    const userAns = responseMap[q.id]
                    const isCorrect = checkAnswer(q, userAns)
                    const isSkipped = userAns === undefined || userAns === null || (Array.isArray(userAns) && userAns.length === 0)

                    return (
                        <div key={q.id} className={`p-4 md:p-6 rounded-xl border ${isCorrect ? "border-emerald-500/30 bg-emerald-500/5" :
                            isSkipped ? "border-border bg-muted/20" :
                                "border-rose-500/30 bg-rose-500/5"
                            }`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                        Q{idx + 1}
                                    </span>
                                    {isCorrect && <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Correct</span>}
                                    {!isCorrect && !isSkipped && <span className="text-xs font-bold text-rose-500 flex items-center gap-1"><X className="w-3 h-3" /> Incorrect</span>}
                                    {isSkipped && <span className="text-xs font-bold text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Skipped</span>}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Marks: {isCorrect ? `+${q.marks}` : isSkipped ? "0" : `-${q.negative_marks}`}
                                </div>
                            </div>

                            <div className="text-base text-foreground mb-6">
                                {renderWithLatex(q.question_text)}
                            </div>

                            <div className="space-y-2 mb-6">
                                {q.options?.map((opt: any) => {
                                    const isSelected = isOptionSelected(q, opt.id, userAns)
                                    const isRightOption = isOptionCorrect(q, opt.id)

                                    let optClass = "border-border bg-muted/30 text-muted-foreground"
                                    if (isRightOption) optClass = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500"
                                    else if (isSelected && !isRightOption) optClass = "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500"

                                    return (
                                        <div key={opt.id} className={`p-3 rounded-lg border flex items-center gap-3 ${optClass}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isRightOption ? "bg-emerald-500 text-white" :
                                                isSelected ? "bg-rose-500 text-white" :
                                                    "border border-muted-foreground/30"
                                                }`}>
                                                {isRightOption ? <CheckCircle2 className="w-3 h-3" /> : isSelected ? <X className="w-3 h-3" /> : String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="text-sm">{renderWithLatex(opt.option_text)}</span>
                                        </div>
                                    )
                                })}
                                {q.question_type === "NAT" && (
                                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                                        <div className="text-sm text-muted-foreground mb-1">Correct Answer: <span className="text-emerald-500 font-mono">{q.correct_answer}</span></div>
                                        <div className="text-sm text-muted-foreground">Your Answer: <span className={`${isCorrect ? "text-emerald-500" : "text-rose-500"} font-mono`}>{userAns ?? "N/A"}</span></div>
                                    </div>
                                )}
                            </div>

                            {q.explanation && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-blue-500 mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Explanation
                                    </h4>
                                    <div className="text-sm text-foreground/90">
                                        {renderWithLatex(q.explanation)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// Helper functions for analysis
function checkAnswer(q: any, ans: any) {
    if (ans === undefined || ans === null || (Array.isArray(ans) && ans.length === 0)) return false
    if (q.question_type === "NAT") return Number(ans) === Number(q.correct_answer)
    if (q.question_type === "MCQ") {
        const correctOpt = q.options.find((o: any) => o.is_correct)?.id
        return ans === correctOpt
    }
    if (q.question_type === "MSQ") {
        const correctIds = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id).sort()
        const ansIds = (Array.isArray(ans) ? ans : [ans]).sort()
        return correctIds.length === ansIds.length && correctIds.every((x: string, i: number) => x === ansIds[i])
    }
    return false
}

function isOptionSelected(q: any, optId: string, ans: any) {
    if (!ans) return false
    if (q.question_type === "MCQ") return ans === optId
    if (q.question_type === "MSQ") return (Array.isArray(ans) ? ans : [ans]).includes(optId)
    return false
}

function isOptionCorrect(q: any, optId: string) {
    return q.options?.find((o: any) => o.id === optId)?.is_correct
}

export function PreviousResultView({
    examId,
    userId,
    onRetake,
    attemptId,
    initialResult
}: {
    examId: string,
    userId: string,
    onRetake: () => void,
    attemptId?: string,
    initialResult?: any
}) {
    const [effectiveAttemptId, setEffectiveAttemptId] = useState<string | null>(attemptId || null)
    const [showAnalysis, setShowAnalysis] = useState(false)
    const supabase = createClient()

    // If no attemptId provided, fetch the latest one
    useEffect(() => {
        if (attemptId) {
            setEffectiveAttemptId(attemptId)
            return
        }

        const fetchLatestAttempt = async () => {
            const { data: attempts } = await supabase
                .from("exam_attempts")
                .select("id")
                .eq("exam_id", examId)
                .eq("student_id", userId)
                .eq("status", "submitted")
                .order("created_at", { ascending: false })
                .limit(1)

            if (attempts && attempts.length > 0) {
                setEffectiveAttemptId(attempts[0].id)
            }
        }

        fetchLatestAttempt()
    }, [examId, userId, attemptId, supabase])

    const { data: resultData, isLoading } = useExamResult(effectiveAttemptId || "")

    if (isLoading || !effectiveAttemptId) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!resultData || !resultData.result) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center p-8 bg-card rounded-xl border border-border">
                    <h3 className="text-lg font-bold text-amber-500 mb-2">Result Not Found</h3>
                    <p className="text-muted-foreground text-sm mb-4">Could not find the result for this attempt.</p>
                    <Button onClick={onRetake} className="bg-primary hover:bg-primary/90">
                        Retake Quiz
                    </Button>
                </div>
            </div>
        )
    }

    const { result, structured, responseMap, attempt } = resultData
    const passed = result.passed ?? (result.percentage >= 40)

    // Check visibility settings
    const examSettings = attempt?.exams
    const visibility = examSettings?.result_visibility || "immediate"
    const releaseTime = examSettings?.result_release_time
    const showAnswers = examSettings?.show_answers ?? true

    const isResultVisible = () => {
        if (visibility === "immediate") return true
        if (visibility === "manual") return false
        if (visibility === "scheduled" && releaseTime) {
            return new Date() >= new Date(releaseTime)
        }
        return false
    }

    if (!isResultVisible()) {
        return (
            <div className="bg-background rounded-xl border border-border p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Results Not Yet Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    {visibility === "scheduled" && releaseTime
                        ? `The results for this exam will be released on ${new Date(releaseTime).toLocaleString()}.`
                        : "The instructor has not released the results for this exam yet."}
                </p>
                <Button onClick={onRetake} variant="outline" className="border-border text-foreground hover:bg-muted">
                    Back to Exam
                </Button>
            </div>
        )
    }

    if (showAnalysis) {
        return <QuestionAnalysisView structured={structured} responseMap={responseMap} onBack={() => setShowAnalysis(false)} />
    }

    return (
        <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 text-center">
                <Award className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Quiz Result</h2>
                <p className="text-indigo-100">
                    Attempted on {new Date(result.created_at).toLocaleDateString()}
                </p>
            </div>

            <div className="p-4 md:p-6 space-y-6">
                {/* Score Card */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-3 md:p-4 rounded-xl border border-blue-700 text-center">
                        <Target className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-blue-400" />
                        <div className="text-xl md:text-2xl font-bold text-blue-300">{result.score ?? result.obtained_marks ?? 0}</div>
                        <div className="text-xs text-blue-400 font-medium">Score</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-3 md:p-4 rounded-xl border border-purple-700 text-center">
                        <TrendingUp className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-purple-400" />
                        <div className="text-xl md:text-2xl font-bold text-purple-300">{result.percentage?.toFixed(1) || 0}%</div>
                        <div className="text-xs text-purple-400 font-medium">Percentage</div>
                    </div>
                    <div className={`bg-gradient-to-br p-3 md:p-4 rounded-xl border text-center col-span-2 md:col-span-1 ${passed ? 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/50' : 'from-amber-500/20 to-amber-600/20 border-amber-500/50'}`}>
                        {passed ? (
                            <>
                                <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-emerald-500" />
                                <div className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">Passed</div>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-amber-500" />
                                <div className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">Not Passed</div>
                            </>
                        )}
                        <div className="text-xs text-muted-foreground font-medium">Status</div>
                    </div>
                </div>

                {/* Section Analysis */}
                {structured && structured.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Section Analysis
                        </h3>
                        <div className="grid gap-4">
                            {structured.map((section: any) => {
                                const secResult = section.result
                                const totalQuestions = section.questions.length

                                return (
                                    <div key={section.id} className="bg-card p-4 rounded-xl border border-border">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-medium text-foreground">{section.title}</h4>
                                            <span className="text-xs text-muted-foreground">{totalQuestions} Questions</span>
                                        </div>

                                        {secResult ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div className="bg-muted/50 p-2 rounded-lg border border-border">
                                                    <div className="text-muted-foreground text-xs">Score</div>
                                                    <div className="font-semibold text-blue-500">{secResult.obtained_marks} / {secResult.total_marks}</div>
                                                </div>
                                                <div className="bg-muted/50 p-2 rounded-lg border border-border">
                                                    <div className="text-muted-foreground text-xs">Correct</div>
                                                    <div className="font-semibold text-emerald-500">{secResult.correct_answers}</div>
                                                </div>
                                                <div className="bg-muted/50 p-2 rounded-lg border border-border">
                                                    <div className="text-muted-foreground text-xs">Wrong</div>
                                                    <div className="font-semibold text-rose-500">{secResult.wrong_answers}</div>
                                                </div>
                                                <div className="bg-muted/50 p-2 rounded-lg border border-border">
                                                    <div className="text-muted-foreground text-xs">Unanswered</div>
                                                    <div className="font-semibold text-muted-foreground">{secResult.unanswered}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground italic">
                                                No detailed result available for this section.
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                    {showAnswers && (
                        <Button
                            onClick={() => setShowAnalysis(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <ListChecks className="w-4 h-4 mr-2" />
                            Review Questions
                        </Button>
                    )}
                    <Button
                        onClick={onRetake}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        <Flag className="w-4 w-4 mr-2" />
                        Retake Quiz
                    </Button>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="border-border text-foreground hover:bg-muted"
                    >
                        Continue Learning
                    </Button>
                </div>
            </div>
        </div>
    )
}

interface EmbeddedExamProps {
    examId: string
    onExit?: () => void
    isRetake?: boolean
}

export function EmbeddedExam({ examId, onExit, isRetake = false }: EmbeddedExamProps) {
    const queryClient = useQueryClient()
    const supabase = createClient()
    const router = useRouter()
    const examContainerRef = React.useRef<HTMLDivElement>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [responses, setResponses] = useState<Record<string, any>>({})
    const [marked, setMarked] = useState<Record<string, boolean>>({})
    const [visited, setVisited] = useState<Record<string, boolean>>({})
    const [activeQuestionIdx, setActiveQuestionIdx] = useState(0)
    const [secondsLeft, setSecondsLeft] = useState(0)
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [isTimerActive, setIsTimerActive] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [paletteOpenMobile, setPaletteOpenMobile] = useState(false)
    const [retakeAttempt, setRetakeAttempt] = useState(isRetake ? 1 : 0)
    const [submittedAttemptId, setSubmittedAttemptId] = useState<string | null>(null)
    const [showPauseDialog, setShowPauseDialog] = useState(false)
    const [isPausing, setIsPausing] = useState(false)
    const { markComplete } = useLessonContext()

    // Auth check
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push("/auth/login")
            setUserId(user.id)
        }
        checkUser()
    }, [router, supabase])

    const { data: sessionData, isLoading, error } = useExamSession(examId, userId, retakeAttempt > 0, !showResults)
    const { mutate: submitExam, isPending: isSubmitting } = useSubmitExam()
    const { mutate: saveAnswer, isPending: isSaving } = useSaveAnswer()
    const { mutate: updateTimer } = useUpdateTimer()

    // Initialize session
    useEffect(() => {
        if (!sessionData) return

        if (sessionData.previousResponses) {
            setResponses(sessionData.previousResponses)
            const newVisited: Record<string, boolean> = {}
            Object.keys(sessionData.previousResponses).forEach(k => newVisited[k] = true)
            setVisited(newVisited)
        }

        const totalDuration = sessionData.exam.duration_minutes * 60
        const timeSpent = sessionData.attempt.total_time_spent || 0
        const remaining = Math.max(0, totalDuration - timeSpent)
        setSecondsLeft(remaining)
        setIsTimerActive(true)
    }, [sessionData])

    // Timer
    useEffect(() => {
        if (!isTimerActive || secondsLeft <= 0) return

        const timer = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    handleAutoSubmit()
                    return 0
                }
                return s - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isTimerActive, secondsLeft])

    // Fullscreen handler
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const toggleFullscreen = async () => {
        if (!examContainerRef.current) return

        if (!document.fullscreenElement) {
            try {
                await examContainerRef.current.requestFullscreen()
            } catch (err) {
                console.error("Error attempting to enable fullscreen:", err)
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen()
            }
        }
    }

    const handlePauseAndExit = () => {
        setShowPauseDialog(true)
    }

    const confirmPauseAndExit = async () => {
        setIsPausing(true)
        try {
            if (sessionData?.attempt?.id) {
                // Wait for timer update to complete
                await new Promise<void>((resolve, reject) => {
                    updateTimer(
                        { attemptId: sessionData.attempt.id, timeSpent: sessionData.exam.duration_minutes * 60 - secondsLeft },
                        {
                            onSuccess: () => resolve(),
                            onError: (error) => reject(error)
                        }
                    )
                })
            }

            // Invalidate queries to ensure fresh data on return
            await queryClient.invalidateQueries({ queryKey: ["exam-attempts", examId, userId] })
            await queryClient.invalidateQueries({ queryKey: ["exam-session"] })

            setShowPauseDialog(false)
            if (onExit) onExit()
        } catch (error) {
            console.error("Error pausing exam:", error)
            toast.error("Failed to save progress")
        } finally {
            setIsPausing(false)
        }
    }

    const allQuestions = sessionData?.sections.flatMap((s) => s.questions) || []
    const currentQuestion = allQuestions[activeQuestionIdx]

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0")
        const sec = (s % 60).toString().padStart(2, "0")
        return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`
    }

    const handleSaveResponse = (qid: string, ans: any) => {
        setResponses((r) => ({ ...r, [qid]: ans }))
        setVisited((v) => ({ ...v, [qid]: true }))

        if (sessionData?.attempt?.id) {
            saveAnswer({ attemptId: sessionData.attempt.id, questionId: qid, answer: ans })
        }
    }

    const nextQuestion = () => {
        if (activeQuestionIdx < allQuestions.length - 1) setActiveQuestionIdx((i) => i + 1)
    }

    const prevQuestion = () => {
        if (activeQuestionIdx > 0) setActiveQuestionIdx((i) => i - 1)
    }

    const qStatus = (q: any) => {
        if (!visited[q.id]) return "notVisited"
        const a = responses[q.id]
        if (Array.isArray(a)) return a.length ? "answered" : "visited"
        return a ? "answered" : "visited"
    }

    const handleAutoSubmit = () => {
        toast.info("Time's up! Submitting quiz...")
        performSubmit()
    }

    const performSubmit = async () => {
        if (!sessionData?.attempt?.id || !sessionData?.exam) return

        submitExam({
            attemptId: sessionData.attempt.id,
            examId: sessionData.exam.id,
            responses: responses,
            sections: sessionData.sections,
            totalMarks: sessionData.exam.total_marks || 0
        }, {
            onSuccess: async (result: any) => {
                toast.success("Quiz submitted successfully!")
                setIsTimerActive(false)
                setShowSubmitDialog(false)

                // Wait a moment for database to update
                await new Promise(resolve => setTimeout(resolve, 500))

                // Check if results should be shown immediately
                const { data: examData } = await supabase
                    .from("exams")
                    .select("result_visibility")
                    .eq("id", examId)
                    .single()

                if (userId) {
                    const rewardRes = await awardCoins(userId, 'quiz_completion', examId, `Completed quiz: ${sessionData.exam.title}`);
                    if (rewardRes.success && rewardRes.message) {
                        toast.success(rewardRes.message, { icon: "🪙" });
                    }
                    // Mark lesson complete via context
                    markComplete();
                }

                if (examData?.result_visibility === "immediate") {
                    setSubmittedAttemptId(sessionData.attempt.id)
                    setShowResults(true)
                } else {
                    toast.info("Results will be available once the instructor releases them")
                    if (onExit) onExit()
                }
            },
            onError: (error: any) => {
                console.error("Submission error:", error)
                toast.error("Failed to submit quiz. Please try again.")
                setShowSubmitDialog(false)
            }
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96 text-slate-500">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p>Loading Quiz...</p>
                </div>
            </div>
        )
    }

    if (error || (!sessionData && !isLoading)) {
        const errorMessage = (error as Error)?.message || "Unknown error"
        const isAlreadySubmitted = errorMessage.includes("already been submitted")

        // If already submitted, try to fetch the previous result
        if (isAlreadySubmitted && userId) {
            return <PreviousResultView
                examId={examId}
                userId={userId}
                onRetake={() => {
                    queryClient.invalidateQueries({ queryKey: ["exam-session"] })
                    setRetakeAttempt(prev => prev + 1)
                }}
            />
        }

        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center p-8 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800">
                    <h3 className="text-lg font-bold text-rose-900 dark:text-rose-400 mb-2">Failed to Load Quiz</h3>
                    <p className="text-rose-700 dark:text-rose-500 text-sm">{errorMessage}</p>
                </div>
            </div>
        )
    }

    // Show Results View
    if (showResults && submittedAttemptId && userId) {
        return (
            <PreviousResultView
                examId={examId}
                userId={userId}
                attemptId={submittedAttemptId}
                onRetake={() => {
                    queryClient.invalidateQueries({ queryKey: ["exam-session"] })
                    setShowResults(false)
                    setSubmittedAttemptId(null)
                    setRetakeAttempt(prev => prev + 1)
                }}
            />
        )
    }

    // Quiz Interface - Dark theme with collapsible sidebar
    if (!sessionData) return null

    return (
        <div ref={examContainerRef} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] bg-background text-foreground rounded-xl overflow-hidden border border-border h-full">
            {/* LEFT PANEL */}
            <div className="p-3 md:p-6 relative bg-background">
                {/* HEADER NAV */}
                <div className="bg-card border border-border py-3 px-3 md:px-4 rounded-xl flex flex-wrap items-center justify-between gap-2 md:gap-3 shadow-sm mb-4">
                    <div className="flex flex-col flex-1 min-w-0">
                        <h2 className="text-base md:text-lg font-bold text-primary truncate">{sessionData.exam.title}</h2>
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                            {sessionData.sections.map((s, i) => {
                                const startIdx = sessionData.sections.slice(0, i).reduce((a, b) => a + b.questions.length, 0)
                                const isActive = activeQuestionIdx >= startIdx && activeQuestionIdx < startIdx + s.questions.length
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setActiveQuestionIdx(startIdx)}
                                        className={`px-2 md:px-3 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${isActive
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                            }`}
                                    >
                                        {s.title}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Saving Indicator */}
                        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-3 h-3" />
                                    Saved
                                </>
                            )}
                        </div>

                        <div className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 rounded-full border text-xs md:text-sm ${secondsLeft < 300 ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}`}>
                            <Clock className={`w-3 h-3 md:w-4 md:h-4 ${secondsLeft < 300 ? 'text-rose-500' : 'text-emerald-500'}`} />
                            <div className="font-semibold tabular-nums">{formatTime(secondsLeft)}</div>
                        </div>
                        <button
                            onClick={() => setShowSubmitDialog(true)}
                            className="hidden sm:block bg-rose-600 hover:bg-rose-700 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors shadow-sm"
                        >
                            Submit
                        </button>
                        <button
                            onClick={handlePauseAndExit}
                            className="hidden sm:flex items-center gap-2 bg-muted hover:bg-muted/80 text-muted-foreground px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors shadow-sm"
                        >
                            <PauseCircle className="w-4 h-4" />
                            <span className="hidden lg:inline">Pause & Exit</span>
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setPaletteOpenMobile(true)}
                            className="block lg:hidden bg-primary text-primary-foreground px-2 md:px-3 py-1.5 md:py-2 rounded-md text-sm"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* QUESTION CARD */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion?.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 md:p-6 bg-card rounded-2xl shadow-sm border border-border"
                    >
                        <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                            <div className="text-xs md:text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                Question {activeQuestionIdx + 1}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground">
                                Marks: <span className="font-semibold text-emerald-500">+{currentQuestion?.marks}</span> |
                                Negative: <span className="font-semibold text-rose-500">-{currentQuestion?.negative_marks}</span>
                            </div>
                        </div>

                        <div className="text-base md:text-lg font-medium mb-6 leading-relaxed text-foreground">
                            {renderWithLatex(currentQuestion?.question_text)}
                        </div>

                        {/* OPTIONS */}
                        <div className="space-y-3">
                            {currentQuestion?.question_type === "MCQ" &&
                                currentQuestion?.options?.map((opt, idx) => {
                                    const chosen = responses[currentQuestion.id] === opt.id
                                    const optionLabel = String.fromCharCode(65 + idx)
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleSaveResponse(currentQuestion.id, opt.id)}
                                            className={`w-full text-left p-3 md:p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 md:gap-4 group ${chosen
                                                ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary"
                                                : "bg-muted/30 border-border hover:border-primary hover:bg-muted/50"
                                                }`}
                                        >
                                            <div
                                                className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs md:text-sm font-bold transition-colors ${chosen
                                                    ? "bg-primary text-primary-foreground"
                                                    : "border border-muted-foreground/30 text-muted-foreground group-hover:border-primary group-hover:text-primary"
                                                    }`}
                                            >
                                                {optionLabel}
                                            </div>
                                            <span className="text-sm md:text-base text-foreground group-hover:text-foreground">{renderWithLatex(opt.option_text)}</span>
                                        </button>
                                    )
                                })}

                            {currentQuestion?.question_type === "MSQ" &&
                                currentQuestion?.options?.map((opt, idx) => {
                                    const current = (responses[currentQuestion.id] || []) as string[]
                                    const checked = current.includes(opt.id)
                                    const optionLabel = String.fromCharCode(65 + idx)
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                const next = checked
                                                    ? current.filter((x) => x !== opt.id)
                                                    : [...current, opt.id]
                                                handleSaveResponse(currentQuestion.id, next)
                                            }}
                                            className={`w-full text-left p-3 md:p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 md:gap-4 group ${checked
                                                ? "bg-amber-500/10 border-amber-500 shadow-sm ring-1 ring-amber-500"
                                                : "bg-muted/30 border-border hover:border-amber-500 hover:bg-muted/50"
                                                }`}
                                        >
                                            <div
                                                className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-xs md:text-sm font-bold transition-colors ${checked ? "bg-amber-500 text-white" : "border border-muted-foreground/30 text-muted-foreground group-hover:border-amber-500"
                                                    }`}
                                            >
                                                {optionLabel}
                                            </div>
                                            <span className="text-sm md:text-base text-foreground group-hover:text-foreground">{renderWithLatex(opt.option_text)}</span>
                                        </button>
                                    )
                                })}

                            {currentQuestion?.question_type === "NAT" && (
                                <div className="mt-2">
                                    <label className="block text-sm font-medium text-foreground mb-2">Your Answer:</label>
                                    <input
                                        type="number"
                                        className="w-full max-w-md p-3 rounded-lg border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm md:text-base"
                                        placeholder="Enter numeric value..."
                                        value={responses[currentQuestion.id] || ""}
                                        onChange={(e) => handleSaveResponse(currentQuestion.id, e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-border flex flex-wrap justify-between items-center gap-2 md:gap-3">
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={prevQuestion}
                                    disabled={activeQuestionIdx === 0}
                                    className="px-3 md:px-4 py-1.5 md:py-2 border border-border text-foreground rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-xs md:text-sm"
                                >
                                    <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> Previous
                                </button>
                                <button
                                    onClick={() => handleSaveResponse(currentQuestion.id, null)}
                                    className="px-3 md:px-4 py-1.5 md:py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-xs md:text-sm"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        setMarked((m) => ({ ...m, [currentQuestion.id]: !m[currentQuestion.id] }))
                                        nextQuestion()
                                    }}
                                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg flex items-center gap-2 transition-colors text-xs md:text-sm ${marked[currentQuestion.id]
                                        ? "bg-amber-500 text-white hover:bg-amber-600"
                                        : "border border-amber-500 text-amber-500 hover:bg-amber-500/10"
                                        }`}
                                >
                                    <Flag className="w-3 h-3 md:w-4 md:h-4" /> {marked[currentQuestion.id] ? "Marked" : "Mark"}
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={nextQuestion}
                                    className="px-4 md:px-6 py-1.5 md:py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-colors text-xs md:text-sm"
                                >
                                    Save & Next
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* RIGHT PALETTE (Desktop) */}
            <div className="hidden lg:flex flex-col bg-card border-l border-border overflow-hidden">
                <div className="p-5 border-b border-border">
                    <h4 className="font-bold text-foreground">Question Palette</h4>
                    <div className="flex gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500"></div> Answered</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-500"></div> Marked</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-primary/30 border border-primary"></div> Visited</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <div className="grid grid-cols-5 gap-2">
                        {allQuestions.map((q, i) => {
                            const status = qStatus(q)
                            const isMarked = marked[q.id]
                            let cls = "bg-muted text-muted-foreground hover:bg-muted/80"

                            if (status === "answered") cls = "bg-emerald-500 text-white shadow-sm"
                            else if (isMarked) cls = "bg-amber-500 text-white shadow-sm"
                            else if (status === "visited") cls = "bg-primary/30 text-primary border border-primary"

                            if (activeQuestionIdx === i) cls += " ring-2 ring-offset-1 ring-offset-card ring-primary"

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setActiveQuestionIdx(i)}
                                    className={`h-10 w-full rounded-lg text-sm font-semibold transition-all ${cls}`}
                                >
                                    {i + 1}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="p-5 border-t border-border bg-background">
                    <button
                        onClick={() => setShowSubmitDialog(true)}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold shadow-sm transition-colors"
                    >
                        Submit Exam
                    </button>
                </div>
            </div>

            {/* MOBILE PALETTE DRAWER */}
            <AnimatePresence>
                {paletteOpenMobile && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPaletteOpenMobile(false)}
                            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 z-50 w-80 bg-card shadow-2xl border-l border-border lg:hidden flex flex-col"
                        >
                            <div className="p-4 flex items-center justify-between border-b border-border">
                                <h4 className="font-bold text-foreground">Question Palette</h4>
                                <button onClick={() => setPaletteOpenMobile(false)} className="p-2 hover:bg-muted rounded-full">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="grid grid-cols-5 gap-2">
                                    {allQuestions.map((q, i) => {
                                        const status = qStatus(q)
                                        const isMarked = marked[q.id]
                                        let cls = "bg-muted text-muted-foreground"

                                        if (status === "answered") cls = "bg-emerald-500 text-white"
                                        else if (isMarked) cls = "bg-amber-500 text-white"
                                        else if (status === "visited") cls = "bg-primary/30 text-primary border border-primary"

                                        if (activeQuestionIdx === i) cls += " ring-2 ring-offset-1 ring-offset-card ring-primary"

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => {
                                                    setActiveQuestionIdx(i)
                                                    setPaletteOpenMobile(false)
                                                }}
                                                className={`h-10 w-full rounded-lg text-sm font-semibold transition-all ${cls}`}
                                            >
                                                {i + 1}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="p-4 border-t border-border">
                                <button
                                    onClick={() => {
                                        setPaletteOpenMobile(false)
                                        setShowSubmitDialog(true)
                                    }}
                                    className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold"
                                >
                                    Submit Exam
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* SUBMIT CONFIRMATION DIALOG */}
            <AnimatePresence>
                {showSubmitDialog && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSubmitDialog(false)}
                            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden"
                            >
                                <div className="p-6 text-center">
                                    <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Submit Exam?</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Are you sure you want to submit? You won't be able to change your answers after this.
                                    </p>

                                    <div className="bg-muted/50 rounded-lg p-4 mb-6 text-sm">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-muted-foreground">Answered</span>
                                            <span className="text-emerald-500 font-semibold">
                                                {Object.values(responses).filter(v => v !== null && (Array.isArray(v) ? v.length > 0 : true)).length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-muted-foreground">Marked for Review</span>
                                            <span className="text-amber-500 font-semibold">
                                                {Object.values(marked).filter(Boolean).length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Unanswered</span>
                                            <span className="text-foreground font-semibold">
                                                {allQuestions.length - Object.values(responses).filter(v => v !== null && (Array.isArray(v) ? v.length > 0 : true)).length}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowSubmitDialog(false)}
                                            className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={performSubmit}
                                            disabled={isSubmitting}
                                            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-lg shadow-rose-900/20 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                "Submit Now"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* PAUSE CONFIRMATION DIALOG */}
            <AnimatePresence>
                {showPauseDialog && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPauseDialog(false)}
                            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden"
                            >
                                <div className="p-6 text-center">
                                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <PauseCircle className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Pause & Exit?</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Your progress will be saved and you can resume this exam later.
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowPauseDialog(false)}
                                            className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmPauseAndExit}
                                            disabled={isPausing}
                                            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg shadow-amber-900/20 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isPausing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <PauseCircle className="w-4 h-4" />
                                                    Pause & Exit
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
