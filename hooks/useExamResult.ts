"use client"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export async function fetchExamResult(attemptId: string) {
  const supabase = createClient()

  // attempt info
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("*, exams(title)")
    .eq("id", attemptId)
    .single()
  if (!attempt) throw new Error("Attempt not found")

  // responses
  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .eq("attempt_id", attemptId)

  const responseMap: Record<string, any> = {}
  responses?.forEach((r: any) => {
    try {
      responseMap[r.question_id] = JSON.parse(r.student_answer)
    } catch {
      responseMap[r.question_id] = r.student_answer
    }
  })

  // questions + options
  const { data: questions } = await supabase
    .from("questions")
    .select("*, options(*)")
    .in("id", responses?.map((r) => r.question_id) || [])
  if (!questions?.length) throw new Error("Questions not found")

  // sections
  const sectionIds = [...new Set(questions.map((q) => q.section_id))]
  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .in("id", sectionIds)

  // attach
  const structured = (sections || []).map((s) => ({
    ...s,
    questions: questions.filter((q) => q.section_id === s.id),
  }))

  return { attempt, responseMap, structured }
}

export function useExamResult(attemptId: string) {
  return useQuery({
    queryKey: ["exam-result", attemptId],
    queryFn: () => fetchExamResult(attemptId),
    enabled: !!attemptId,
    staleTime: 1000 * 60 * 2,
  })
}
