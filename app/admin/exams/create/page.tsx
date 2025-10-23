import { Suspense } from "react"
import ExamForm from "./components/ExamForm"
import ExamFormSkeleton from "./components/ExamFormSkeleton"

export default function CreateExamPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Exam</h1>
        <p className="text-gray-600">Set up a new test series for your students</p>
      </div>

      <Suspense fallback={<ExamFormSkeleton />}>
        <ExamForm />
      </Suspense>
    </div>
  )
}
