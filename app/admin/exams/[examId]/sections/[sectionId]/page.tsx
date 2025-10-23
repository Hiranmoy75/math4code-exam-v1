"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import SectionQuestionsCard from "./components/SectionQuestionsCard"
import QuestionBankModal from "./components/QuestionBankModal"

export default function ManageSectionQuestionsPage() {
  const params = useParams()
  const examId = params.examId as string
  const sectionId = params.sectionId as string
  const router = useRouter()

  const [questions, setQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBankModal, setShowBankModal] = useState(false)

  const loadQuestions = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("questions").select("*").eq("section_id", sectionId)
      if (error) throw error
      setQuestions(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to load questions")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [sectionId])

 


 const handleRemoveQuestion = async (questionId: string) => {
  try {
    const supabase = createClient()
    
    // Delete the question
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId)

    if (error) throw error

    // Remove the question from local state immediately
    setQuestions((prev) => prev.filter((q) => q.id !== questionId))
  } catch (err: any) {
    setError(err.message || "Failed to remove question")
  }
}


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Questions</h1>
          <p className="text-gray-600">Add questions from your question bank</p>
        </div>
        <button className="btn" onClick={() => router.back()}>Back</button>
      </div>

      {error && <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>}

      <SectionQuestionsCard
        questions={questions}
        isLoading={isLoading}
        onRemoveQuestion={handleRemoveQuestion}
        onAddFromBank={() => setShowBankModal(true)}
      />

      <QuestionBankModal
        show={showBankModal}
        setShow={setShowBankModal}
        sectionId={sectionId}
        reloadQuestions={loadQuestions}
      />
    </div>
  )
}
