'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Download } from 'lucide-react'
import { toast } from 'sonner'

// ---------- TYPES ----------
type Option = { id: string; option_text: string; is_correct: boolean }
type Question = {
  id: string
  question_text: string
  question_type: 'MCQ' | 'MSQ' | 'NAT'
  marks: number
  correct_answer?: string
  explanation?: string
  options?: Option[]
}

type Section = {
  id: string
  title: string
  questions: Question[]
}

export default function ExamResultPage() {
  const supabase = createClient()
  const { attemptId } = useParams()
  const router = useRouter()

  // ---------- STATE ----------
  const [loading, setLoading] = useState(true)
  const [examTitle, setExamTitle] = useState('')
  const [sections, setSections] = useState<Section[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [totalMarks, setTotalMarks] = useState(0)
  const [obtainedMarks, setObtainedMarks] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [unattemptedCount, setUnattemptedCount] = useState(0)

  // ---------- FETCH DATA ----------
  useEffect(() => {
    async function fetchData() {
      try {
        // get attempt details
        const { data: attempt } = await supabase
          .from('exam_attempts')
          .select('*, exams(title)')
          .eq('id', attemptId)
          .single()
        if (!attempt) throw new Error('Attempt not found')
        setExamTitle(attempt.exams.title)

        // get responses
        const { data: resp } = await supabase
          .from('responses')
          .select('*')
          .eq('attempt_id', attemptId)
        const responseMap: Record<string, any> = {}
        resp?.forEach((r: any) => {
          try {
            responseMap[r.question_id] = JSON.parse(r.student_answer)
          } catch {
            responseMap[r.question_id] = r.student_answer
          }
        })
        setResponses(responseMap)

        // get all questions & sections
        const { data: questions } = await supabase
          .from('questions')
          .select('*, options(*)')
          .in('id', resp?.map((r) => r.question_id) || [])
        if (!questions?.length) throw new Error('Questions not found')

        const sectionIds = [...new Set(questions.map((q) => q.section_id))]
        const { data: sectionsData } = await supabase
          .from('sections')
          .select('*')
          .in('id', sectionIds)

        // attach questions to sections
        const structuredSections = (sectionsData || []).map((s) => ({
          ...s,
          questions: questions.filter((q) => q.section_id === s.id),
        }))
        setSections(structuredSections)

        // ---------- EVALUATION ----------
        let total = 0
        let obtained = 0
        let correct = 0
        let wrong = 0
        let unattempted = 0

        questions.forEach((q: any) => {
          total += q.marks
          const ans = responseMap[q.id]

          if (!ans || (Array.isArray(ans) && ans.length === 0)) {
            unattempted++
            return
          }

          let isCorrect = false

          if (q.question_type === 'MCQ') {
            const correctOpt = q.options.find((o: any) => o.is_correct)?.id
            isCorrect = ans === correctOpt
          } else if (q.question_type === 'MSQ') {
            const correctIds = q.options
              .filter((o: any) => o.is_correct)
              .map((o: any) => o.id)
              .sort()
            const ansIds = (ans as string[]).sort()
            isCorrect =
              correctIds.length === ansIds.length &&
              correctIds.every((x: string, i: number) => x === ansIds[i])
          } else if (q.question_type === 'NAT') {
            isCorrect = String(ans).trim() === String(q.correct_answer).trim()
          }

          if (isCorrect) {
            correct++
            obtained += q.marks
          } else wrong++
        })

        setTotalMarks(total)
        setObtainedMarks(obtained)
        setCorrectCount(correct)
        setIncorrectCount(wrong)
        setUnattemptedCount(unattempted)
      } catch (err: any) {
        console.error(err)
        toast.error('Failed to load results')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [attemptId])

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-slate-500">
        Loading result...
      </div>
    )

  const percentage = ((obtainedMarks / totalMarks) * 100).toFixed(2)

  // ---------- ANIMATION VARIANTS ----------
  const container = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } },
  }

  const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

  // ---------- RENDER ----------
  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen bg-gradient-to-br from-white via-indigo-50 to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-black">
      {/* HEADER SUMMARY */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            {examTitle} — Result
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Detailed review of your attempt with explanations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-2xl p-4 bg-white dark:bg-slate-800/60 shadow-md border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-sm text-slate-500 dark:text-slate-300">Score</div>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {obtainedMarks} / {totalMarks}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {percentage}%
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-white dark:bg-slate-800/60 shadow-md border border-slate-100 dark:border-slate-700 text-sm">
            <div className="text-green-600 font-semibold">
              Correct: {correctCount}
            </div>
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
        {sections.map((section, sIdx) => (
          <div key={section.id}>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
              {section.title}
            </h3>

            {section.questions.map((q, idx) => {
              const ans = responses[q.id]
              const isUnattempted =
                !ans || (Array.isArray(ans) && ans.length === 0) || String(ans).trim() === ''
              let isCorrect = false

              if (!isUnattempted) {
                if (q.question_type === 'MSQ') {
                  const correctArr = q.options
                    ?.filter((o) => o.is_correct)
                    .map((o) => o.id)
                    .sort()
                  const ansArr = (Array.isArray(ans) ? ans : [ans]).sort()
                  isCorrect =
                    correctArr?.length === ansArr.length &&
                    correctArr?.every((v, i) => v === ansArr[i])
                } else if (q.question_type === 'MCQ') {
                  const correctOpt = q.options?.find((o) => o.is_correct)?.id
                  isCorrect = ans === correctOpt
                } else {
                  isCorrect = String(ans).trim() === String(q.correct_answer).trim()
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
                  className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-md p-4 mb-3"
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
                          {q.question_text}
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
                          <span className="text-xs text-slate-500">
                            Not Attempted
                          </span>
                        )}
                      </div>

                      {/* Options or NAT */}
                      {q.question_type !== 'NAT' && q.options && (
                        <div className="mt-3 grid gap-2">
                          {q.options.map((opt) => {
                            const chosen = Array.isArray(ans)
                              ? ans.includes(opt.id)
                              : ans === opt.id
                            const correct = opt.is_correct

                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-lg flex items-center gap-3 border ${
                                  correct
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/40'
                                    : 'bg-white border-slate-200 dark:bg-slate-800/60'
                                } ${chosen && !correct ? 'ring-2 ring-rose-400 dark:ring-rose-700' : ''}`}
                              >
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold ${
                                    correct
                                      ? 'bg-green-500 text-white'
                                      : 'bg-white border border-slate-300'
                                  }`}
                                >
                                  {/* {opt.id} */}
                                </div>
                                <div className="flex-1 text-sm">{opt.option_text}</div>
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

                      {/* NAT Display */}
                      {q.question_type === 'NAT' && (
                        <div className="mt-3 text-sm">
                          <div>
                            <span className="text-slate-500">Your answer: </span>
                            <span className="font-medium">
                              {ans ?? '—'}
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
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
