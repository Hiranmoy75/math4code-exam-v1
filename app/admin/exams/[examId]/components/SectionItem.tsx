"use client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function SectionItem({ section, examId }: any) {
  const router = useRouter()
  return (
    <div className="border rounded p-4 flex justify-between items-start">
      <div>
        <h4 className="font-semibold">{section.title}</h4>
        <div className="flex gap-4 mt-2 text-sm text-gray-600">
          <span>{section.duration_minutes} min</span>
          <span>{section.total_marks} marks</span>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => router.push(`/admin/exams/${examId}/sections/${section.id}`)}>Manage Questions</Button>
    </div>
  )
}
