import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EmptyExams() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 mb-4">No exams created yet</p>
      <Link href="/admin/exams/create">
        <Button>Create Your First Exam</Button>
      </Link>
    </div>
  )
}
