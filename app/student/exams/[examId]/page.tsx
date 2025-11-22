"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Clock,
  Flag,
  Menu,
  X,
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Maximize,
  Minimize,
  Calculator
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { renderWithLatex } from "@/lib/renderWithLatex"
import { useExamSession, useSubmitExam, useSaveAnswer, useUpdateTimer, Question, Section } from "@/hooks/student/useExamSession"
import { ScientificCalculator } from "./components/ScientificCalculator"

// Simple debounce implementation
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}

export default function ExamPanelSections() {
  const supabase = createClient()
  const router = useRouter()
  const { examId } = useParams() as { examId: string }
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const isRetake = searchParams.get('retake') === 'true'

  const [userId, setUserId] = useState<string | null>(null)

  // Auth check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/auth/login")
      setUserId(user.id)
    }
    checkUser()
  }, [router, supabase])

  // React Query Hooks
  const { data: sessionData, isLoading: isSessionLoading, error: sessionError } = useExamSession(examId, userId, isRetake)
  const { mutate: submitExam, isPending: isSubmitting } = useSubmitExam()
  const { mutate: saveAnswer, isPending: isSaving } = useSaveAnswer()
  const { mutate: updateTimer } = useUpdateTimer()

  // Local State
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [marked, setMarked] = useState<Record<string, boolean>>({})
  const [visited, setVisited] = useState<Record<string, boolean>>({})
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [paletteOpenMobile, setPaletteOpenMobile] = useState(false)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const timerRef = useRef<number | null>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const secondsLeftRef = useRef(secondsLeft)
  const hasInitialized = useRef(false)

  // Keep secondsLeftRef in sync
  useEffect(() => {
    secondsLeftRef.current = secondsLeft
  }, [secondsLeft])

  // Sync Session Data to Local State (runs only once when data loads)
  useEffect(() => {
    if (!sessionData || hasInitialized.current) return

    console.log('🔄 Initializing exam session...', {
      hasAttempt: !!sessionData.attempt,
      attemptId: sessionData.attempt?.id,
      previousResponsesCount: Object.keys(sessionData.previousResponses || {}).length,
      totalTimeSpent: sessionData.attempt?.total_time_spent
    })

    // Initialize responses from previous session if available
    if (sessionData.previousResponses && Object.keys(sessionData.previousResponses).length > 0) {
      console.log('📝 Loading previous responses:', sessionData.previousResponses)
      setResponses(sessionData.previousResponses)

      // Also mark them as visited
      const newVisited: Record<string, boolean> = {}
      Object.keys(sessionData.previousResponses).forEach(k => newVisited[k] = true)
      setVisited(newVisited)
      console.log('✅ Loaded', Object.keys(sessionData.previousResponses).length, 'previous responses')
    } else {
      console.log('ℹ️ No previous responses found')
    }

    // Initialize Timer - Calculate remaining time: Duration - Time Spent
    const totalDuration = sessionData.exam.duration_minutes * 60
    const timeSpent = sessionData.attempt.total_time_spent || 0
    const remaining = Math.max(0, totalDuration - timeSpent)

    console.log('⏱️ Timer Initialization:', {
      examDuration: sessionData.exam.duration_minutes,
      totalDurationSeconds: totalDuration,
      timeSpentSeconds: timeSpent,
      remainingSeconds: remaining,
      remainingMinutes: (remaining / 60).toFixed(2)
    })

    setSecondsLeft(remaining)
    setIsTimerActive(true)
    hasInitialized.current = true

    console.log('✅ Exam session initialized successfully')
  }, [sessionData])

  // Timer Logic
  useEffect(() => {
    if (!isTimerActive || secondsLeft <= 0) return

    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleAutoSubmit()
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTimerActive])

  // Periodic Timer Save (Every 30 seconds)
  useEffect(() => {
    if (!sessionData?.attempt?.id || !isTimerActive) return

    saveTimerRef.current = setInterval(() => {
      const totalDuration = sessionData.exam.duration_minutes * 60
      const currentSecondsLeft = secondsLeftRef.current
      const timeSpent = totalDuration - currentSecondsLeft

      console.log('💾 Auto-saving timer (30s interval):', {
        attemptId: sessionData.attempt.id,
        totalDuration,
        currentSecondsLeft,
        timeSpent,
        timeSpentMinutes: (timeSpent / 60).toFixed(2)
      })

      if (timeSpent > 0) {
        updateTimer({ attemptId: sessionData.attempt.id, timeSpent })
      }
    }, 30000)

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)
    }
  }, [sessionData, isTimerActive, updateTimer])

  // Save timer on unmount/page hide
  useEffect(() => {
    const handleUnload = () => {
      if (sessionData?.attempt?.id) {
        const totalDuration = sessionData.exam.duration_minutes * 60
        const timeSpent = totalDuration - secondsLeftRef.current
        if (timeSpent > 0) {
          updateTimer({ attemptId: sessionData.attempt.id, timeSpent })
        }
      }
    }
    window.addEventListener("beforeunload", handleUnload)
    return () => window.removeEventListener("beforeunload", handleUnload)
  }, [sessionData, updateTimer])


  // Debounced Save for NAT
  const debouncedSave = useDebounce((qid: string, ans: any) => {
    if (sessionData?.attempt?.id) {
      saveAnswer({ attemptId: sessionData.attempt.id, questionId: qid, answer: ans })
    }
  }, 1000)

  // Helper Functions
  const allQuestions = sessionData?.sections.flatMap((s) => s.questions) || []
  const currentQuestion = allQuestions[activeQuestionIdx]

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0")
    const sec = (s % 60).toString().padStart(2, "0")
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true))
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullScreen(false))
      }
    }
  }

  const handleSaveResponse = (qid: string, ans: any) => {
    setResponses((r) => ({ ...r, [qid]: ans }))
    setVisited((v) => ({ ...v, [qid]: true }))

    // Trigger background save
    if (sessionData?.attempt?.id) {
      const qType = allQuestions.find(q => q.id === qid)?.question_type
      if (qType === "NAT") {
        debouncedSave(qid, ans)
      } else {
        saveAnswer({ attemptId: sessionData.attempt.id, questionId: qid, answer: ans })
      }
    }
  }

  const nextQuestion = () => {
    if (activeQuestionIdx < allQuestions.length - 1) setActiveQuestionIdx((i) => i + 1)
  }
  const prevQuestion = () => {
    if (activeQuestionIdx > 0) setActiveQuestionIdx((i) => i - 1)
  }

  const qStatus = (q: Question) => {
    if (!visited[q.id]) return "notVisited"
    const a = responses[q.id]
    if (Array.isArray(a)) return a.length ? "answered" : "visited"
    return a ? "answered" : "visited"
  }

  const handleAutoSubmit = () => {
    toast.info("Time's up! Submitting exam...")
    performSubmit()
  }

  const performSubmit = () => {
    if (!sessionData?.attempt?.id || !sessionData?.exam) return

    submitExam({
      attemptId: sessionData.attempt.id,
      examId: sessionData.exam.id,
      responses: responses,
      sections: sessionData.sections,
      totalMarks: sessionData.exam.total_marks || 0
    }, {
      onSuccess: (result) => {
        router.push(`/student/results/${result.id}?attemptId=${sessionData.attempt.id}`)
      }
    })
  }

  const handlePauseAndExit = () => {
    if (sessionData?.attempt?.id) {
      const totalDuration = sessionData.exam.duration_minutes * 60
      const timeSpent = totalDuration - secondsLeft

      console.log('🚪 Pause & Exit - Saving timer:', {
        attemptId: sessionData.attempt.id,
        examDuration: sessionData.exam.duration_minutes,
        totalDuration,
        secondsLeft,
        timeSpent,
        timeSpentMinutes: (timeSpent / 60).toFixed(2),
        remainingMinutes: (secondsLeft / 60).toFixed(2)
      })

      updateTimer({
        attemptId: sessionData.attempt.id,
        timeSpent
      })

      // Give a small delay to ensure the mutation completes
      setTimeout(() => {
        console.log('✅ Redirecting to dashboard...')
        router.push("/student/dashboard")
      }, 500)
    } else {
      console.log('⚠️ No attempt ID found, redirecting without saving')
      router.push("/student/dashboard")
    }
  }

  // Loading & Error States
  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading Exam Interface...</p>
        </div>
      </div>
    )
  }

  if (sessionError) {
    const errorMessage = (sessionError as Error).message
    const isMaxAttemptsError = errorMessage.includes("maximum number of attempts")
    const isAlreadySubmittedError = errorMessage.includes("already been submitted")

    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="max-w-md mx-auto">
          <div className={`flex flex-col items-center gap-4 p-8 rounded-2xl border ${isMaxAttemptsError || isAlreadySubmittedError
            ? 'bg-amber-50 border-amber-200'
            : 'bg-rose-50 border-rose-200'
            }`}>
            {isMaxAttemptsError ? (
              <>
                <AlertTriangle className="w-16 h-16 text-amber-500" />
                <h2 className="text-2xl font-bold text-amber-900">Maximum Attempts Reached</h2>
                <p className="text-center text-amber-700">
                  You have used all available attempts for this exam. Please contact your instructor if you need additional attempts.
                </p>
              </>
            ) : isAlreadySubmittedError ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-indigo-500" />
                <h2 className="text-2xl font-bold text-indigo-900">Exam Already Submitted</h2>
                <p className="text-center text-indigo-700">
                  This exam has already been submitted. To retake this exam, please go back to the test series page and click "Retake Exam".
                </p>
              </>
            ) : (
              <>
                <Flag className="w-16 h-16 text-rose-500" />
                <h2 className="text-2xl font-bold text-rose-900">Failed to Load Exam</h2>
                <p className="text-center text-rose-700">{errorMessage}</p>
              </>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => router.push("/student/dashboard")}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionData) return null

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_360px] bg-slate-50 text-slate-800">
      {/* LEFT PANEL */}
      <div className="p-4 md:p-6 relative">
        {/* HEADER NAV */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 py-3 px-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-indigo-700">{sessionData.exam.title}</h2>
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {sessionData.sections.map((s, i) => {
                const startIdx = sessionData.sections.slice(0, i).reduce((a, b) => a + b.questions.length, 0)
                const isActive = activeQuestionIdx >= startIdx && activeQuestionIdx < startIdx + s.questions.length
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveQuestionIdx(startIdx)}
                    className={`px-3 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${isActive
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {s.title}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tools */}
            <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-3">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className={`p-2 rounded-lg transition-colors ${showCalculator ? "bg-indigo-100 text-indigo-600" : "text-slate-500 hover:bg-slate-100"}`}
                title="Scientific Calculator"
              >
                <Calculator className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFullScreen}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                title="Toggle Full Screen"
              >
                {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>

            {/* Saving Indicator */}
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
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

            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${secondsLeft < 300 ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
              <Clock className={`w-4 h-4 ${secondsLeft < 300 ? 'text-rose-600' : 'text-emerald-600'}`} />
              <div className="text-sm font-semibold tabular-nums">{formatTime(secondsLeft)}</div>
            </div>
            <button
              onClick={() => setShowSubmitDialog(true)}
              className="hidden sm:block bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              Submit
            </button>
            <button
              onClick={() => setPaletteOpenMobile(true)}
              className="block lg:hidden bg-indigo-600 text-white px-3 py-2 rounded-md text-sm"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CALCULATOR OVERLAY */}
        <AnimatePresence>
          {showCalculator && (
            <ScientificCalculator onClose={() => setShowCalculator(false)} />
          )}
        </AnimatePresence>

        {/* QUESTION CARD */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion?.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-5 p-6 bg-white rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Question {activeQuestionIdx + 1}
              </div>
              <div className="text-sm text-slate-500">
                Marks: <span className="font-semibold text-emerald-600">+{currentQuestion?.marks}</span> |
                Negative: <span className="font-semibold text-rose-500">-{currentQuestion?.negative_marks}</span>
              </div>
            </div>

            <div className="text-base md:text-lg font-medium mb-6 leading-relaxed text-slate-800">
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
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group ${chosen
                        ? "bg-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-500"
                        : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-colors ${chosen
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-300 text-slate-500 group-hover:border-indigo-400 group-hover:text-indigo-600"
                          }`}
                      >
                        {optionLabel}
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-900">{renderWithLatex(opt.option_text)}</span>
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
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group ${checked
                        ? "bg-amber-50 border-amber-500 shadow-sm ring-1 ring-amber-500"
                        : "bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50"
                        }`}
                    >
                      <div
                        className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-sm font-bold transition-colors ${checked ? "bg-amber-500 text-white" : "border border-slate-300 text-slate-500 group-hover:border-amber-400"
                          }`}
                      >
                        {optionLabel}
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-900">{renderWithLatex(opt.option_text)}</span>
                    </button>
                  )
                })}

              {currentQuestion?.question_type === "NAT" && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Answer:</label>
                  <input
                    type="number"
                    className="w-full max-w-md p-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="Enter numeric value..."
                    value={responses[currentQuestion.id] || ""}
                    onChange={(e) => handleSaveResponse(currentQuestion.id, e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
              <div className="flex gap-2">
                <button
                  onClick={prevQuestion}
                  disabled={activeQuestionIdx === 0}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => handleSaveResponse(currentQuestion.id, null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setMarked((m) => ({ ...m, [currentQuestion.id]: !m[currentQuestion.id] }))
                    nextQuestion()
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${marked[currentQuestion.id]
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "border border-amber-200 text-amber-600 hover:bg-amber-50"
                    }`}
                >
                  <Flag className="w-4 h-4" /> {marked[currentQuestion.id] ? "Marked" : "Mark for Review"}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={nextQuestion}
                  className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors"
                >
                  Save & Next
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* RIGHT PALETTE (Desktop) */}
      <div className="hidden lg:flex flex-col bg-white border-l border-slate-200 h-screen sticky top-0 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h4 className="font-bold text-slate-800">Question Palette</h4>
          <div className="flex gap-4 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500"></div> Answered</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-400"></div> Marked</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200"></div> Visited</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-5 gap-2">
            {allQuestions.map((q, i) => {
              const status = qStatus(q)
              const isMarked = marked[q.id]
              let cls = "bg-slate-100 text-slate-600 hover:bg-slate-200"

              if (status === "answered") cls = "bg-green-500 text-white shadow-sm"
              else if (isMarked) cls = "bg-amber-400 text-white shadow-sm"
              else if (status === "visited") cls = "bg-indigo-50 text-indigo-700 border border-indigo-200"

              if (activeQuestionIdx === i) cls += " ring-2 ring-offset-1 ring-indigo-600"

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

        <div className="p-5 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => setShowSubmitDialog(true)}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold shadow-sm transition-colors"
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
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl border-l border-slate-200 lg:hidden flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b">
                <h4 className="font-bold text-slate-800">Question Palette</h4>
                <button onClick={() => setPaletteOpenMobile(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-5 gap-2">
                  {allQuestions.map((q, i) => {
                    const status = qStatus(q)
                    const isMarked = marked[q.id]
                    let cls = "bg-slate-100 text-slate-600"

                    if (status === "answered") cls = "bg-green-500 text-white"
                    else if (isMarked) cls = "bg-amber-400 text-white"
                    else if (status === "visited") cls = "bg-indigo-50 text-indigo-700 border border-indigo-200"

                    if (activeQuestionIdx === i) cls += " ring-2 ring-offset-1 ring-indigo-600"

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
              <div className="p-4 border-t">
                <button
                  onClick={() => {
                    setPaletteOpenMobile(false)
                    setShowSubmitDialog(true)
                  }}
                  className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold"
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
                  <div className="px-6 pb-6">
                    <button
                      onClick={handlePauseAndExit}
                      className="w-full py-3 text-slate-500 text-sm font-medium hover:text-indigo-600 transition-colors border-t border-slate-100 mt-2"
                    >
                      Pause & Exit (Resume Later)
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
