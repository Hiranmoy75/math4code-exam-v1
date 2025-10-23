"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  show: boolean
  setShow: (val: boolean) => void
  sectionId: string
  reloadQuestions: () => void
}

export default function QuestionBankModal({ show, setShow, sectionId, reloadQuestions }: Props) {
  const [bankQuestions, setBankQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addingQuestionId, setAddingQuestionId] = useState<string | null>(null) // Track which question is being added

  useEffect(() => {
    if (!show) return

    const loadBank = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("question_bank")
          .select("*")
          .order("created_at", { ascending: false })
        setBankQuestions(data || [])
      } finally {
        setIsLoading(false)
      }
    }

    loadBank()
  }, [show])

  const handleAddQuestion = async (bankQuestionId: string) => {
    try {
      setAddingQuestionId(bankQuestionId) // Disable button during add
      const supabase = createClient()
      await supabase.rpc("add_question_with_options", {
        p_section_id: sectionId,
        p_question_bank_id: bankQuestionId,
      })
      await reloadQuestions()
      setShow(false)
    } catch (err: any) {
      console.error(err.message || "Failed to add question")
    } finally {
      setAddingQuestionId(null)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Select from Question Bank</CardTitle>
          <Button variant="outline" onClick={() => setShow(false)}>Close</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />)
          ) : bankQuestions.length === 0 ? (
            <p className="text-gray-600">No questions in your bank yet.</p>
          ) : (
            bankQuestions.map((q) => (
              <div key={q.id} className="border rounded p-4 flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{q.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{q.question_text.substring(0, 80)}...</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{q.question_type}</span>
                    <span>{q.marks} marks</span>
                    <span>{q.subject}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={addingQuestionId === q.id}
                  onClick={() => handleAddQuestion(q.id)}
                >
                  {addingQuestionId === q.id ? "Adding..." : "Add"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
