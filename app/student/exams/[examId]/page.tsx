"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Flag,
  Menu,
  X,
  FileText,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { renderWithLatex } from "@/lib/renderWithLatex"
import { useQueryClient } from "@tanstack/react-query"

// ---------- TYPES ----------
type Option = { id: string; option_text: string; is_correct?: boolean }
type Question = {
  id: string
  question_text: string
  question_type: "MCQ" | "MSQ" | "NAT"
  marks: number
  negative_marks: number
  correct_answer?: string
  options?: Option[]
  section_id: string
}
type Section = { id: string; title: string; questions: Question[] }
type Exam = { id: string; title: string; duration_minutes: number }

export default function ExamPanelSections() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()
  const { examId } = useParams()

  const [userId, setUserId] = useState<string | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [marked, setMarked] = useState<Record<string, boolean>>({})
  const [visited, setVisited] = useState<Record<string, boolean>>({})
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paletteOpenMobile, setPaletteOpenMobile] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)

  const timerRef = useRef<number | null>(null)

  // ---------- FETCH EXAM DATA ----------
  useEffect(() => {
    async function loadExam() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/auth/login")
      setUserId(user.id)

      const { data: examData } = await supabase.from("exams").select("*").eq("id", examId).single()
      if (!examData) return toast.error("Exam not found")

      setExam(examData)
      setSecondsLeft(examData.duration_minutes * 60)

      const { data: sectionsData } = await supabase
        .from("sections")
        .select("*, questions(*, options(*))")
        .eq("exam_id", examId)
        .order("section_order")

      if (sectionsData) setSections(sectionsData)

      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })

      if (attempts && attempts.length > 0 && attempts[0].status != "submitted") {
        setAttemptId(attempts[0].id)
      } else {
        const { data: newAttempt } = await supabase
          .from("exam_attempts")
          .insert({ exam_id: examId, student_id: user.id, status: "in_progress" })
          .select()
          .single()
        setAttemptId(newAttempt?.id)
      }
    }

    loadExam()
  }, [examId])

  // ---------- TIMER ----------
  useEffect(() => {
    if (!secondsLeft) return
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [secondsLeft])

  // ---------- HELPER FUNCTIONS ----------
  const allQuestions = sections.flatMap((s) => s.questions)
  const currentQuestion = allQuestions[activeQuestionIdx]

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0")
    const sec = (s % 60).toString().padStart(2, "0")
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`
  }

  const saveResponse = (qid: string, ans: any) => {
    setResponses((r) => ({ ...r, [qid]: ans }))
    setVisited((v) => ({ ...v, [qid]: true }))
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

  // ---------- SUBMIT ----------
   // ---- SUBMIT ----
const handleSubmit = async () => {
  if (!attemptId) return

  setIsSubmitting(true)
  setShowSubmitDialog(false)

  try {
    // 1️⃣ Save all responses
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

    // 2️⃣ Mark exam attempt as submitted
    const { error: updateError } = await supabase
      .from("exam_attempts")
      .update({ status: "submitted" })
      .eq("id", attemptId)
    if (updateError) throw updateError

    // 3️⃣ Load all attempted questions
    const { data: questions, error: qError } = await supabase
      .from("questions")
      .select("*, options(*)")
      .in("id", Object.keys(responses))
    if (qError || !questions) throw qError || new Error("No questions found")

      //find total marks of the exam 

     const { data: examsmarks, error: eError } = await supabase
          .from("exams")
          .select("total_marks")
          .eq("id", examId)

if (eError || !examsmarks?.length) throw new Error("Exam not found")

  console.log("exammarks",examsmarks)

// ✅ Calculate total marks correctly
const totalMarks = examsmarks.reduce((sum, e) => sum + (e.total_marks ?? 0), 0)
  console.log("exammarks",totalMarks)
 

    // 4️⃣ Load all related sections
    const sectionIds = Array.from(new Set(questions.map((q: any) => q.section_id)))
    const { data: sections, error: sError } = await supabase
      .from("sections")
      .select("*")
      .in("id", sectionIds)
    if (sError || !sections) throw sError || new Error("No sections found")

    // 5️⃣ Evaluate responses with negative marking
 
    let obtainedMarks = 0
    let correct = 0
    let wrong = 0
    let unanswered = 0

    const evaluateQuestion = (q: any) => {
      const ans = responses[q.id]
      const correctMarks = q.marks ?? 0
      const negativeMarks = q.negative_marks ?? 0

      // ❌ Not Attempted
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

      // ✅ Correct
      if (isCorrect) {
        correct++
        return correctMarks
      }
      // ❌ Wrong
      wrong++
      return -Math.abs(negativeMarks)
    }

    questions.forEach((q: any) => {
      obtainedMarks += evaluateQuestion(q)
    })

    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0

    // 6️⃣ Insert into results
    const { data: resultRow, error: resultError } = await supabase
      .from("results")
      .insert([
        {
          attempt_id: attemptId,
          total_marks: totalMarks,
          obtained_marks: obtainedMarks.toFixed(2),
          percentage: percentage.toFixed(2),
        },
      ])
      .select()
      .single()
    if (resultError || !resultRow) throw resultError || new Error("Failed to insert result")
    const resultId = resultRow.id

    // 7️⃣ Insert section results (also consider negative marks)
    for (const section of sections) {
      const sectionQuestions = questions.filter((q: any) => q.section_id === section.id)
      let sectionTotal = 0,
        sectionObtained = 0,
        sectionCorrect = 0,
        sectionWrong = 0,
        sectionUnanswered = 0

      sectionQuestions.forEach((q: any) => {
        const ans = responses[q.id]
        const correctMarks = q.marks ?? 0
        const negativeMarks = q.negative_marks ?? 0

        sectionTotal += q.marks

        if (!ans || (Array.isArray(ans) && ans.length === 0)) {
          sectionUnanswered++
          return
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
          sectionCorrect++
          sectionObtained += correctMarks
        } else {
          sectionWrong++
          sectionObtained -= Math.abs(negativeMarks)
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
     // ✅ 8️⃣ Trigger React Query Refetch
    queryClient.invalidateQueries({ queryKey: ["test-series-details"] })

    toast.success("✅ Exam submitted successfully with negative marking!")
    router.push(`/student/results/${resultRow.id}?attemptId=${attemptId}`)
  } catch (err) {
    console.error("❌ Submission Error:", err)
    toast.error("Failed to submit exam. Try again.")
  } finally {
    setIsSubmitting(false)
  }
}

  // ---------- LOADING ----------
  if (!exam || !sections.length)
    return (
      <div className="flex items-center justify-center h-[70vh] text-slate-500">
        Loading Exam Interface...
      </div>
    )

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_360px] bg-slate-50 text-slate-800">
      {/* LEFT PANEL */}
      <div className="p-4 md:p-6">
        {/* HEADER NAV */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 py-3 px-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-indigo-700">{exam.title}</h2>
            <div className="flex gap-2 mt-2">
              {sections.map((s, i) => {
                const startIdx = sections.slice(0, i).reduce((a, b) => a + b.questions.length, 0)
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveQuestionIdx(startIdx)}
                    className={`px-3 py-1 text-xs rounded-md ${
                      activeQuestionIdx >= startIdx &&
                      activeQuestionIdx < startIdx + s.questions.length
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {s.title}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Clock className="w-4 h-4 text-emerald-600" />
              <div className="text-sm font-semibold">{formatTime(secondsLeft)}</div>
            </div>
            <button
              onClick={() => setShowSubmitDialog(true)}
              className="hidden sm:block bg-rose-500 text-white px-3 py-2 rounded-md text-sm"
            >
              Submit
            </button>
            <button
              onClick={() => setPaletteOpenMobile(true)}
              className="block sm:hidden bg-indigo-600 text-white px-3 py-2 rounded-md text-sm"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QUESTION CARD */}
        <motion.div
          key={currentQuestion?.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-5 p-5 bg-white rounded-2xl shadow border"
        >
          <div className="text-sm text-slate-500 mb-2">
            Question {activeQuestionIdx + 1} • Marks: {currentQuestion?.marks} | Negative:{" "}
            {currentQuestion?.negative_marks}
          </div>
          <h3 className="text-base md:text-lg font-semibold mb-4">
            {renderWithLatex(currentQuestion?.question_text)}
          </h3>

          {/* OPTIONS */}
          {currentQuestion?.question_type === "MCQ" &&
            currentQuestion?.options?.map((opt, idx) => {
              const chosen = responses[currentQuestion.id] === opt.id
              const optionLabel = String.fromCharCode(65 + idx) // A, B, C, D
              return (
                <button
                  key={opt.id}
                  onClick={() => saveResponse(currentQuestion.id, opt.id)}
                  className={`w-full text-left p-3 mb-2 rounded-lg border flex items-center gap-3 ${
                    chosen ? "bg-indigo-50 border-indigo-400" : "bg-white border-slate-200"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      chosen
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-300 text-slate-600"
                    }`}
                  >
                    {optionLabel}
                  </div>
                  <span>{renderWithLatex(opt.option_text)}</span>
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
                    saveResponse(currentQuestion.id, next)
                  }}
                  className={`w-full text-left p-3 mb-2 rounded-lg border flex items-center gap-3 ${
                    checked ? "bg-yellow-50 border-yellow-400" : "bg-white border-slate-200"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${
                      checked ? "bg-yellow-500 text-white" : "border border-slate-300"
                    }`}
                  >
                    {optionLabel}
                  </div>
                  <span>{renderWithLatex(opt.option_text)}</span>
                </button>
              )
            })}

          {currentQuestion?.question_type === "NAT" && (
            <input
              type="number"
              className="w-full p-3 rounded-lg border border-slate-200 bg-white"
              placeholder="Enter numeric answer"
              value={responses[currentQuestion.id] || ""}
              onChange={(e) => saveResponse(currentQuestion.id, e.target.value)}
            />
          )}

          {/* ACTION BUTTONS */}
          <div className="mt-6 flex flex-wrap justify-between items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={prevQuestion}
                disabled={activeQuestionIdx === 0}
                className="px-4 py-2 border rounded-md flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => saveResponse(currentQuestion.id, null)}
                className="px-4 py-2 border rounded-md"
              >
                Clear Response
              </button>
              <button
                onClick={() => {
                  setMarked((m) => ({ ...m, [currentQuestion.id]: !m[currentQuestion.id] }))
                  nextQuestion()
                }}
                className={`px-4 py-2 rounded-md ${
                  marked[currentQuestion.id] ? "bg-yellow-500 text-white" : "border"
                }`}
              >
                <Flag className="w-4 h-4" /> Mark & Next
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={nextQuestion}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white"
              >
                Save & Next
              </button>
              <button
                onClick={() => setShowSubmitDialog(true)}
                className="px-4 py-2 rounded-md bg-rose-500 text-white"
              >
                Submit
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT PALETTE */}
      <div className="hidden lg:block bg-white border-l border-slate-200 p-5">
        <h4 className="font-semibold text-indigo-700 mb-3">Question Palette</h4>
        <div className="grid grid-cols-5 gap-2">
          {allQuestions.map((q, i) => {
            const status = qStatus(q)
            const cls =
              status === "answered"
                ? "bg-green-500 text-white"
                : marked[q.id]
                ? "bg-yellow-400 text-white"
                : status === "visited"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-slate-200 text-slate-700"
            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestionIdx(i)}
                className={`py-2 rounded-md text-xs font-medium ${cls}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* MOBILE PALETTE DRAWER */}
      <AnimatePresence>
        {paletteOpenMobile && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-xl border-l border-slate-200"
          >
            <div className="p-4 flex items-center justify-between border-b">
              <h4 className="font-semibold text-indigo-700">Question Palette</h4>
              <button onClick={() => setPaletteOpenMobile(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-5 gap-2">
              {allQuestions.map((q, i) => {
                const status = qStatus(q)
                const cls =
                  status === "answered"
                    ? "bg-green-500 text-white"
                    : marked[q.id]
                    ? "bg-yellow-400 text-white"
                    : status === "visited"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-200 text-slate-700"
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setActiveQuestionIdx(i)
                      setPaletteOpenMobile(false)
                    }}
                    className={`py-2 rounded-md text-xs font-medium ${cls}`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUBMIT DIALOG */}
      <AnimatePresence>
        {showSubmitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
              <h3 className="text-lg font-semibold">Submit Exam?</h3>
              <p className="text-sm text-slate-600 mt-2">
                Once submitted, you cannot change your answers.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setShowSubmitDialog(false)}
                  className="border px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleSubmit}
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
