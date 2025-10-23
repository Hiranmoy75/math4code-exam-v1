import { Suspense } from "react"
import ExamsTable from "./components/ExamsTable"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ExamsTableSkeleton from "./components/ExamsTableSkeleton"

export default function ExamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exams</h1>
          <p className="text-gray-600">Manage your test series and exams</p>
        </div>
        <Link href="/admin/exams/create">
          <Button>Create Exam</Button>
        </Link>
      </div>

      <Suspense fallback={<ExamsTableSkeleton />}>
        {/* Suspense for better performance */}
        <ExamsTable />
      </Suspense>
    </div>
  )
}
