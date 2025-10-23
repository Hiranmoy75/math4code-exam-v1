// app/admin/test-series/page.tsx
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import TestSeriesList from "./components/TestSeriesList"
import TestSeriesSkeleton from "./components/TestSeriesSkeleton"

export default function TestSeriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Series</h1>
          <p className="text-gray-600">Create and manage test series for students</p>
        </div>
        <Link href="/admin/test-series/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Series
          </Button>
        </Link>
      </div>

      {/* Suspense fallback */}
      <Suspense fallback={<TestSeriesSkeleton count={3} />}>
        <TestSeriesList />
      </Suspense>
    </div>
  )
}
