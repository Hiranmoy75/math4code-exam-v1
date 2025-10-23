import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { addExamToSeries, removeExamFromSeries, publishTestSeries } from "../actions"
import SeriesStats from "./components/SeriesStats"
import ExamsInSeries from "./components/ExamsInSeries"
import PublishButton from "./components/PublishButton"

export default async function TestSeriesDetailPage({
  params,
}: {
  params: { seriesId: string }
}) {
  if (params.seriesId === "create") {
    redirect("/admin/test-series/create")
  }

  const supabase = await createClient()

  const { data: series, error: seriesError } = await supabase
    .from("test_series")
    .select("*")
    .eq("id", params.seriesId)
    .single()

  if (seriesError || !series) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Series Not Found</CardTitle>
            <CardDescription className="text-red-700">
              The test series you're looking for doesn't exist or hasn't been created yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: seriesExams } = await supabase
    .from("test_series_exams")
    .select("*, exams(*)")
    .eq("test_series_id", params.seriesId)
    .order("exam_order", { ascending: true })

  const { data: allExams } = await supabase
    .from("exams")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  const addedExamIds = new Set(seriesExams?.map((se: any) => se.exam_id) || [])
  const availableExams =
    allExams?.filter((exam: any) => !addedExamIds.has(exam.id)) || []

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{series.title}</h1>
          <p className="text-gray-600">{series.description}</p>
        </div>

        {/* Publish Button */}
        <PublishButton
          seriesId={params.seriesId}
          isPublished={series.status === "published"}
          publishAction={publishTestSeries}
        />
      </header> 

      <SeriesStats
        totalExams={seriesExams?.length || 0}
        price={series.is_free ? "Free" : `₹${series.price}`}
        status={series.status}
      />

      <ExamsInSeries
        seriesId={params.seriesId}
        seriesExams={seriesExams || []}
        availableExams={availableExams}
        addExamToSeries={addExamToSeries}
        removeExamFromSeries={removeExamFromSeries}
      />
    </div>
  )
}
