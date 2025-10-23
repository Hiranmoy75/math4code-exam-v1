"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import QuestionCard from "./QuestionCard"
import { Question } from "@/lib/types"

export default function QuestionList() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("question_bank")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setQuestions(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return null
  if (error) return <p className="text-red-500">{error}</p>
  if (questions.length === 0)
    return <p className="text-gray-600">No questions in your bank yet. Create one to get started!</p>

  return (
    <div className="grid gap-4">
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} onDelete={loadQuestions} />
      ))}
    </div>
  )
}
