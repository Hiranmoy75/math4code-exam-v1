"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  questions: any[]
  isLoading: boolean
  onRemoveQuestion: (id: string) => void
  onAddFromBank: () => void
}

export default function SectionQuestionsCard({ questions, isLoading, onRemoveQuestion, onAddFromBank }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Section Questions</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle>Section Questions ({questions.length})</CardTitle>
          <CardDescription>Questions added to this section</CardDescription>
        </div>
        <Button onClick={onAddFromBank}>Add from Bank</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {questions.length === 0 ? (
          <p className="text-gray-600">No questions added yet.</p>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="border rounded p-4 flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold">Q{idx + 1}</p>
                <p className="text-sm mt-1">{q.question_text.substring(0, 100)}...</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{q.question_type}</span>
                  <span>{q.marks} marks</span>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={() => onRemoveQuestion(q.id)}>Remove</Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
