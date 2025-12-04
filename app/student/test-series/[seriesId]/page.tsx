import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { BookOpen, CheckCircle, TrendingUp, Award, RotateCcw } from "lucide-react"
import { revalidatePath } from "next/cache"

export default async function StudentTestSeriesPage({
  params,
}: {
  params: Promise<{ seriesId: string }>
}) {
  const { seriesId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all data in parallel
  const [seriesResult, enrollmentResult, seriesExamsResult] = await Promise.all([
    supabase
      .from("test_series")
      .select("*")
      .eq("id", seriesId)
      .eq("status", "published")
      .single(),
    supabase
      .from("test_series_enrollments")
      .select("*")
      .eq("test_series_id", seriesId)
      .eq("student_id", user?.id)
      .single(),
    supabase
      .from("test_series_exams")
      .select("*, exams(*)")
      .eq("test_series_id", seriesId)
      .order("exam_order", { ascending: true }),
  ])

  const { data: series, error: seriesError } = seriesResult
  const { data: enrollment } = enrollmentResult
  const { data: seriesExams } = seriesExamsResult

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

  const isEnrolled = !!enrollment

  // Fetch exam attempts and results for all exams if enrolled
  let examStats: Record<string, { attempts: number; bestScore: number; remainingAttempts: number; maxAttempts: number | typeof Infinity }> = {}

  if (isEnrolled && user && seriesExams) {
    const examIds = seriesExams.map((se: any) => se.exam_id)

    // Fetch all attempts for these exams
    const { data: attempts } = await supabase
      .from("exam_attempts")
      .select("id, exam_id, status")
      .eq("student_id", user.id)
      .in("exam_id", examIds)

    // Fetch all results for submitted attempts
    const attemptIds = attempts?.filter(a => a.status === "submitted").map(a => a.id) || []
    const { data: results } = attemptIds.length > 0
      ? await supabase
        .from("results")
        .select("attempt_id, obtained_marks")
        .in("attempt_id", attemptIds)
      : { data: [] }

    // Build stats for each exam
    seriesExams.forEach((se: any) => {
      const examAttempts = attempts?.filter(a => a.exam_id === se.exam_id) || []
      const submittedAttempts = examAttempts.filter(a => a.status === "submitted")

      // Get best score from results
      const examResults = results?.filter(r =>
        submittedAttempts.some(a => a.id === r.attempt_id)
      ) || []

      const bestScore = examResults.length > 0
        ? Math.max(...examResults.map(r => parseFloat(r.obtained_marks)))
        : 0

      // Handle max_attempts: NULL, 0, or undefined means unlimited
      // If the column doesn't exist, se.max_attempts will be undefined
      const maxAttempts = se.max_attempts && se.max_attempts > 0 ? se.max_attempts : Infinity
      const remainingAttempts = maxAttempts === Infinity
        ? Infinity
        : Math.max(0, maxAttempts - submittedAttempts.length)

      examStats[se.exam_id] = {
        attempts: submittedAttempts.length,
        bestScore: bestScore,
        remainingAttempts: remainingAttempts,
        maxAttempts: maxAttempts
      }
    })
  }

  async function handleEnroll() {
    "use server"
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from("test_series_enrollments").insert([
      {
        test_series_id: seriesId,
        student_id: user?.id,
      },
    ])

    revalidatePath(`/student/test-series/${seriesId}`)
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
            <div className="space-y-4">
              {seriesExams.map((se: any, index: number) => {
                const stats = examStats[se.exam_id]
                const hasAttempted = stats && stats.attempts > 0

                return (
                  <div
                    key={se.id}
                    className="p-5 border rounded-xl hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                            {index + 1}
                          </span>
                          <h3 className="font-semibold text-lg">{se.exams.title}</h3>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {se.exams.duration_minutes} minutes • {se.exams.total_marks} marks
                          {se.exams.negative_marks > 0 && ` • -${se.exams.negative_marks} for wrong`}
                        </p>

                        {isEnrolled && stats && (
                          <div className="flex flex-wrap gap-3 mt-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                              <RotateCcw className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-700">
                                {stats.attempts} {stats.attempts === 1 ? 'Attempt' : 'Attempts'}
                              </span>
                            </div>

                            {hasAttempted && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
                                <Award className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                  Best: {stats.bestScore.toFixed(2)} marks
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                              <TrendingUp className="w-4 h-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-700">
                                {stats.remainingAttempts === Infinity
                                  ? 'Unlimited attempts'
                                  : `${stats.remainingAttempts} ${stats.remainingAttempts === 1 ? 'attempt' : 'attempts'} left`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {isEnrolled ? (
                          // Check if stats exist and if remaining attempts is exactly 0 (not Infinity)
                          stats && stats.remainingAttempts !== Infinity && stats.remainingAttempts <= 0 ? (
                            <Button size="sm" disabled variant="outline">
                              No Attempts Left
                            </Button>
                          ) : (
                            <Link href={`/student/exams/${se.exam_id}${hasAttempted ? '?retake=true' : ''}`}>
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                {hasAttempted ? 'Retake Exam' : 'Start Exam'}
                              </Button>
                            </Link>
                          )
                        ) : (
                          <Button size="sm" disabled variant="outline">
                            Locked
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No exams in this series yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
