"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

async function fetchTestSeriesDetails(seriesId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { seriesInfo: null, tests: [], isEnrolled: false }

  const { data: series } = await supabase
    .from("test_series")
    .select("*")
    .eq("id", seriesId)
    .single()

  if (!series) return { seriesInfo: null, tests: [], isEnrolled: false }

  const { data: enrollment } = await supabase
    .from("test_series_enrollments")
    .select("*")
    .eq("test_series_id", seriesId)
    .eq("student_id", user.id)
    .single()

  const isEnrolled = !!enrollment

  const { data: exams } = await supabase
    .from("test_series_exams")
    .select(`
      id,
      exam_order,
      exams:exam_id (
        id,
        title,
        duration_minutes,
        total_marks,
        exam_attempts (
          id,
          student_id,
          status,
          submitted_at,
          results (id, obtained_marks)
        )
      )
    `)
    .eq("test_series_id", seriesId)
    .order("exam_order", { ascending: true })

  const tests =
    exams?.map((item: any) => {
      const exam = item.exams
      const studentAttempts =
        exam.exam_attempts?.filter((a: any) => a.student_id === user.id) || []

      let highestScore = null
      if (studentAttempts.length > 0) {
        const scores = studentAttempts
          .map((a: any) => a.results?.[0]?.obtained_marks)
          .filter((s: any) => s !== undefined && s !== null)
        if (scores.length > 0) highestScore = Math.max(...scores)
      }

      const latestAttempt = studentAttempts[studentAttempts.length - 1]
      const result = latestAttempt?.results?.[0]

      let status = "Locked"
      if (studentAttempts.length === 0) {
        status = "Not Started"
      } else if (latestAttempt?.status === "in_progress") {
        status = "Ongoing"
      } else if (
        latestAttempt?.status === "submitted" ||
        latestAttempt?.status === "graded"
      ) {
        status = "Completed"
      }

      return {
        id: exam.id,
        name: exam.title,
        duration: `${exam.duration_minutes} mins`,
        marks: exam.total_marks,
        status,
        score: highestScore,
        attemptsCount: studentAttempts.length,
        canReattempt: studentAttempts.length < 2,
        lastAttemptId: latestAttempt?.id,
      }
    }) || []

  return { seriesInfo: series, tests, isEnrolled }
}

export function useTestSeriesDetails(seriesId: string) {
  return useQuery({
    queryKey: ["test-series-details", seriesId],
    queryFn: () => fetchTestSeriesDetails(seriesId),
    staleTime: 1000 * 60 * 5,
    enabled: !!seriesId,
  })
}
