"use client"
import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import {
  CheckCircle2,
  XCircle,
  Download,
  Home,
  RefreshCw,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  ChevronRight
} from "lucide-react"
import { useExamResult } from "@/hooks/useExamResult"
import ExamResultSkeleton from "@/components/skeletons/ExamResultSkeleton"
import Link from "next/link"
import { renderWithLatex } from "@/lib/renderWithLatex"

export default function ExamResultPage() {
  const { attemptId } = useParams()
  const router = useRouter()
  const { data, isLoading, error } = useExamResult(attemptId as string)

  // Calculate all statistics
  const stats = useMemo(() => {
    if (!data) return null

    const { structured, responseMap } = data
    let totalMarks = 0
    let obtainedMarks = 0
    let correct = 0
    let wrong = 0
    let unattempted = 0
    let totalQuestions = 0

    structured.forEach((section) =>
      section.questions.forEach((q: any) => {
        totalQuestions++
        totalMarks += q.marks
        const ans = responseMap[q.id]
        const neg = q.negative_marks ?? 0
        let got = 0

        if (!ans || (Array.isArray(ans) && ans.length === 0)) {
          unattempted++
        } else {
          let isCorrect = false
          if (q.question_type === "MCQ") {
            const c = q.options.find((o: any) => o.is_correct)?.id
            isCorrect = ans === c
          } else if (q.question_type === "MSQ") {
            const c = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id).sort()
            const a = (ans as string[]).sort()
            isCorrect = c.length === a.length && c.every((x: any, i: any) => x === a[i])
          } else if (q.question_type === "NAT") {
            isCorrect = String(ans).trim() === String(q.correct_answer).trim()
          }
          if (isCorrect) {
            got = q.marks
            correct++
          } else {
            got = -Math.abs(neg)
            wrong++
          }
        }
        q.obtained = got
        obtainedMarks += got
      })
    )

    const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100) : 0
    const accuracy = totalQuestions > 0 ? ((correct / totalQuestions) * 100) : 0

    return {
      totalMarks,
      obtainedMarks,
      correct,
      wrong,
      unattempted,
      totalQuestions,
      percentage,
      accuracy
    }
  }, [data])

  if (isLoading) return <ExamResultSkeleton />

  if (error || !data || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="w-16 h-16 text-rose-500" />
        <h2 className="text-2xl font-bold text-rose-500">Failed to Load Result</h2>
        <p className="text-slate-600">Please try again or contact support.</p>
        <Link href="/student/dashboard">
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Go to Dashboard
          </button>
        </Link>
      </div>
    )
  }

  const { attempt, structured, responseMap } = data
  const examTitle = attempt.exams.title
  const examId = attempt.exam_id

  // Determine pass/fail (assuming 40% is passing)
  const isPassed = stats.percentage >= 40

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                {examTitle}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Detailed Result Analysis
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/student/dashboard">
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Home className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </Link>
              <button
                onClick={() => window.print()}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Score */}
            <div className="md:col-span-1 flex flex-col items-center justify-center text-center">
              <div className="text-6xl font-black mb-2">
                {stats.percentage.toFixed(1)}%
              </div>
              <div className="text-lg opacity-90">Overall Score</div>
              <div className="mt-4">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${isPassed
                  ? 'bg-green-500 text-white'
                  : 'bg-rose-500 text-white'
                  }`}>
                  {isPassed ? '✓ Passed' : '✗ Not Passed'}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5" />
                  <span className="text-sm opacity-90">Marks Obtained</span>
                </div>
                <div className="text-3xl font-bold">
                  {stats.obtainedMarks.toFixed(2)} / {stats.totalMarks}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm opacity-90">Accuracy</span>
                </div>
                <div className="text-3xl font-bold">
                  {stats.accuracy.toFixed(1)}%
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm opacity-90">Correct</span>
                </div>
                <div className="text-3xl font-bold text-green-300">
                  {stats.correct}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm opacity-90">Incorrect</span>
                </div>
                <div className="text-3xl font-bold text-rose-300">
                  {stats.wrong}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2 opacity-90">
              <span>Progress</span>
              <span>{stats.correct + stats.wrong} / {stats.totalQuestions} Attempted</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div className="h-full flex">
                <div
                  className="bg-green-400"
                  style={{ width: `${(stats.correct / stats.totalQuestions) * 100}%` }}
                />
                <div
                  className="bg-rose-400"
                  style={{ width: `${(stats.wrong / stats.totalQuestions) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs mt-2 opacity-75">
              <span>✓ {stats.correct} Correct</span>
              <span>✗ {stats.wrong} Wrong</span>
              <span>— {stats.unattempted} Skipped</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/student/exams/${examId}?retake=true`} className="flex-1">
              <button className="w-full px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Retake Exam
              </button>
            </Link>
            <Link href="/student/dashboard" className="flex-1">
              <button className="w-full px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Dashboard
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Questions Review */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ChevronRight className="w-6 h-6" />
            Detailed Review
          </h2>

          {structured.map((section, sectionIdx) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIdx * 0.1 }}
            >
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-sm font-bold">
                  {sectionIdx + 1}
                </div>
                {section.title}
              </h3>

              <div className="space-y-4">
                {section.questions.map((q: any, idx: number) => {
                  const ans = responseMap[q.id]
                  const isUnattempted =
                    !ans || (Array.isArray(ans) && ans.length === 0) || String(ans).trim() === ""
                  const obtained = q.obtained ?? 0
                  const neg = q.negative_marks ?? 0
                  const isCorrect = obtained > 0
                  const status = isUnattempted
                    ? "unattempted"
                    : isCorrect
                      ? "correct"
                      : "incorrect"

                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl bg-white dark:bg-slate-800 border-2 shadow-md p-6 transition-all ${status === "correct"
                        ? "border-green-200 dark:border-green-800"
                        : status === "incorrect"
                          ? "border-rose-200 dark:border-rose-800"
                          : "border-slate-200 dark:border-slate-700"
                        }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm">
                              {idx + 1}
                            </span>
                            <h4 className="text-lg font-semibold text-slate-800 dark:text-white">
                              {renderWithLatex(q.question_text)}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <span>Type: {q.question_type}</span>
                            <span>•</span>
                            <span>Marks: +{q.marks}</span>
                            {neg > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-rose-500">Negative: -{neg}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Score Badge */}
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-4 py-2 rounded-xl font-bold text-lg ${obtained > 0
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : obtained < 0
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                              }`}
                          >
                            {obtained > 0 ? `+${obtained}` : obtained < 0 ? obtained : "0"}
                          </span>
                          {status === "correct" && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                              <CheckCircle2 className="w-4 h-4" /> Correct
                            </span>
                          )}
                          {status === "incorrect" && (
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-sm font-medium">
                              <XCircle className="w-4 h-4" /> Incorrect
                            </span>
                          )}
                          {status === "unattempted" && (
                            <span className="text-slate-500 dark:text-slate-400 text-sm">
                              Not Attempted
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Options (MCQ/MSQ) */}
                      {q.question_type !== "NAT" && q.options && (
                        <div className="space-y-2">
                          {q.options.map((opt: any, optIdx: number) => {
                            const chosen = Array.isArray(ans)
                              ? ans.includes(opt.id)
                              : ans === opt.id
                            const correct = opt.is_correct

                            let bgClass = "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700"
                            let textClass = "text-slate-700 dark:text-slate-200"

                            if (correct && chosen) {
                              bgClass = "bg-green-50 border-green-400 dark:bg-green-900/30 dark:border-green-600"
                              textClass = "text-green-900 dark:text-green-100"
                            } else if (correct) {
                              bgClass = "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700"
                              textClass = "text-green-800 dark:text-green-200"
                            } else if (chosen && !correct) {
                              bgClass = "bg-rose-50 border-rose-400 dark:bg-rose-900/30 dark:border-rose-600"
                              textClass = "text-rose-900 dark:text-rose-100"
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${bgClass}`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 font-bold text-sm">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className={`${textClass} font-medium`}>
                                    {renderWithLatex(opt.option_text)}
                                  </span>
                                </div>

                                <div className="flex gap-2">
                                  {chosen && !correct && (
                                    <span className="px-3 py-1 text-xs rounded-full bg-rose-600 text-white font-bold">
                                      Your Answer
                                    </span>
                                  )}
                                  {chosen && correct && (
                                    <span className="px-3 py-1 text-xs rounded-full bg-green-600 text-white font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Your Answer
                                    </span>
                                  )}
                                  {!chosen && correct && (
                                    <span className="px-3 py-1 text-xs rounded-full bg-green-500 text-white font-bold">
                                      Correct Answer
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* NAT Answer */}
                      {q.question_type === "NAT" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Your Answer</div>
                            <div className={`text-lg font-bold ${isCorrect
                              ? "text-green-600 dark:text-green-400"
                              : isUnattempted
                                ? "text-slate-500 dark:text-slate-400"
                                : "text-rose-600 dark:text-rose-400"
                              }`}>
                              {ans ? renderWithLatex(String(ans)) : "—"}
                            </div>
                          </div>
                          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <div className="text-sm text-green-600 dark:text-green-400 mb-1">Correct Answer</div>
                            <div className="text-lg font-bold text-green-700 dark:text-green-300">
                              {renderWithLatex(q.correct_answer)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="mt-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                          <div className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            Explanation
                          </div>
                          <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
                            {renderWithLatex(q.explanation)}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
