import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, CheckCircle } from "lucide-react"
import { revalidatePath } from "next/cache"

export default async function StudentTestSeriesPage({
  params,
}: {
  params: { seriesId: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch test series details
  const { data: series, error: seriesError } = await supabase
    .from("test_series")
    .select("*")
    .eq("id", params.seriesId)
    .eq("status", "published")
    .single()

  if (seriesError || !series) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Series Not Found</CardTitle>
            <CardDescription className="text-red-700">
              The test series you're looking for doesn't exist or is not available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/student/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if student is enrolled
  const { data: enrollment } = await supabase
    .from("test_series_enrollments")
    .select("*")
    .eq("test_series_id", params.seriesId)
    .eq("student_id", user?.id)
    .single()

  const isEnrolled = !!enrollment

  // Fetch exams in series
  const { data: seriesExams } = await supabase
    .from("test_series_exams")
    .select("*, exams(*)")
    .eq("test_series_id", params.seriesId)
    .order("exam_order", { ascending: true })

  async function handleEnroll() {
    "use server"
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from("test_series_enrollments").insert([
      {
        test_series_id: params.seriesId,
        student_id: user?.id,
      },
    ])

    revalidatePath(`/student/test-series/${params.seriesId}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{series.title}</h1>
        <p className="text-gray-600 mt-2">{series.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seriesExams?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{series.is_free ? "Free" : `₹${series.price}`}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isEnrolled ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-medium">Enrolled</span>
                </>
              ) : (
                <span className="text-yellow-600 font-medium">Not Enrolled</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {!isEnrolled && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Ready to Start?</CardTitle>
            <CardDescription className="text-blue-800">
              Enroll in this test series to access all exams and track your progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleEnroll}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {series.is_free ? "Enroll Now" : `Enroll for ₹${series.price}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <div>
              <CardTitle>Exams in Series</CardTitle>
              <CardDescription>Complete all exams to master the topics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {seriesExams && seriesExams.length > 0 ? (
            <div className="space-y-3">
              {seriesExams.map((se: any, index: number) => (
                <div
                  key={se.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {index + 1}. {se.exams.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {se.exams.duration_minutes} minutes • {se.exams.total_marks} marks
                      {se.exams.negative_marks > 0 && ` • -${se.exams.negative_marks} for wrong`}
                    </p>
                  </div>
                  {isEnrolled ? (
                    <Link href={`/student/exam/${se.exam_id}`}>
                      <Button size="sm">Start Exam</Button>
                    </Link>
                  ) : (
                    <Button size="sm" disabled variant="outline">
                      Locked
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No exams in this series yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
