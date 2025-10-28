'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, ArrowLeft, Download } from 'lucide-react'

type Option = { id: string; text: string }
type Question = {
  id: number
  question: string
  options?: Option[]
  correct: string | string[] | number
  marks?: number
  type?: 'MCQ' | 'MSQ' | 'NAT'
  explanation?: string
}

export default function ExamResultPage() {
  // ---------- Dummy Data ----------
  const questions: Question[] = [
    {
      id: 1,
      question: 'What is the value of 2 + 3 × 4 ?',
      options: [
        { id: 'A', text: '20' },
        { id: 'B', text: '14' },
        { id: 'C', text: '10' },
        { id: 'D', text: 'None of the above' },
      ],
      correct: 'B',
      marks: 4,
      type: 'MCQ',
      explanation: 'According to BODMAS, 3×4=12, then 2+12=14. So the correct answer is 14.',
    },
    {
      id: 2,
      question: 'Select all prime numbers.',
      options: [
        { id: 'A', text: '15' },
        { id: 'B', text: '23' },
        { id: 'C', text: '29' },
        { id: 'D', text: '21' },
      ],
      correct: ['B', 'C'],
      marks: 4,
      type: 'MSQ',
      explanation: '23 and 29 are prime numbers as they have no divisors other than 1 and themselves.',
    },
    {
      id: 3,
      question: 'Enter the square root of 144.',
      correct: '12',
      marks: 4,
      type: 'NAT',
      explanation: '√144 = 12, since 12 × 12 = 144.',
    },
  ]

  // ---------- Dummy student answers ----------
  const answers: Record<number, string | string[] | null> = {
    1: 'B', // correct
    2: ['B', 'D'], // partially wrong
    3: '12', // correct
  }

  // ---------- Result Calculation ----------
  let correctCount = 0
  let incorrectCount = 0
  let unattemptedCount = 0
  let totalMarks = 0
  let obtained = 0

  questions.forEach((q) => {
    totalMarks += q.marks ?? 1
    const ans = answers[q.id]
    if (!ans || (Array.isArray(ans) && ans.length === 0)) {
      unattemptedCount++
      return
    }

    if (q.type === 'MSQ') {
      const correctArr = Array.isArray(q.correct) ? q.correct.sort() : [q.correct]
      const ansArr = Array.isArray(ans) ? ans.sort() : [ans]
      const isCorrect =
        ansArr.length === correctArr.length && ansArr.every((v, i) => v === correctArr[i])
      if (isCorrect) {
        correctCount++
        obtained += q.marks ?? 1
      } else incorrectCount++
    } else if (q.type === 'NAT') {
      if (String(ans).trim() === String(q.correct).trim()) {
        correctCount++
        obtained += q.marks ?? 1
      } else incorrectCount++
    } else {
      if (String(ans) === String(q.correct)) {
        correctCount++
        obtained += q.marks ?? 1
      } else incorrectCount++
    }
  })

  const percentage = ((obtained / totalMarks) * 100).toFixed(2)

  const container = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } },
  }

  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  }

  // ---------- Render ----------
  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen bg-gradient-to-br from-white via-indigo-50 to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-black transition-colors">
      {/* HEADER SUMMARY */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            Mock Test 1 — Result
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Detailed review of your attempt with explanations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-2xl p-4 bg-white dark:bg-slate-800/60 shadow-md border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-sm text-slate-500 dark:text-slate-300">Score</div>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {obtained} / {totalMarks}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{percentage}%</div>
          </div>

          <div className="rounded-2xl p-4 bg-white dark:bg-slate-800/60 shadow-md border border-slate-100 dark:border-slate-700 text-sm">
            <div className="text-green-600 font-semibold">Correct: {correctCount}</div>
            <div className="text-rose-500">Incorrect: {incorrectCount}</div>
            <div className="text-slate-600 dark:text-slate-300">
              Unattempted: {unattemptedCount}
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
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {questions.map((q, idx) => {
          const ans = answers[q.id]
          const isUnattempted =
            !ans || (Array.isArray(ans) && ans.length === 0) || String(ans).trim() === ''
          let isCorrect = false

          if (!isUnattempted) {
            if (q.type === 'MSQ') {
              const correctArr = Array.isArray(q.correct) ? q.correct.sort() : [q.correct]
              const ansArr = Array.isArray(ans) ? ans.sort() : [ans]
              isCorrect =
                ansArr.length === correctArr.length && ansArr.every((v, i) => v === correctArr[i])
            } else {
              isCorrect = String(ans).trim() === String(q.correct).trim()
            }
          }

          const status = isUnattempted
            ? 'unattempted'
            : isCorrect
            ? 'correct'
            : 'incorrect'

          return (
            <motion.div
              key={q.id}
              variants={item}
              className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-md p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    status === 'correct'
                      ? 'bg-green-100 text-green-700'
                      : status === 'incorrect'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {idx + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white leading-snug">
                      {q.question}
                    </h3>
                    {status === 'correct' && (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Correct
                      </span>
                    )}
                    {status === 'incorrect' && (
                      <span className="flex items-center gap-1 text-rose-500 text-sm">
                        <XCircle className="w-4 h-4" /> Incorrect
                      </span>
                    )}
                    {status === 'unattempted' && (
                      <span className="text-xs text-slate-500">Not Attempted</span>
                    )}
                  </div>

                  {/* Options */}
                  {q.options && (
                    <div className="mt-3 grid gap-2">
                      {q.options.map((opt) => {
                        const chosen = Array.isArray(ans)
                          ? ans.includes(opt.id)
                          : ans === opt.id
                        const correct = Array.isArray(q.correct)
                          ? q.correct.includes(opt.id)
                          : q.correct === opt.id

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-lg flex items-center gap-3 border ${
                              correct
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/40 dark:border-green-700'
                                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            } ${chosen && !correct ? 'ring-2 ring-rose-400 dark:ring-rose-700' : ''}`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold ${
                                correct
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {opt.id}
                            </div>
                            <div className="flex-1 text-sm text-slate-800 dark:text-slate-100">
                              {opt.text}
                            </div>
                            {chosen && !correct && (
                              <span className="px-2 py-1 text-xs rounded bg-rose-500 text-white">
                                Your
                              </span>
                            )}
                            {correct && (
                              <span className="px-2 py-1 text-xs rounded bg-green-600 text-white ml-2">
                                Correct
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* NAT */}
                  {!q.options && (
                    <div className="mt-3 text-sm">
                      <div>
                        <span className="text-slate-500">Your answer: </span>
                        <span className="font-medium text-slate-800 dark:text-white">
                          {ans ?? '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Correct answer: </span>
                        <span className="font-medium text-green-600 dark:text-green-300">
                          {q.correct}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200">
                      <div className="font-medium text-slate-800 dark:text-white mb-1">
                        Explanation
                      </div>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
