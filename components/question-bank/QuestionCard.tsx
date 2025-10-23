"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Edit2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Question } from "@/lib/types"

export default function QuestionCard({
  question,
  onDelete,
}: {
  question: any
  onDelete: () => void
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const supabase = createClient()
      await supabase.from("question_bank_options").delete().eq("question_id", question.id)
      await supabase.from("question_bank").delete().eq("id", question.id)
      onDelete()
    } finally {
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold">{question.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{question.question_text}</p>

            {question.explanation && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-sm font-medium text-blue-900">Explanation:</p>
                <p className="text-sm text-blue-800">{question.explanation}</p>
              </div>
            )}

            <div className="flex gap-4 mt-3 text-sm flex-wrap">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{question.question_type}</span>
              <span>{question.marks} marks</span>
              <span>{question.subject}</span>
              <span className="capitalize">{question.difficulty}</span>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/question-bank/${question.id}`)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/question-bank/${question.id}/edit`)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {deleteConfirm && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded flex justify-between items-center">
            <p className="text-sm text-red-800">Are you sure you want to delete this question?</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
