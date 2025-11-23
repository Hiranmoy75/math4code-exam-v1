"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useExamSession, useSubmitExam, useSaveAnswer, useUpdateTimer } from "@/hooks/student/useExamSession"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Clock, CheckCircle2, Loader2, ArrowLeft, Flag, TrendingUp, Award, Target, BarChart3,
    Menu, X, AlertTriangle, Save
} from "lucide-react"
import { renderWithLatex } from "@/lib/renderWithLatex"
import { useRouter } from "next/navigation"

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

// Component to show previous result when exam is already submitted
function PreviousResultView({ examId, userId, onRetake }: { examId: string, userId: string, onRetake: () => void }) {
    const [result, setResult] = useState<any>(null)
    const [exam, setExam] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchPreviousResult = async () => {
            try {
                // Get the most recent attempt
                const { data: attempts } = await supabase
                    .from("exam_attempts")
                    .select("id, submitted_at")
                    .eq("exam_id", examId)
                    .eq("user_id", userId)
                    .eq("status", "submitted")
                    .order("submitted_at", { ascending: false })
                    .limit(1)

                if (attempts && attempts.length > 0) {
                    // Get the result for this attempt
                    const { data: resultData } = await supabase
                        .from("results")
                        .select("*")
                        .eq("attempt_id", attempts[0].id)
                        .single()

                    setResult(resultData)
                }

                // Get exam details
                const { data: examData } = await supabase
                    .from("exams")
                    .select("*")
                    .eq("id", examId)
                    .single()

                setExam(examData)
            } catch (error) {
                console.error("Error fetching previous result:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPreviousResult()
    }, [examId, userId, supabase])

    const handleRetake = () => {
        onRetake()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!result || !exam) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center p-8 bg-[#161b22] rounded-xl border border-slate-800">
                    <h3 className="text-lg font-bold text-amber-400 mb-2">Quiz Already Completed</h3>
                    <p className="text-slate-400 text-sm mb-4">You have already submitted this quiz.</p>
                    <Button onClick={handleRetake} className="bg-indigo-600 hover:bg-indigo-700">
                        Retake Quiz
                    </Button>
                </div>
            </div>
        )
    }

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0")
        const sec = (seconds % 60).toString().padStart(2, "0")
        return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`
    }

    return (
        <div className="bg-[#0d1117] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 text-center">
                <Award className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Quiz Result</h2>
                <p className="text-indigo-100">You have already completed this quiz</p>
            </div>

            <div className="p-4 md:p-6 space-y-6">
                {/* Score Card */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-3 md:p-4 rounded-xl border border-blue-700 text-center">
                        <Target className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-blue-400" />
                        <div className="text-xl md:text-2xl font-bold text-blue-300">{result.score || 0}</div>
                        <div className="text-xs text-blue-400 font-medium">Score</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-3 md:p-4 rounded-xl border border-purple-700 text-center">
                        <TrendingUp className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-purple-400" />
                        <div className="text-xl md:text-2xl font-bold text-purple-300">{result.percentage?.toFixed(1) || 0}%</div>
                        <div className="text-xs text-purple-400 font-medium">Percentage</div>
                    </div>
                    <div className={`bg-gradient-to-br p-3 md:p-4 rounded-xl border text-center col-span-2 md:col-span-1 ${result.passed ? 'from-green-900/50 to-green-800/50 border-green-700' : 'from-amber-900/50 to-amber-800/50 border-amber-700'}`}>
                        {result.passed ? (
                            <>
                                <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-green-400" />
                                <div className="text-xl md:text-2xl font-bold text-green-300">Passed</div>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-amber-400" />
                                <div className="text-xl md:text-2xl font-bold text-amber-300">Not Passed</div>
                            </>
                        )}
                        <div className="text-xs text-slate-400 font-medium">Status</div>
                    </div>
                </div>

                {/* Pass/Fail Message */}
                <div className={`p-4 rounded-xl border-2 text-center ${result.passed ? 'bg-green-900/20 border-green-600' : 'bg-amber-900/20 border-amber-600'}`}>
                    <div className={`text-base md:text-lg font-bold ${result.passed ? 'text-green-400' : 'text-amber-400'}`}>
                        {result.passed ? '🎉 Congratulations! You Passed!' : '📚 Try Again to Improve!'}
                    </div>
                    <p className={`text-xs md:text-sm mt-1 ${result.passed ? 'text-green-300' : 'text-amber-300'}`}>
                        {result.passed
                            ? 'You have successfully completed this quiz.'
                            : 'Review the material and retake the quiz to improve your score.'}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                    <Button
                        onClick={handleRetake}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Flag className="w-4 w-4 mr-2" />
                        Retake Quiz
                    </Button>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                        Continue Learning
                    </Button>
                </div>
            </div>
        </div>
    )
}

export function EmbeddedExam({ examId, onExit }: EmbeddedExamProps) {
    const supabase = createClient()
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [responses, setResponses] = useState<Record<string, any>>({})
    const [marked, setMarked] = useState<Record<string, boolean>>({})
    const [visited, setVisited] = useState<Record<string, boolean>>({})
    const [activeQuestionIdx, setActiveQuestionIdx] = useState(0)
    const [secondsLeft, setSecondsLeft] = useState(0)
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [isTimerActive, setIsTimerActive] = useState(false)
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
    const [showResults, setShowResults] = useState(false)
    const [paletteOpenMobile, setPaletteOpenMobile] = useState(false)
    const [retakeAttempt, setRetakeAttempt] = useState(0) // Track retake attempts

    // Auth check
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push("/auth/login")
            setUserId(user.id)
        }
        checkUser()
    }, [router, supabase])

    const { data: sessionData, isLoading, error } = useExamSession(examId, userId, retakeAttempt > 0)
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
                    .select("show_results_immediately")
                    .eq("id", examId)
                    .single()

                if (examData?.show_results_immediately !== false) {
                    // Fetch detailed result
                    const { data: resultData } = await supabase
                        .from("results")
                        .select("*")
                        .eq("id", result.id)
                        .single()

                    if (resultData) {
                        const totalQuestions = allQuestions.length
                        const answered = Object.values(responses).filter(v => v !== null && (Array.isArray(v) ? v.length > 0 : true)).length

                        // Calculate correct answers based on score ratio
                        const scoreRatio = resultData.total_marks > 0 ? (resultData.score / resultData.total_marks) : 0
                        const correctAnswers = Math.max(0, Math.round(scoreRatio * totalQuestions))
                        const wrongAnswers = Math.max(0, answered - correctAnswers)
                        const unattempted = Math.max(0, totalQuestions - answered)

                        setQuizResult({
                            id: resultData.id,
                            score: resultData.score || 0,
                            total_marks: resultData.total_marks || 0,
                            percentage: resultData.percentage || 0,
                            passed: resultData.passed || false,
                            time_taken: sessionData.exam.duration_minutes * 60 - secondsLeft,
                            correct_answers: correctAnswers,
                            wrong_answers: wrongAnswers,
                            unattempted: unattempted
                        })
                        setShowResults(true)
                    }
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

    if (error || !sessionData) {
        const errorMessage = (error as Error)?.message || "Unknown error"
        const isAlreadySubmitted = errorMessage.includes("already been submitted")

        // If already submitted, try to fetch the previous result
        if (isAlreadySubmitted && userId) {
            return <PreviousResultView
                examId={examId}
                userId={userId}
                onRetake={() => setRetakeAttempt(prev => prev + 1)}
            />
        }

        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center p-8 bg-rose-50 rounded-xl border border-rose-200">
                    <h3 className="text-lg font-bold text-rose-900 mb-2">Failed to Load Quiz</h3>
                    <p className="text-rose-700 text-sm">{errorMessage}</p>
                </div>
            </div>
        )
    }

    // Show Results View
    if (showResults && quizResult) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 text-center">
                    <Award className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
                    <p className="text-green-100">Great job! Here are your results</p>
                </div>

                <div className="p-4 md:p-6 space-y-6">
                    {/* Score Card */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 md:p-4 rounded-xl border border-blue-200 text-center">
                            <Target className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-blue-600" />
                            <div className="text-xl md:text-2xl font-bold text-blue-900">{quizResult.score}</div>
                            <div className="text-xs text-blue-600 font-medium">Score</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 md:p-4 rounded-xl border border-purple-200 text-center">
                            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-purple-600" />
                            <div className="text-xl md:text-2xl font-bold text-purple-900">{quizResult.percentage.toFixed(1)}%</div>
                            <div className="text-xs text-purple-600 font-medium">Percentage</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 md:p-4 rounded-xl border border-green-200 text-center">
                            <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-green-600" />
                            <div className="text-xl md:text-2xl font-bold text-green-900">{quizResult.correct_answers || 0}</div>
                            <div className="text-xs text-green-600 font-medium">Correct</div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 md:p-4 rounded-xl border border-amber-200 text-center">
                            <Clock className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-amber-600" />
                            <div className="text-xl md:text-2xl font-bold text-amber-900">{formatTime(quizResult.time_taken || 0)}</div>
                            <div className="text-xs text-amber-600 font-medium">Time Taken</div>
                        </div>
                    </div>

                    {/* Analytics */}
                    <div className="bg-slate-50 p-4 md:p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-slate-600" />
                            <h3 className="font-bold text-slate-800">Performance Analytics</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">Correct Answers</span>
                                    <span className="font-semibold text-green-600">{quizResult.correct_answers || 0} / {allQuestions.length}</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: `${((quizResult.correct_answers || 0) / allQuestions.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">Wrong Answers</span>
                                    <span className="font-semibold text-red-600">{quizResult.wrong_answers || 0}</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 rounded-full transition-all"
                                        style={{ width: `${((quizResult.wrong_answers || 0) / allQuestions.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">Unattempted</span>
                                    <span className="font-semibold text-slate-600">{quizResult.unattempted || 0}</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-slate-400 rounded-full transition-all"
                                        style={{ width: `${((quizResult.unattempted || 0) / allQuestions.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pass/Fail Status */}
                    <div className={`p-4 rounded-xl border-2 text-center ${quizResult.passed ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'}`}>
                        <div className={`text-base md:text-lg font-bold ${quizResult.passed ? 'text-green-900' : 'text-amber-900'}`}>
                            {quizResult.passed ? '🎉 Congratulations! You Passed!' : '📚 Keep Practicing!'}
                        </div>
                        <p className={`text-xs md:text-sm mt-1 ${quizResult.passed ? 'text-green-700' : 'text-amber-700'}`}>
                            {quizResult.passed
                                ? 'You have successfully completed this quiz.'
                                : 'Review the material and try again to improve your score.'}
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center pt-4">
                        <Button
                            onClick={() => onExit ? onExit() : window.location.reload()}
                            className="bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto"
                        >
                            Continue Learning
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Quiz Interface - Dark theme with collapsible sidebar
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] bg-[#0d1117] text-white rounded-xl overflow-hidden border border-slate-800">
            {/* LEFT PANEL */}
            <div className="p-3 md:p-6 relative bg-[#0d1117]">
                {/* HEADER NAV */}
                <div className="bg-[#161b22] border border-slate-800 py-3 px-3 md:px-4 rounded-xl flex flex-wrap items-center justify-between gap-2 md:gap-3 shadow-sm mb-4">
                    <div className="flex flex-col flex-1 min-w-0">
                        <h2 className="text-base md:text-lg font-bold text-blue-400 truncate">{sessionData.exam.title}</h2>
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                            {sessionData.sections.map((s, i) => {
                                const startIdx = sessionData.sections.slice(0, i).reduce((a, b) => a + b.questions.length, 0)
                                const isActive = activeQuestionIdx >= startIdx && activeQuestionIdx < startIdx + s.questions.length
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setActiveQuestionIdx(startIdx)}
                                        className={`px-2 md:px-3 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${isActive
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
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

                        <div className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 rounded-full border text-xs md:text-sm ${secondsLeft < 300 ? 'bg-rose-900/50 text-rose-300 border-rose-700 animate-pulse' : 'bg-emerald-900/50 text-emerald-300 border-emerald-700'}`}>
                            <Clock className={`w-3 h-3 md:w-4 md:h-4 ${secondsLeft < 300 ? 'text-rose-400' : 'text-emerald-400'}`} />
                            <div className="font-semibold tabular-nums">{formatTime(secondsLeft)}</div>
                        </div>
                        <button
                            onClick={() => setShowSubmitDialog(true)}
                            className="hidden sm:block bg-rose-600 hover:bg-rose-700 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors shadow-sm"
                        >
                            Submit
                        </button>
                        <button
                            onClick={() => setPaletteOpenMobile(true)}
                            className="block lg:hidden bg-blue-600 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-md text-sm"
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
                        className="p-4 md:p-6 bg-[#161b22] rounded-2xl shadow-sm border border-slate-800"
                    >
                        <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                            <div className="text-xs md:text-sm font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded">
                                Question {activeQuestionIdx + 1}
                            </div>
                            <div className="text-xs md:text-sm text-slate-400">
                                Marks: <span className="font-semibold text-emerald-400">+{currentQuestion?.marks}</span> |
                                Negative: <span className="font-semibold text-rose-400">-{currentQuestion?.negative_marks}</span>
                            </div>
                        </div>

                        <div className="text-base md:text-lg font-medium mb-6 leading-relaxed text-slate-100">
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
                                                ? "bg-blue-900/30 border-blue-500 shadow-sm ring-1 ring-blue-500"
                                                : "bg-slate-800/50 border-slate-700 hover:border-blue-400 hover:bg-slate-800"
                                                }`}
                                        >
                                            <div
                                                className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs md:text-sm font-bold transition-colors ${chosen
                                                    ? "bg-blue-600 text-white"
                                                    : "border border-slate-600 text-slate-400 group-hover:border-blue-400 group-hover:text-blue-400"
                                                    }`}
                                            >
                                                {optionLabel}
                                            </div>
                                            <span className="text-sm md:text-base text-slate-200 group-hover:text-white">{renderWithLatex(opt.option_text)}</span>
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
                                                ? "bg-amber-900/30 border-amber-500 shadow-sm ring-1 ring-amber-500"
                                                : "bg-slate-800/50 border-slate-700 hover:border-amber-400 hover:bg-slate-800"
                                                }`}
                                        >
                                            <div
                                                className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-xs md:text-sm font-bold transition-colors ${checked ? "bg-amber-500 text-white" : "border border-slate-600 text-slate-400 group-hover:border-amber-400"
                                                    }`}
                                            >
                                                {optionLabel}
                                            </div>
                                            <span className="text-sm md:text-base text-slate-200 group-hover:text-white">{renderWithLatex(opt.option_text)}</span>
                                        </button>
                                    )
                                })}

                            {currentQuestion?.question_type === "NAT" && (
                                <div className="mt-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Your Answer:</label>
                                    <input
                                        type="number"
                                        className="w-full max-w-md p-3 rounded-lg border border-slate-700 bg-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm md:text-base"
                                        placeholder="Enter numeric value..."
                                        value={responses[currentQuestion.id] || ""}
                                        onChange={(e) => handleSaveResponse(currentQuestion.id, e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-800 flex flex-wrap justify-between items-center gap-2 md:gap-3">
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={prevQuestion}
                                    disabled={activeQuestionIdx === 0}
                                    className="px-3 md:px-4 py-1.5 md:py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-xs md:text-sm"
                                >
                                    <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> Previous
                                </button>
                                <button
                                    onClick={() => handleSaveResponse(currentQuestion.id, null)}
                                    className="px-3 md:px-4 py-1.5 md:py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors text-xs md:text-sm"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        setMarked((m) => ({ ...m, [currentQuestion.id]: !m[currentQuestion.id] }))
                                        nextQuestion()
                                    }}
                                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg flex items-center gap-2 transition-colors text-xs md:text-sm ${marked[currentQuestion.id]
                                        ? "bg-amber-600 text-white hover:bg-amber-700"
                                        : "border border-amber-600 text-amber-400 hover:bg-amber-900/30"
                                        }`}
                                >
                                    <Flag className="w-3 h-3 md:w-4 md:h-4" /> {marked[currentQuestion.id] ? "Marked" : "Mark"}
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={nextQuestion}
                                    className="px-4 md:px-6 py-1.5 md:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors text-xs md:text-sm"
                                >
                                    Save & Next
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* RIGHT PALETTE (Desktop) */}
            <div className="hidden lg:flex flex-col bg-[#161b22] border-l border-slate-800 overflow-hidden">
                <div className="p-5 border-b border-slate-800">
                    <h4 className="font-bold text-slate-200">Question Palette</h4>
                    <div className="flex gap-4 mt-4 text-xs text-slate-400 flex-wrap">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500"></div> Answered</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-400"></div> Marked</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-900 border border-blue-700"></div> Visited</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <div className="grid grid-cols-5 gap-2">
                        {allQuestions.map((q, i) => {
                            const status = qStatus(q)
                            const isMarked = marked[q.id]
                            let cls = "bg-slate-800 text-slate-400 hover:bg-slate-700"

                            if (status === "answered") cls = "bg-green-500 text-white shadow-sm"
                            else if (isMarked) cls = "bg-amber-400 text-white shadow-sm"
                            else if (status === "visited") cls = "bg-blue-900 text-blue-300 border border-blue-700"

                            if (activeQuestionIdx === i) cls += " ring-2 ring-offset-1 ring-offset-[#161b22] ring-blue-500"

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

                <div className="p-5 border-t border-slate-800 bg-[#0d1117]">
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
                            className="fixed inset-y-0 right-0 z-50 w-80 bg-[#161b22] shadow-2xl border-l border-slate-800 lg:hidden flex flex-col"
                        >
                            <div className="p-4 flex items-center justify-between border-b border-slate-800">
                                <h4 className="font-bold text-slate-200">Question Palette</h4>
                                <button onClick={() => setPaletteOpenMobile(false)} className="p-2 hover:bg-slate-800 rounded-full">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="grid grid-cols-5 gap-2">
                                    {allQuestions.map((q, i) => {
                                        const status = qStatus(q)
                                        const isMarked = marked[q.id]
                                        let cls = "bg-slate-800 text-slate-400"

                                        if (status === "answered") cls = "bg-green-500 text-white"
                                        else if (isMarked) cls = "bg-amber-400 text-white"
                                        else if (status === "visited") cls = "bg-blue-900 text-blue-300 border border-blue-700"

                                        if (activeQuestionIdx === i) cls += " ring-2 ring-offset-1 ring-offset-[#161b22] ring-blue-500"

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
                            <div className="p-4 border-t border-slate-800">
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

            {/* SUBMIT DIALOG */}
            <AnimatePresence>
                {showSubmitDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            {isSubmitting ? (
                                <div className="p-10 flex flex-col items-center justify-center text-center">
                                    <div className="relative w-20 h-20 mb-6">
                                        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <CheckCircle2 className="w-8 h-8 text-indigo-600 opacity-50" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Submitting Exam</h3>
                                    <p className="text-slate-500">Please wait while we securely save your answers and calculate your score.</p>
                                    <div className="mt-6 flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Processing results...
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-slate-50 p-6 border-b border-slate-100">
                                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                            Submit Exam?
                                        </h3>
                                        <p className="text-slate-600 mt-2 text-sm">
                                            Are you sure you want to submit? You won't be able to change your answers after this.
                                        </p>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                                <div className="text-green-600 text-xs font-semibold uppercase tracking-wider mb-1">Answered</div>
                                                <div className="text-2xl font-bold text-green-700">
                                                    {Object.values(responses).filter(v => v !== null && (Array.isArray(v) ? v.length > 0 : true)).length}
                                                </div>
                                            </div>
                                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                                <div className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">Marked</div>
                                                <div className="text-2xl font-bold text-amber-700">
                                                    {Object.values(marked).filter(Boolean).length}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-slate-600 font-medium">Total Questions</span>
                                            <span className="text-xl font-bold text-slate-800">{allQuestions.length}</span>
                                        </div>
                                    </div>

                                    <div className="p-6 pt-2 flex justify-end gap-3">
                                        <button
                                            onClick={() => setShowSubmitDialog(false)}
                                            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={performSubmit}
                                            className="px-5 py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
                                        >
                                            Yes, Submit Exam
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
