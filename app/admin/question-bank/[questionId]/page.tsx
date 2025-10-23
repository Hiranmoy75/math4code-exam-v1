"use client"

import { Suspense, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import QuestionDetails from "@/components/question-bank/view/QuestionDetails"
import OptionList from "@/components/question-bank/view/OptionList"
import QuestionExplanation from "@/components/question-bank/view/QuestionExplanation"
import QuestionViewSkeleton from "@/components/question-bank/view/QuestionViewSkeleton"

interface Option {
  id: string
  option_text: string
  option_order: number
  is_correct: boolean
}

interface Question {
  id: string
  title: string
  question_text: string
  question_type: string
  marks: number
  negative_marks: number
  subject: string
  topic: string
  difficulty: string
  correct_answer?: string
  explanation?: string
  created_at: string
}

export default function ViewQuestionPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { questionId } = useParams()

  useEffect(() => {
    loadQuestion()
  }, [questionId])

  const loadQuestion = async () => {
    try {
      const supabase = createClient()

      const { data: questionData, error: qError } = await supabase
        .from("question_bank")
        .select("*")
        .eq("id", questionId)
        .single()

      if (qError) throw qError
      setQuestion(questionData)

      if (["MCQ", "MSQ"].includes(questionData.question_type)) {
        const { data: optionsData, error: oError } = await supabase
          .from("options")
          .select("*")
          .eq("question_id", questionId)
          .order("option_order", { ascending: true })
        if (oError) throw oError
        setOptions(optionsData || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <QuestionViewSkeleton />
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>
  if (!question) return <div className="p-6">Question not found</div>

  return (
    <Suspense fallback={<QuestionViewSkeleton />}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold">View Question</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{question.title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Question Text */}
            <div>
              <h3 className="font-semibold mb-2">Question</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{question.question_text}</p>
            </div>

            <QuestionDetails question={question} />

            {options.length > 0 && <OptionList options={options} />}

            {question.question_type === "NAT" && (
              <div>
                <h3 className="font-semibold mb-2">Correct Answer</h3>
                <p className="text-lg font-mono bg-gray-100 p-3 rounded">
                  {question.correct_answer}
                </p>
              </div>
            )}

            {question.explanation && (
              <QuestionExplanation explanation={question.explanation} />
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={() => router.push(`/admin/question-bank/${questionId}/edit`)}>
                Edit Question
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Suspense>
  )
}
