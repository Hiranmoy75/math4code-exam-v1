"use client"
import { Button } from "@/components/ui/button"

export default function QuestionItem({ question, idx, onRemove }: any) {
  return (
    <div className="border rounded p-4 flex justify-between items-start">
      <div className="flex-1">
        <p className="font-semibold">Q{idx + 1}</p>
        <p className="text-sm mt-1">{question.question_text.substring(0, 100)}...</p>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{question.question_type}</span>
          <span>{question.marks} marks</span>
        </div>
      </div>
      <Button variant="destructive" size="sm" onClick={() => onRemove(question.id)}>Remove</Button>
    </div>
  )
}
