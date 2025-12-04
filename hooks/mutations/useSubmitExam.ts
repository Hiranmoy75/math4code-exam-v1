"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { invalidations } from "@/lib/invalidations";
import toast from "react-hot-toast";

interface SubmitExamParams {
    attemptId: string;
    userId: string;
    responses: Record<string, any>;
}

export function useSubmitExam() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ attemptId, userId, responses }: SubmitExamParams) => {
            // Start a transaction-like operation
            // 1. Update attempt status
            const { error: attemptError } = await supabase
                .from("exam_attempts")
                .update({
                    status: "submitted",
                    submitted_at: new Date().toISOString(),
                })
                .eq("id", attemptId);

            if (attemptError) throw attemptError;

            // 2. Save all responses
            const responseEntries = Object.entries(responses).map(([questionId, answer]) => ({
                attempt_id: attemptId,
                question_id: questionId,
                selected_answer: answer,
                answered_at: new Date().toISOString(),
            }));

            if (responseEntries.length > 0) {
                const { error: responsesError } = await supabase
                    .from("responses")
                    .upsert(responseEntries, {
                        onConflict: "attempt_id,question_id",
                    });

                if (responsesError) throw responsesError;
            }

            // 3. Trigger result calculation (this should be done server-side ideally)
            // For now, we'll just return success and let the server handle it
            return { attemptId, success: true };
        },
        onSuccess: (_, variables) => {
            invalidations.afterExamSubmission(
                queryClient,
                variables.userId,
                variables.attemptId
            );
            toast.success("Exam submitted successfully!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to submit exam");
        },
    });
}
