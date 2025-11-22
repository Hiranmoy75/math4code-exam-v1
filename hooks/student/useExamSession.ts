import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export type Option = { id: string; option_text: string; is_correct?: boolean }
export type Question = {
    id: string
    question_text: string
    question_type: "MCQ" | "MSQ" | "NAT"
    marks: number
    negative_marks: number
    correct_answer?: string
    options?: Option[]
    section_id: string
}
export type Section = { id: string; title: string; questions: Question[] }
export type Exam = { id: string; title: string; duration_minutes: number; total_marks?: number }
export type Attempt = { id: string; status: string; exam_id: string; student_id: string; total_time_spent?: number }

export function useExamSession(examId: string, userId: string | null, isRetake: boolean = false) {
    const supabase = createClient()

    return useQuery({
        queryKey: ["exam-session", examId, userId, isRetake],
        queryFn: async () => {
            if (!userId) throw new Error("User not logged in")

            // 1. Fetch Exam Details
            const { data: exam, error: examError } = await supabase
                .from("exams")
                .select("*")
                .eq("id", examId)
                .single()

            if (examError) throw examError
            if (!exam) throw new Error("Exam not found")

            // 2. Fetch Sections with Questions and Options
            const { data: sections, error: sectionsError } = await supabase
                .from("sections")
                .select("*, questions(*, options(*))")
                .eq("exam_id", examId)
                .order("section_order")

            if (sectionsError) throw sectionsError

            // 3. Find or Create Attempt
            let attempt: Attempt | null = null

            const { data: existingAttempts, error: attemptsError } = await supabase
                .from("exam_attempts")
                .select("*")
                .eq("exam_id", examId)
                .eq("student_id", userId)
                .order("created_at", { ascending: false })

            if (attemptsError) throw attemptsError

            // Check if there's an in-progress attempt
            const inProgressAttempt = existingAttempts?.find(a => a.status === "in_progress")

            if (inProgressAttempt) {
                // Resume existing in-progress attempt
                attempt = inProgressAttempt
            } else {
                // Check if there are any submitted attempts
                const submittedAttempts = existingAttempts?.filter(a => a.status === "submitted") || []

                // If there are submitted attempts and NOT explicitly retaking, don't auto-create
                if (submittedAttempts.length > 0 && !isRetake) {
                    throw new Error("This exam has already been submitted. Please return to the test series page to retake the exam.")
                }

                // Check max_attempts before creating (for both first attempt and retakes)
                const { data: seriesExamConfig } = await supabase
                    .from("test_series_exams")
                    .select("max_attempts")
                    .eq("exam_id", examId)
                    .single()

                const maxAttempts = seriesExamConfig?.max_attempts

                // Check if student has attempts remaining
                const hasAttemptsRemaining = !maxAttempts || maxAttempts === 0 || submittedAttempts.length < maxAttempts

                if (hasAttemptsRemaining) {
                    // Create new attempt
                    const { data: newAttempt, error: createError } = await supabase
                        .from("exam_attempts")
                        .insert({ exam_id: examId, student_id: userId, status: "in_progress", total_time_spent: 0 })
                        .select()
                        .single()

                    if (createError) throw createError
                    attempt = newAttempt
                } else {
                    throw new Error("You have reached the maximum number of attempts for this exam.")
                }
            }

            // 4. Fetch Existing Responses
            let previousResponses: Record<string, any> = {}
            if (attempt) {
                const { data: responses, error: respError } = await supabase
                    .from("responses")
                    .select("question_id, student_answer")
                    .eq("attempt_id", attempt.id)

                if (respError) throw respError

                if (responses) {
                    responses.forEach((r) => {
                        try {
                            // Try to parse if it's JSON (for arrays/MSQ), otherwise keep as is
                            const parsed = JSON.parse(r.student_answer)
                            previousResponses[r.question_id] = parsed
                        } catch {
                            previousResponses[r.question_id] = r.student_answer
                        }
                    })
                }
            }

            return {
                exam: exam as Exam,
                sections: sections as Section[],
                attempt: attempt as Attempt,
                previousResponses
            }
        },
        enabled: !!examId && !!userId,
        staleTime: Infinity, // Keep data fresh for the session
        refetchOnWindowFocus: false,
    })
}

export function useUpdateTimer() {
    const supabase = createClient()
    return useMutation({
        mutationFn: async ({ attemptId, timeSpent }: { attemptId: string, timeSpent: number }) => {
            const { error } = await supabase
                .from("exam_attempts")
                .update({ total_time_spent: timeSpent })
                .eq("id", attemptId)
            if (error) throw error
        },
        onError: (err) => {
            console.error("Failed to update timer", err)
        }
    })
}

export function useSubmitExam() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            attemptId,
            examId,
            responses,
            sections,
            totalMarks
        }: {
            attemptId: string
            examId: string
            responses: Record<string, any>
            sections: Section[]
            totalMarks: number
        }) => {
            // 1. Save all responses (Upsert)
            const entries = Object.entries(responses).map(([qid, ans]) => ({
                attempt_id: attemptId,
                question_id: qid,
                student_answer: Array.isArray(ans) ? JSON.stringify(ans) : String(ans),
                updated_at: new Date().toISOString(),
            }))

            if (entries.length > 0) {
                const { error: respError } = await supabase.from("responses").upsert(entries, {
                    onConflict: "attempt_id,question_id",
                })
                if (respError) throw respError
            }

            // 2. Mark attempt as submitted
            const { error: updateError } = await supabase
                .from("exam_attempts")
                .update({ status: "submitted" })
                .eq("id", attemptId)
            if (updateError) throw updateError

            // 3. Calculate Result
            const questionIds = Object.keys(responses)
            let questions: any[] = []
            if (questionIds.length > 0) {
                const { data: qs, error: qError } = await supabase
                    .from("questions")
                    .select("*, options(*)")
                    .in("id", questionIds)
                if (qError) throw qError
                questions = qs || []
            }

            let obtainedMarks = 0
            let correct = 0
            let wrong = 0
            let unanswered = 0

            // Helper to evaluate
            const evaluateQuestion = (q: any) => {
                const ans = responses[q.id]
                const correctMarks = q.marks ?? 0
                const negativeMarks = q.negative_marks ?? 0

                if (!ans || (Array.isArray(ans) && ans.length === 0)) {
                    unanswered++
                    return 0
                }

                let isCorrect = false
                if (q.question_type === "NAT") {
                    isCorrect = Number(ans) === Number(q.correct_answer)
                } else if (q.question_type === "MCQ") {
                    const correctOpt = q.options.find((o: any) => o.is_correct)?.id
                    isCorrect = ans === correctOpt
                } else if (q.question_type === "MSQ") {
                    const correctIds = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id).sort()
                    const ansIds = (Array.isArray(ans) ? ans : [ans]).sort()
                    isCorrect = correctIds.length === ansIds.length && correctIds.every((x: string, i: number) => x === ansIds[i])
                }

                if (isCorrect) {
                    correct++
                    return correctMarks
                }
                wrong++
                return -Math.abs(negativeMarks)
            }

            questions.forEach((q) => {
                obtainedMarks += evaluateQuestion(q)
            })

            const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0

            // 4. Insert Result
            const { data: resultRow, error: resultError } = await supabase
                .from("results")
                .insert([
                    {
                        attempt_id: attemptId,
                        total_marks: totalMarks,
                        obtained_marks: obtainedMarks.toFixed(2),
                        percentage: percentage.toFixed(2),
                    },
                ])
                .select()
                .single()

            if (resultError) throw resultError

            // 5. Insert Section Results
            for (const section of sections) {
                const sectionQuestions = section.questions
                let sectionTotal = 0,
                    sectionObtained = 0,
                    sectionCorrect = 0,
                    sectionWrong = 0,
                    sectionUnanswered = 0

                sectionQuestions.forEach((q) => {
                    sectionTotal += q.marks
                    const ans = responses[q.id]
                    const correctMarks = q.marks ?? 0
                    const negativeMarks = q.negative_marks ?? 0

                    if (!ans || (Array.isArray(ans) && ans.length === 0)) {
                        sectionUnanswered++
                        return
                    }

                    let isCorrect = false
                    if (q.question_type === "NAT") {
                        isCorrect = Number(ans) === Number(q.correct_answer)
                    } else if (q.question_type === "MCQ") {
                        const correctOpt = q.options?.find((o) => o.is_correct)?.id
                        isCorrect = ans === correctOpt
                    } else if (q.question_type === "MSQ") {
                        const correctIds = q.options?.filter((o) => o.is_correct).map((o) => o.id).sort() || []
                        const ansIds = (Array.isArray(ans) ? ans : [ans]).sort()
                        isCorrect = correctIds.length === ansIds.length && correctIds.every((x, i) => x === ansIds[i])
                    }

                    if (isCorrect) {
                        sectionCorrect++
                        sectionObtained += correctMarks
                    } else {
                        sectionWrong++
                        sectionObtained -= Math.abs(negativeMarks)
                    }
                })

                const { error: secError } = await supabase.from("section_results").insert({
                    result_id: resultRow.id,
                    section_id: section.id,
                    total_marks: sectionTotal,
                    obtained_marks: sectionObtained,
                    correct_answers: sectionCorrect,
                    wrong_answers: sectionWrong,
                    unanswered: sectionUnanswered,
                })
                if (secError) throw secError
            }

            return resultRow
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["test-series-details"] })
            queryClient.invalidateQueries({ queryKey: ["exam-session"] })
            toast.success("Exam submitted successfully!")
        },
        onError: (error) => {
            console.error("Submission error:", error)
            toast.error("Failed to submit exam.")
        }
    })
}

export function useSaveAnswer() {
    const supabase = createClient()
    return useMutation({
        mutationFn: async ({ attemptId, questionId, answer }: { attemptId: string, questionId: string, answer: any }) => {
            const { error } = await supabase.from("responses").upsert({
                attempt_id: attemptId,
                question_id: questionId,
                student_answer: Array.isArray(answer) ? JSON.stringify(answer) : String(answer),
                updated_at: new Date().toISOString(),
            }, { onConflict: "attempt_id,question_id" })
            if (error) throw error
        },
        onError: (err) => {
            console.error("Failed to save answer", err)
        }
    })
}
