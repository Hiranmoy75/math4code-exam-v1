"use client"
import React from "react"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { CheckCircle2, XCircle, Download } from "lucide-react"
import { useExamResult } from "@/hooks/useExamResult"
import ExamResultSkeleton from "@/components/skeletons/ExamResultSkeleton"

export default function ExamResultPage() {
  const { attemptId } = useParams()
  const { data, isLoading, error } = useExamResult(attemptId as string)

 if (isLoading)
  return (
    <ExamResultSkeleton />
  )

  if (error || !data)
    return (
      <div className="flex items-center justify-center h-screen text-rose-500">
        Failed to load result.
      </div>
    )

  const { attempt, structured, responseMap } = data
  const examTitle = attempt.exams.title

  // --- Evaluation ---
  let totalMarks = 0,
    obtainedMarks = 0,
    correct = 0,
    wrong = 0,
    unattempted = 0

  structured.forEach((section) =>
    section.questions.forEach((q: any) => {
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
          isCorrect = c.length === a.length && c.every((x:any, i:any) => x === a[i])
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

  const percentage = ((obtainedMarks / totalMarks) * 100).toFixed(2)

  // --- UI ---
  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen bg-gradient-to-br from-white via-indigo-50 to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-black">
      {/* HEADER SUMMARY */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            {examTitle} — Result
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Detailed review with your answers, correct options & explanations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-2xl p-4 bg-white dark:bg-slate-800/60 shadow-md border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-sm text-slate-500 dark:text-slate-300">Score</div>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {obtainedMarks.toFixed(2)} / {totalMarks}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {percentage}%
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-white dark:bg-slate-800/60 shadow-md border border-slate-100 dark:border-slate-700 text-sm">
            <div className="text-green-600 font-semibold">
              Correct: {correct}
            </div>
            <div className="text-rose-500">Incorrect: {wrong}</div>
            <div className="text-slate-600 dark:text-slate-300">
              Unattempted: {unattempted}
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" /> Print / Save
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 bg-gradient-to-r from-green-400 to-indigo-600"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* QUESTIONS LIST */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {structured.map((section) => (
          <div key={section.id}>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
              {section.title}
            </h3>

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
                <motion.div
                  key={q.id}
                  className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-md p-4 mb-3"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white leading-snug">
                      {idx + 1}. {q.question_text}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          obtained > 0
                            ? "bg-green-100 text-green-700"
                            : obtained < 0
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {obtained > 0
                          ? `+${obtained}`
                          : obtained < 0
                          ? obtained
                          : "0"}{" "}
                        marks
                      </span>
                      {neg > 0 && (
                        <span className="text-xs text-slate-500">
                          (-{neg} negative)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  {status === "correct" && (
                    <span className="flex items-center gap-1 text-green-600 text-sm mt-1">
                      <CheckCircle2 className="w-4 h-4" /> Correct
                    </span>
                  )}
                  {status === "incorrect" && (
                    <span className="flex items-center gap-1 text-rose-500 text-sm mt-1">
                      <XCircle className="w-4 h-4" /> Incorrect
                    </span>
                  )}
                  {status === "unattempted" && (
                    <span className="text-xs text-slate-500 mt-1">
                      Not Attempted
                    </span>
                  )}

                  {/* OPTIONS */}
                 {q.question_type !== "NAT" && q.options && (
  <div className="mt-3 grid gap-2">
    {q.options.map((opt: any) => {
      const chosen = Array.isArray(ans)
        ? ans.includes(opt.id)
        : ans === opt.id
      const correct = opt.is_correct

      // Define dynamic background
      let bgClass = "bg-white border-slate-200 dark:bg-slate-800/60"
      if (correct && chosen) {
        bgClass = "bg-green-100 border-green-300 dark:bg-green-800/40"
      } else if (correct) {
        bgClass = "bg-green-50 border-green-300 dark:bg-green-900/40"
      } else if (chosen && !correct) {
        bgClass = "bg-rose-50 border-rose-300 dark:bg-rose-900/40"
      }

      return (
        <div
          key={opt.id}
          className={`p-3 rounded-lg flex items-center justify-between border transition-all ${bgClass}`}
        >
          <div className="flex-1 text-sm text-slate-700 dark:text-slate-200">
            {opt.option_text}
          </div>

          <div className="flex gap-2">
            {chosen && !correct && (
              <span className="px-2 py-1 text-xs rounded bg-rose-500 text-white">
                Your
              </span>
            )}
            {chosen && correct && (
              <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">
                Your ✓
              </span>
            )}
            {!chosen && correct && (
              <span className="px-2 py-1 text-xs rounded bg-green-500 text-white">
                Correct
              </span>
            )}
          </div>
        </div>
      )
    })}
  </div>
)}


                  {/* NAT Display */}
                  {q.question_type === "NAT" && (
                    <div className="mt-3 text-sm space-y-1">
                      <div>
                        <span className="text-slate-500">Your answer: </span>
                        <span
                          className={`font-medium ${
                            isCorrect
                              ? "text-green-600"
                              : isUnattempted
                              ? "text-slate-500"
                              : "text-rose-600"
                          }`}
                        >
                          {ans ?? "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Correct answer: </span>
                        <span className="font-medium text-green-600">
                          {q.correct_answer}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border text-sm text-slate-700 dark:text-slate-200">
                      <div className="font-medium text-slate-800 dark:text-white mb-1">
                        Explanation
                      </div>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
