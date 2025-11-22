"use client"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export async function fetchExamResult(attemptId: string) {
  const supabase = createClient()

  try {
    // 1. Fetch attempt info
    const { data: attempt, error: attemptError } = await supabase
      .from("exam_attempts")
      .select("*, exams(title, id)")
      .eq("id", attemptId)
      .single()

    if (attemptError) {
      console.error("Error fetching attempt:", attemptError)
      throw attemptError
    }
    if (!attempt) throw new Error("Attempt not found")

    const examId = attempt.exam_id
    console.log("Fetching result for exam:", examId)

    // 2. Fetch all responses for this attempt
    const { data: responses, error: responsesError } = await supabase
      .from("responses")
      .select("*")
      .eq("attempt_id", attemptId)

    if (responsesError) {
      console.error("Error fetching responses:", responsesError)
      throw responsesError
    }

    const responseMap: Record<string, any> = {}
    responses?.forEach((r: any) => {
      try {
        responseMap[r.question_id] = JSON.parse(r.student_answer)
      } catch {
        responseMap[r.question_id] = r.student_answer
      }
    })
    console.log("Loaded responses for", Object.keys(responseMap).length, "questions")

    // 3. Fetch ALL sections for this exam
    const { data: sections, error: sectionsError } = await supabase
      .from("sections")
      .select("*")
      .eq("exam_id", examId)
      .order("section_order")

    if (sectionsError) {
      console.error("Error fetching sections:", sectionsError)
      throw sectionsError
    }
    if (!sections?.length) throw new Error("Sections not found")
    console.log("Loaded", sections.length, "sections")

    // 4. Fetch ALL questions for these sections
    const sectionIds = sections.map((s) => s.id)
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*, options(*)")
      .in("section_id", sectionIds)

    if (questionsError) {
      console.error("Error fetching questions:", questionsError)
      throw questionsError
    }
    if (!questions?.length) throw new Error("Questions not found")
    console.log("Loaded", questions.length, "questions")

    // 5. Structure the data by sections
    const structured = sections.map((s) => ({
      ...s,
      questions: questions.filter((q) => q.section_id === s.id),
    }))

    console.log("Result data structured successfully")
    return { attempt, responseMap, structured }
  } catch (error) {
    console.error("Error in fetchExamResult:", error)
    throw error
  }
}

export function useExamResult(attemptId: string) {
  return useQuery({
    queryKey: ["exam-result", attemptId],
    queryFn: () => fetchExamResult(attemptId),
    enabled: !!attemptId,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  })
}
