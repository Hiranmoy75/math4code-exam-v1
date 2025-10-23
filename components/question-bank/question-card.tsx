"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Edit2, Trash2 } from "lucide-react"
import Link from "next/link"

interface QuestionCardProps {
  question: {
    id: string
    title: string
    question_text: string
    question_type: string
    marks: number
    subject: string
    difficulty: string
    explanation?: string
  }
  onDelete: (id: string) => void
}

export function QuestionCard({ question, onDelete }: QuestionCardProps) {
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
            <Link href={`/admin/question-bank/${question.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/admin/question-bank/${question.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit2 className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={() => onDelete(question.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
