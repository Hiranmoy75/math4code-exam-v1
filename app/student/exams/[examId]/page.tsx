'use client'
import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Check,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"

// ---------- TYPES ----------
type Option = { id: string; option_text: string; is_correct?: boolean }
type Question = {
  id: string
  title: string
  question_text: string
  question_type: "MCQ" | "MSQ" | "NAT"
  marks: number
  section_id: string
  correct_answer?: string
  options?: Option[]
}
type Section = { id: string; title: string; questions: Question[] }
type Exam = { id: string; title: string; duration_minutes: number }

// ---------- MAIN COMPONENT ----------
export default function ExamPanelSections() {
  const supabase = createClient()
  const router = useRouter()
  const { examId } = useParams()

  // STATE
  const [exam, setExam] = useState<Exam | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [currentIdxInSection, setCurrentIdxInSection] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [marked, setMarked] = useState<Record<string, boolean>>({})
  const [visited, setVisited] = useState<Record<string, boolean>>({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const timerRef = useRef<number | null>(null)

  // ---------- FETCH DATA ----------
  useEffect(() => {
    async function fetchExam() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/auth/login")

      const { data: examData } = await supabase.from("exams").select("*").eq("id", examId).single()
      if (!examData) return toast.error("Exam not found")
      setExam(examData)
      setSecondsLeft(examData.duration_minutes * 60)

      const { data: sectionsData } = await supabase
        .from("sections")
        .select("*, questions(*, options(*))")
        .eq("exam_id", examId)
        .order("section_order")
      setSections(sectionsData || [])

      // check or create attempt
      const { data: existing } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", user.id)
        .eq("status", "in_progress")
        .single()

      if (existing) {
        setAttemptId(existing.id)
      } else {
        const { data: attempt } = await supabase
          .from("exam_attempts")
          .insert({ exam_id: examId, student_id: user.id, status: "in_progress" })
          .select()
          .single()
        setAttemptId(attempt?.id)
      }
    }
    fetchExam()
  }, [examId])

  // ---------- TIMER ----------
  useEffect(() => {
    if (!secondsLeft) return
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          handleSubmitExam()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [secondsLeft])

  // ---------- SAVE RESPONSES ----------
  const saveResponse = (qid: string, value: any) => {
    setResponses((prev) => ({ ...prev, [qid]: value }))
    setVisited((v) => ({ ...v, [qid]: true }))
  }

  // ---------- QUESTION HELPERS ----------
  const activeSection = sections[activeSectionIdx]
  const currentQuestion = activeSection?.questions?.[currentIdxInSection]

  const nextQuestion = () => {
    if (currentIdxInSection < activeSection.questions.length - 1)
      setCurrentIdxInSection((c) => c + 1)
    else if (activeSectionIdx < sections.length - 1) {
      setActiveSectionIdx((s) => s + 1)
      setCurrentIdxInSection(0)
    }
  }

  const prevQuestion = () => {
    if (currentIdxInSection > 0)
      setCurrentIdxInSection((c) => c - 1)
    else if (activeSectionIdx > 0) {
      setActiveSectionIdx((s) => s - 1)
      setCurrentIdxInSection(sections[activeSectionIdx - 1].questions.length - 1)
    }
  }

  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, "0")
    const ss = (s % 60).toString().padStart(2, "0")
    return `${mm}:${ss}`
  }

  const qStatus = (q: Question) => {
    if (!visited[q.id]) return "notVisited"
    const a = responses[q.id]
    if (Array.isArray(a)) return a.length ? "answered" : "visited"
    return a ? "answered" : "visited"
  }

  // ---------- SUBMIT FUNCTION ----------
  const handleSubmitExam = async () => {
    if (!attemptId) return
    setIsSubmitting(true)
    setShowSubmitDialog(false)

    try {
      // 1️⃣ Save responses
      const entries = Object.entries(responses).map(([qid, ans]) => ({
        attempt_id: attemptId,
        question_id: qid,
        student_answer: Array.isArray(ans) ? JSON.stringify(ans) : ans,
        updated_at: new Date().toISOString(),
      }))

      if (entries.length > 0) {
        const { error: respError } = await supabase.from("responses").upsert(entries, {
          onConflict: "attempt_id,question_id",
        })
        if (respError) throw respError
      }

      // 2️⃣ Mark attempt submitted
      const { error: updateError } = await supabase
        .from("exam_attempts")
        .update({ status: "submitted", submitted_at: new Date().toISOString() })
        .eq("id", attemptId)
      if (updateError) throw updateError

      // 3️⃣ Load questions + options
      const { data: questions } = await supabase
        .from("questions")
        .select("*, options(*)")
        .in("id", Object.keys(responses))
      if (!questions) throw new Error("No questions found")

      // 4️⃣ Load sections
      const sectionIds = Array.from(new Set(questions.map((q: any) => q.section_id)))
      const { data: sections } = await supabase.from("sections").select("*").in("id", sectionIds)
      if (!sections) throw new Error("No sections found")

      // 5️⃣ Evaluate results
      let totalMarks = 0,
        obtainedMarks = 0,
        correct = 0,
        wrong = 0,
        unanswered = 0

      const evalQuestion = (q: any) => {
        const ans = responses[q.id]
        if (!ans || (Array.isArray(ans) && ans.length === 0)) {
          unanswered++
          return 0
        }
        let isCorrect = false
        if (q.question_type === "NAT") {
          isCorrect = Number(ans) === Number(q.correct_answer)
        } else if (q.question_type === "MCQ") {
          const correctOpt = q.options.find((o: any) => o.is_correct)?.id
          isCorrect = ans === correctOpt
        } else if (q.question_type === "MSQ") {
          const correctIds = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id).sort()
          const ansIds = (ans as string[]).sort()
          isCorrect = correctIds.length === ansIds.length && correctIds.every((x: string, i: number) => x === ansIds[i])
        }
        if (isCorrect) {
          correct++
          return q.marks
        } else {
          wrong++
          return 0
        }
      }

      questions.forEach((q: any) => {
        totalMarks += q.marks
        obtainedMarks += evalQuestion(q)
      })

      // 6️⃣ Insert overall result
      const { data: resultData, error: resultError } = await supabase
        .from("results")
        .insert([{
          attempt_id: attemptId,
          total_marks: totalMarks,
          obtained_marks: obtainedMarks,
          percentage: totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0,
        }])
        .select()
        .single()
      if (resultError || !resultData) throw resultError || new Error("Result insert failed")
      const resultId = resultData.id

      // 7️⃣ Section results
      for (const section of sections) {
        const sectionQuestions = questions.filter((q: any) => q.section_id === section.id)
        let sectionTotal = 0, sectionObtained = 0, sectionCorrect = 0, sectionWrong = 0, sectionUnanswered = 0

        sectionQuestions.forEach((q: any) => {
          sectionTotal += q.marks
          const ans = responses[q.id]
          if (!ans || (Array.isArray(ans) && ans.length === 0)) sectionUnanswered++
          else {
            let isCorrect = false
            if (q.question_type === "NAT") isCorrect = Number(ans) === Number(q.correct_answer)
            else if (q.question_type === "MCQ") {
              const correctOpt = q.options.find((o: any) => o.is_correct)?.id
              isCorrect = ans === correctOpt
            } else if (q.question_type === "MSQ") {
              const correctIds = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id).sort()
              const ansIds = (ans as string[]).sort()
              isCorrect = correctIds.length === ansIds.length && correctIds.every((x: string, i: number) => x === ansIds[i])
            }
            if (isCorrect) {
              sectionCorrect++
              sectionObtained += q.marks
            } else sectionWrong++
          }
        })

        const { error: secError } = await supabase.from("section_results").insert({
          result_id: resultId,
          section_id: section.id,
          total_marks: sectionTotal,
          obtained_marks: sectionObtained,
          correct_answers: sectionCorrect,
          wrong_answers: sectionWrong,
          unanswered: sectionUnanswered,
        })
        if (secError) throw secError
      }

      toast.success("✅ Exam submitted successfully!")
      router.push(`/student/results/${attemptId}`)
    } catch (err) {
      console.error("❌ Error submitting exam:", err)
      toast.error("Failed to submit exam. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------- RENDER ----------
  if (!exam || !sections.length)
    return <div className="text-center text-gray-500 py-20">Loading Exam...</div>

  const answeredCount = Object.values(responses).filter((a) => Array.isArray(a) ? a.length : a).length
  const markedCount = Object.values(marked).filter(Boolean).length

  return (
    <div className="w-full min-h-[72vh] flex flex-col lg:flex-row gap-6">
      {/* LEFT SIDE */}
      <div className="flex-1">
        {/* Header */}
        <div className="sticky top-4 z-20">
          <div className="flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white">{exam.title}</h2>
              <div className="flex gap-2 mt-1">
                {sections.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveSectionIdx(i); setCurrentIdxInSection(0) }}
                    className={`px-3 py-1 text-xs rounded-md ${i === activeSectionIdx ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700"}`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold">{formatTime(secondsLeft)}</span>
              <button
                onClick={() => setShowSubmitDialog(true)}
                className="px-3 py-2 bg-rose-500 text-white rounded-lg text-sm font-semibold"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion?.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-4 rounded-2xl p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-700 shadow-lg"
        >
          <div className="text-xs text-slate-500 mb-2">{currentQuestion?.title} • {currentQuestion?.marks} marks</div>
          <h3 className="text-base md:text-xl font-semibold text-slate-800 dark:text-white leading-snug mb-4">{currentQuestion?.question_text}</h3>

          {/* Render by type */}
          {currentQuestion?.question_type === "MCQ" &&
            currentQuestion?.options?.map((opt) => (
              <button
                key={opt.id}
                onClick={() => saveResponse(currentQuestion.id, opt.id)}
                className={`w-full flex items-center gap-3 p-3 mb-2 rounded-lg border ${responses[currentQuestion.id] === opt.id ? "bg-indigo-50 border-indigo-300" : "bg-white border-slate-200"}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${responses[currentQuestion.id] === opt.id ? "bg-indigo-600 text-white" : "border"}`}>
                  {opt.id}
                </div>
                <span>{opt.option_text}</span>
              </button>
            ))}

          {currentQuestion?.question_type === "MSQ" &&
            currentQuestion?.options?.map((opt) => {
              const cur = (responses[currentQuestion.id] || []) as string[]
              const checked = cur.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const next = checked ? cur.filter((x) => x !== opt.id) : [...cur, opt.id]
                    saveResponse(currentQuestion.id, next)
                  }}
                  className={`w-full flex items-center gap-3 p-3 mb-2 rounded-lg border ${checked ? "bg-yellow-50 border-yellow-300" : "bg-white border-slate-200"}`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-sm ${checked ? "bg-yellow-500 text-white" : "border"}`}>
                    {checked ? "✓" : opt.id}
                  </div>
                  <span>{opt.option_text}</span>
                </button>
              )
            })}

          {currentQuestion?.question_type === "NAT" && (
            <input
              type="number"
              value={responses[currentQuestion.id] || ""}
              onChange={(e) => saveResponse(currentQuestion.id, e.target.value)}
              placeholder="Enter numeric answer"
              className="w-full p-3 rounded-lg border border-slate-200 bg-white"
            />
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap justify-between items-center gap-3">
            <div className="flex gap-2">
              <button onClick={prevQuestion} className="px-3 py-2 border rounded-md flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Prev</button>
              <button onClick={nextQuestion} className="px-3 py-2 border rounded-md flex items-center gap-2">Next <ArrowRight className="w-4 h-4" /></button>
            </div>
            <button
              onClick={() => setMarked((m) => ({ ...m, [currentQuestion.id]: !m[currentQuestion.id] }))}
              className={`px-3 py-2 rounded-md ${marked[currentQuestion.id] ? "bg-yellow-500 text-white" : "border"}`}
            >
              {marked[currentQuestion.id] ? "Marked" : "Mark for Review"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* RIGHT: Palette */}
      <div className="hidden lg:block w-80">
        <div className="sticky top-20 bg-white p-4 rounded-xl shadow border space-y-3">
          <h4 className="font-semibold text-slate-800">Palette ({activeSection?.title})</h4>
          <div className="grid grid-cols-5 gap-2">
            {activeSection?.questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdxInSection(i)}
                className={`text-xs py-2 rounded-md ${qStatus(q) === "answered" ? "bg-green-500 text-white" : "bg-slate-100"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SUBMIT MODAL */}
      <AnimatePresence>
        {showSubmitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl max-w-md w-full">
              <h3 className="text-lg font-semibold">Submit Exam?</h3>
              <p className="text-sm text-slate-600 mt-2">
                Once submitted, you cannot change answers.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setShowSubmitDialog(false)} className="border px-4 py-2 rounded-md">Cancel</button>
                <button
                  disabled={isSubmitting}
                  onClick={handleSubmitExam}
                  className="bg-rose-500 text-white px-4 py-2 rounded-md"
                >
                  {isSubmitting ? "Submitting..." : "Yes, Submit"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
