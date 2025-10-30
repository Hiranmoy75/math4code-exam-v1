"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

// fetcher function
async function fetchMySeries() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  // enrolled ids
  const { data: enrollments } = await supabase
    .from("test_series_enrollments")
    .select("test_series_id")
    .eq("student_id", user.id)

  const enrolledIds = enrollments?.map((e) => e.test_series_id) || []
  if (enrolledIds.length === 0) return []

  // test series
  const { data: testSeries } = await supabase
    .from("test_series")
    .select("id, title, description")
    .in("id", enrolledIds)

  if (!testSeries) return []

  // for each series fetch exam + attempts and build the merged object
  const merged = await Promise.all(
    (testSeries || []).map(async (series: any) => {
      const { data: exams } = await supabase
        .from("test_series_exams")
        .select("exam_id, exams(id, title, start_time)")
        .eq("test_series_id", series.id)

      const totalExams = exams?.length || 0
      const examIds = exams?.map((e) => e.exam_id) || []

      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select("id, exam_id, status")
        .in("exam_id", examIds)
        .eq("student_id", user.id)

      const completedExams = [
        ...new Set(
          attempts
            ?.filter((a) => ["submitted", "graded"].includes(a.status))
            .map((a) => a.exam_id)
        ),
      ].length

      const now = new Date()
      const upcomingExams = exams
        ?.map((e: any) => e.exams)
        ?.filter((exam: any) => exam?.start_time && new Date(exam.start_time) > now)
        ?.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

      const nextExamDate = upcomingExams?.[0]?.start_time || "Upcoming"

      const progress = totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0

      return {
        ...series,
        totalTests: totalExams,
        testsGiven: completedExams,
        progress,
        nextTest: nextExamDate,
        status: progress >= 100 ? "Completed" : "Ongoing",
        color: progress >= 100 ? "from-green-500 to-emerald-500" : "from-indigo-500 to-purple-500",
      }
    })
  )

  return merged
}

// Hook
export function useMyTestSeries() {
  return useQuery({
    queryKey: ["my-test-series"],
    queryFn: fetchMySeries,
    staleTime: 1000 * 60 * 2, // 2 mins
    gcTime: 1000 * 60 * 15, // 15 mins
    placeholderData: (previousData) => previousData, // keeps previous on refetch -> no UI flash
    retry: 1,
  })
}
