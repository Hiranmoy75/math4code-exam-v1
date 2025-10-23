"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react"
import { toast } from "sonner"

interface Question {
  id: string
  question_text: string
  question_type: "MCQ" | "MSQ" | "NAT"
  marks: number
  options?: Array<{ id: string; option_text: string; option_order: number }>
}

interface Section {
  id: string
  title: string
  duration_minutes: number
  questions: Question[]
}

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string

  const [exam, setExam] = useState<any>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)

  // -------------------------------
  // Load Exam + Create Attempt
  // -------------------------------
  useEffect(() => {
    const loadExam = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: examData } = await supabase.from("exams").select("*").eq("id", examId).single()
      if (!examData) {
        router.push("/student/dashboard")
        return
      }

      setExam(examData)

      const { data: sectionsData } = await supabase
        .from("sections")
        .select("*, questions(*, options(*))")
        .eq("exam_id", examId)
        .order("section_order")

      setSections(sectionsData || [])
      setTimeLeft(examData.duration_minutes * 60)

      // Create or find exam attempt
      const { data: existingAttempt } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", user.id)
        .eq("status", "in_progress")
        .single()

      if (existingAttempt) {
        setAttemptId(existingAttempt.id)
        setIsLoading(false)
        return
      }

      const { data: newAttempt } = await supabase
        .from("exam_attempts")
        .insert({
          exam_id: examId,
          student_id: user.id,
          status: "in_progress",
        })
        .select()
        .single()

      setAttemptId(newAttempt?.id || null)
      setIsLoading(false)
    }

    loadExam()
  }, [examId, router])

  // -------------------------------
  // Timer Countdown
  // -------------------------------
  useEffect(() => {
    if (timeLeft <= 0 || !attemptId) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, attemptId])

  // -------------------------------
  // Auto Save Responses
  // -------------------------------
  useEffect(() => {
    if (!attemptId) return
    const interval = setInterval(() => {
      autoSaveResponses()
    }, 15000)
    return () => clearInterval(interval)
  }, [responses, attemptId])

  const autoSaveResponses = async () => {
    if (!attemptId) return
    setIsAutoSaving(true)
    try {
      const supabase = createClient()
      const entries = Object.entries(responses).map(([questionId, answer]) => ({
        attempt_id: attemptId,
        question_id: questionId,
        student_answer: answer,
      }))

      if (entries.length > 0) {
        const { error } = await supabase.from("responses").upsert(entries, {
          onConflict: "attempt_id,question_id",
        })
        if (error) throw error
      }
    } catch (err) {
      console.log("Auto-save failed", err)
    } finally {
      setIsAutoSaving(false)
    }
  }

  // -------------------------------
  // Handle Final Submission
  // -------------------------------


const handleSubmitExam = async () => {
  if (!attemptId) return

  setIsSubmitting(true)
  setShowSubmitDialog(false)

  const supabase = createClient()

  try {
    // 1️⃣ Save all responses (upsert)
    const entries = Object.entries(responses).map(([questionId, answer]) => ({
      attempt_id: attemptId,
      question_id: questionId,
      student_answer: Array.isArray(answer) ? JSON.stringify(answer) : answer,
      updated_at: new Date().toISOString(),
    }))

    if (entries.length > 0) {
      const { error: respError } = await supabase.from("responses").upsert(entries, {
        onConflict: "attempt_id,question_id",
      })
      if (respError) throw respError
    }

    // 2️⃣ Update exam attempt status
    const { error: updateError } = await supabase
      .from("exam_attempts")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", attemptId)
    if (updateError) throw updateError

    // 3️⃣ Load questions with options
    const { data: questions } = await supabase
      .from("questions")
      .select("*, options(*)")
      .in("id", Object.keys(responses))
    if (!questions) throw new Error("No questions found")

    // 4️⃣ Load sections
    const sectionIds = Array.from(new Set(questions.map((q: any) => q.section_id)))
    const { data: sections } = await supabase
      .from("sections")
      .select("*")
      .in("id", sectionIds)
    if (!sections) throw new Error("No sections found")

    // 5️⃣ Calculate overall result
    let totalMarks = 0
    let obtainedMarks = 0
    let correct = 0
    let wrong = 0
    let unanswered = 0

    const evalQuestion = (q: any) => {
      const ans = responses[q.id]
      if (ans === null || ans === undefined || ans === "" || (Array.isArray(ans) && ans.length === 0)) {
        unanswered++
        return 0
      }

      let isCorrect = false

      if (q.question_type === "NAT") {
        isCorrect = Number(ans) === Number(q.correct_answer)
      } else if (q.question_type === "MCQ") {
        const correctOptionId = q.options.find((o: any) => o.is_correct)?.id
        isCorrect = ans === correctOptionId
      } else if (q.question_type === "MSQ") {
        const correctIds = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id).sort()
        const ansIds = (ans as string[]).sort()
        isCorrect =
          correctIds.length === ansIds.length &&
          correctIds.every((id: string, idx: number) => id === ansIds[idx])
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

    // 6️⃣ Insert into results table
    const { data: resultData, error: resultError } = await supabase
      .from("results")
      .insert([
        {
          attempt_id: attemptId,
          total_marks: totalMarks,
          obtained_marks: obtainedMarks,
          percentage: totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0,
        },
      ])
      .select()
      .single()
    if (resultError || !resultData) throw resultError || new Error("Failed to insert result")
    const resultId = resultData.id

    // 7️⃣ Insert section results
    for (const section of sections) {
      const sectionQuestions = questions.filter((q: any) => q.section_id === section.id)
      let sectionTotal = 0
      let sectionObtained = 0
      let sectionCorrect = 0
      let sectionWrong = 0
      let sectionUnanswered = 0

      sectionQuestions.forEach((q: any) => {
        sectionTotal += q.marks
        const ans = responses[q.id]
        if (ans === null || ans === undefined || ans === "" || (Array.isArray(ans) && ans.length === 0)) {
          sectionUnanswered++
        } else {
          let isCorrect = false
          if (q.question_type === "NAT") {
            isCorrect = Number(ans) === Number(q.correct_answer)
          } else if (q.question_type === "MCQ") {
            const correctOptionId = q.options.find((o: any) => o.is_correct)?.id
            isCorrect = ans === correctOptionId
          } else if (q.question_type === "MSQ") {
            const correctIds = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id).sort()
            const ansIds = (ans as string[]).sort()
            isCorrect =
              correctIds.length === ansIds.length &&
              correctIds.every((id: string, idx: number) => id === ansIds[idx])
          }

          if (isCorrect) {
            sectionCorrect++
            sectionObtained += q.marks
          } else {
            sectionWrong++
          }
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
    toast.error("Failed to submit exam. Please try again.")
  } finally {
    setIsSubmitting(false)
  }
}




  // -------------------------------
  // Utility + UI Handlers
  // -------------------------------
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = async (questionId: string, answer: any) => {
    setResponses((prev) => ({ ...prev, [questionId]: answer }))
    // Immediate autosave after each change
    await autoSaveResponses()
  }

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) newSet.delete(questionId)
      else newSet.add(questionId)
      return newSet
    })
  }

  // -------------------------------
  // Loading & Not Found States
  // -------------------------------
  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading exam...</div>
  if (!exam || sections.length === 0)
    return <div className="flex items-center justify-center h-screen">Exam not found</div>

  const currentSection = sections[currentSectionIndex]
  const currentQuestion = currentSection?.questions?.[currentQuestionIndex]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-sm text-gray-600">{currentSection.title}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 text-red-600" />
            <span className="font-mono font-bold text-red-600">{formatTime(timeLeft)}</span>
          </div>
          {isAutoSaving && <p className="text-xs text-gray-500 animate-pulse">Saving...</p>}
          <Button
            variant="destructive"
            onClick={() => setShowSubmitDialog(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Exam"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 overflow-auto p-6">
          {currentQuestion && (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-lg font-semibold">Question {currentQuestionIndex + 1}</h2>
                    <span className="text-sm font-medium text-gray-600">{currentQuestion.marks} marks</span>
                  </div>
                  <p className="prose prose-sm max-w-none">{currentQuestion.question_text}</p>
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.question_type === "MCQ" && (
                    <div className="space-y-2">
                      {currentQuestion.options?.map((option: any) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50"
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option.id}
                            checked={responses[currentQuestion.id] === option.id}
                            onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
                            className="w-4 h-4"
                          />
                          <span>{option.option_text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.question_type === "MSQ" && (
                    <div className="space-y-2">
                      {currentQuestion.options?.map((option: any) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50"
                        >
                          <Checkbox
                            checked={(responses[currentQuestion.id] || []).includes(option.id)}
                            onCheckedChange={(checked) => {
                              const current = responses[currentQuestion.id] || []
                              if (checked)
                                handleAnswerChange(currentQuestion.id, [...current, option.id])
                              else
                                handleAnswerChange(
                                  currentQuestion.id,
                                  current.filter((id: string) => id !== option.id)
                                )
                            }}
                          />
                          <span>{option.option_text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.question_type === "NAT" && (
                    <div className="space-y-2">
                      <Label>Enter your answer</Label>
                      <Input
                        type="text"
                        placeholder="Enter numerical answer"
                        value={responses[currentQuestion.id] || ""}
                        onChange={(e) =>
                          handleAnswerChange(currentQuestion.id, e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Mark for Review */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleMarkForReview(currentQuestion.id)}
                    className={markedForReview.has(currentQuestion.id) ? "bg-yellow-50" : ""}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    {markedForReview.has(currentQuestion.id)
                      ? "Marked for Review"
                      : "Mark for Review"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Question Palette */}
        <div className="w-64 bg-white border-l p-4 overflow-auto">
          <h3 className="font-semibold mb-4">Questions</h3>
          <div className="space-y-2">
            {currentSection?.questions?.map((q: Question, idx: number) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-full p-2 rounded text-sm font-medium transition-colors ${
                  currentQuestionIndex === idx
                    ? "bg-blue-600 text-white"
                    : responses[q.id]
                    ? "bg-green-100 text-green-900"
                    : markedForReview.has(q.id)
                    ? "bg-yellow-100 text-yellow-900"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-6 space-y-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1)
                } else if (currentSectionIndex > 0) {
                  setCurrentSectionIndex(currentSectionIndex - 1)
                  setCurrentQuestionIndex(sections[currentSectionIndex - 1].questions.length - 1)
                }
              }}
              disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              onClick={() => {
                if (currentQuestionIndex < currentSection.questions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                } else if (currentSectionIndex < sections.length - 1) {
                  setCurrentSectionIndex(currentSectionIndex + 1)
                  setCurrentQuestionIndex(0)
                }
              }}
              disabled={
                currentSectionIndex === sections.length - 1 &&
                currentQuestionIndex === currentSection.questions.length - 1
              }
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to submit the exam? You won't be able to change your answers after submission.
          </AlertDialogDescription>
          <div className="flex gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitExam}>
              {isSubmitting ? "Submitting..." : "Confirm"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
