import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen } from "lucide-react"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: testSeries } = await supabase
    .from("test_series")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  // Get student's enrollments
  const { data: enrollments } = await supabase
    .from("test_series_enrollments")
    .select("test_series_id")
    .eq("student_id", user?.id)

  const enrolledSeriesIds = new Set(enrollments?.map((e: any) => e.test_series_id) || [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Available Test Series</h1>
        <p className="text-gray-600">Enroll in test series to access multiple exams</p>
      </div>

      {testSeries && testSeries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testSeries.map((series: any) => {
            const isEnrolled = enrolledSeriesIds.has(series.id)

            return (
              <Card key={series.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{series.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{series.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{series.total_exams} exams</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">{series.is_free ? "Free" : `₹${series.price}`}</span>
                    </div>
                  </div>

                  {isEnrolled ? (
                    <Link href={`/student/test-series/${series.id}`} className="w-full">
                      <Button className="w-full">View Series</Button>
                    </Link>
                  ) : (
                    <Link href={`/student/test-series/${series.id}`} className="w-full">
                      <Button className="w-full">{series.is_free ? "Enroll Now" : "View & Enroll"}</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No test series available yet</p>
            <p className="text-sm text-gray-400">Check back later for new series</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
