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

export function useExamSession(examId: string, userId: string | null, isRetake: boolean = false, enabled: boolean = true) {
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

                // Check max_attempts from the exam configuration
                const maxAttempts = (exam as any).max_attempts

                // Check if student has attempts remaining
                // If maxAttempts is null/undefined, it means unlimited attempts
                const hasAttemptsRemaining = !maxAttempts || submittedAttempts.length < maxAttempts

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
                    throw new Error(`You have reached the maximum number of attempts (${maxAttempts}) for this exam.`)
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
        enabled: !!examId && !!userId && enabled,
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
            sections, // Unused in RPC but kept for signature compatibility if needed
            totalMarks // Unused in RPC
        }: {
            attemptId: string
            examId: string
            responses: Record<string, any>
            sections: Section[]
            totalMarks: number
        }) => {
            console.log("Submitting exam via Secure RPC...", { attemptId, examId })

            // 1. Ensure all local responses are synced one last time (Optimization)
            // Although we auto-saved, sending final state is safer.
            // However, for pure speed, we assume auto-save worked or we do a bulk upsert here first.

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
                if (respError) {
                    console.error("Error saving final responses:", respError)
                    throw new Error(`Failed to sync responses: ${respError.message}`)
                }
            }

            // 2. Call the Secure RPC
            const { data: resultData, error: rpcError } = await supabase
                .rpc('submit_exam_attempt', { p_attempt_id: attemptId, p_exam_id: examId })

            if (rpcError) {
                console.error("RPC Submission Error:", rpcError)
                // Handle duplicate submission gracefully
                if (rpcError.message.includes("already submitted")) {
                    toast.info("Exam was already submitted.")
                    // Fetch existing result
                    const { data: existing } = await supabase.from("results").select("*").eq("attempt_id", attemptId).single()
                    return existing
                }
                throw rpcError
            }

            // If RPC returned an error object inside JSON
            if (resultData && (resultData as any).error) {
                throw new Error((resultData as any).error)
            }

            return resultData
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["test-series-details"] })
            queryClient.invalidateQueries({ queryKey: ["exam-session"] })
            queryClient.invalidateQueries({ queryKey: ["exam-attempts"] })
            toast.success("Exam submitted successfully!")
        },
        onError: (error: any) => {
            console.error("Submission error details:", error)
            toast.error(error.message || "Failed to submit exam.")
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
