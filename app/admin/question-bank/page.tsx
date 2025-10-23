"use client"

import { Suspense, useState } from "react"
import { Button } from "@/components/ui/button"
import QuestionForm from "@/components/question-bank/QuestionForm"
import QuestionList from "@/components/question-bank/QuestionList"
import QuestionSkeleton from "@/components/question-bank/QuestionSkeleton"

export default function QuestionBankPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-gray-600">Manage reusable questions for your exams</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Question"}
        </Button>
      </div>

      {showForm && <QuestionForm onSuccess={() => setShowForm(false)} />}

      <Suspense fallback={<QuestionSkeleton />}>
        <QuestionList />
      </Suspense>
    </div>
  )
}
