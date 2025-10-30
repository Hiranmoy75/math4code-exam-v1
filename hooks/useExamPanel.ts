"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export async function fetchExamData(examId: string, userId: string) {
  const supabase = createClient()

  const { data: examData } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .maybeSingle()

  if (!examData) throw new Error("Exam not found")

  const { data: sectionsData } = await supabase
    .from("sections")
    .select("*, questions(*, options(*))")
    .eq("exam_id", examId)
    .order("section_order")

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("exam_id", examId)
    .eq("student_id", userId)
    .order("created_at", { ascending: false })

  let attemptId: string
  const ongoing = attempts?.find((a) => a.status === "in_progress")
  if (ongoing) {
    attemptId = ongoing.id
  } else {
    const { data: newAttempt } = await supabase
      .from("exam_attempts")
      .insert({
        exam_id: examId,
        student_id: userId,
        status: "in_progress",
      })
      .select()
      .single()
    attemptId = newAttempt.id
  }

  return {
    exam: examData,
    sections: sectionsData || [],
    attemptId,
  }
}

export function useExamPanel(examId: string, userId: string) {
  return useQuery({
    queryKey: ["exam-data", examId, userId],
    queryFn: () => fetchExamData(examId, userId),
    enabled: !!examId && !!userId,
    staleTime: 1000 * 60 * 2,
  })
}
