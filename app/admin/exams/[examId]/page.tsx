import { Suspense } from "react"
import ExamDetailsCard from "./components/ExamDetailsCard"
import SectionsCard from "./components/SectionsCard"
import ExamDetailsSkeleton from "./components/ExamDetailsSkeleton"
import SectionsSkeleton from "./components/SectionsSkeleton"

export default function EditExamPageWrapper() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<ExamDetailsSkeleton />}>
        <ExamDetailsCard />
      </Suspense>
      <Suspense fallback={<SectionsSkeleton />}>
        <SectionsCard />
      </Suspense>
    </div>
  )
}
