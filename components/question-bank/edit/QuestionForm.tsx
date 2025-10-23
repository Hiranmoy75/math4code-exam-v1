"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import { OptionsEditor } from "./OptionsEditor"
import { NATAnswerField } from "./NATAnswerField"
import { QuestionMetadataFields } from "./QuestionMetadataFields"

interface Option {
  id?: string
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
}

export default function QuestionForm() {
  const [formData, setFormData] = useState({
    title: "",
    question_text: "",
    question_type: "MCQ",
    marks: "1",
    negative_marks: "0",
    correct_answer: "",
    explanation: "",
    subject: "",
    topic: "",
    difficulty: "medium",
  })
  const [options, setOptions] = useState<Option[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const params = useParams()
  const questionId = params.questionId as string

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

      setFormData({
        title: questionData.title,
        question_text: questionData.question_text,
        question_type: questionData.question_type,
        marks: String(questionData.marks),
        negative_marks: String(questionData.negative_marks),
        correct_answer: questionData.correct_answer || "",
        explanation: questionData.explanation || "",
        subject: questionData.subject,
        topic: questionData.topic,
        difficulty: questionData.difficulty,
      })

      if (["MCQ", "MSQ"].includes(questionData.question_type)) {
        const { data: optionsData, error: oError } = await supabase
          .from("question_bank_options")
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from("question_bank")
        .update({
          ...formData,
          marks: Number(formData.marks),
          negative_marks: Number(formData.negative_marks),
          correct_answer: formData.question_type === "NAT" ? formData.correct_answer : null,
        })
        .eq("id", questionId)

      if (updateError) throw updateError

      if (["MCQ", "MSQ"].includes(formData.question_type)) {
        await supabase.from("question_bank_options").delete().eq("question_id", questionId)
        await supabase.from("question_bank_options").insert(
          options.map((opt) => ({
            question_id: questionId,
            option_text: opt.option_text,
            option_order: opt.option_order,
            is_correct: opt.is_correct,
          })),
        )
      }

      router.push(`/admin/question-bank/${questionId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Question</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            {/* Basic fields */}
            <div className="grid gap-2">
              <Label>Question Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Question Text</Label>
              <Textarea
                rows={4}
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              />
            </div>

            <QuestionMetadataFields formData={formData} setFormData={setFormData} />

            {["MCQ", "MSQ"].includes(formData.question_type) && (
              <OptionsEditor options={options} setOptions={setOptions} />
            )}

            {formData.question_type === "NAT" && (
              <NATAnswerField formData={formData} setFormData={setFormData} />
            )}

            <div className="grid gap-2">
              <Label>Explanation (optional)</Label>
              <Textarea
                rows={3}
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
