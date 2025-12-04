"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

interface SaveResponseParams {
    attemptId: string;
    questionId: string;
    answer: any;
}

export function useSaveResponse() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ attemptId, questionId, answer }: SaveResponseParams) => {
            const { data, error } = await supabase
                .from("responses")
                .upsert(
                    {
                        attempt_id: attemptId,
                        question_id: questionId,
                        selected_answer: answer,
                        answered_at: new Date().toISOString(),
                    },
                    {
                        onConflict: "attempt_id,question_id",
                    }
                )
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        // Optimistic update for instant UI feedback
        onMutate: async (variables) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: queryKeys.attempts.detail(variables.attemptId),
            });

            // Snapshot previous value
            const previousData = queryClient.getQueryData(
                queryKeys.attempts.detail(variables.attemptId)
            );

            // Optimistically update
            queryClient.setQueryData(
                queryKeys.attempts.detail(variables.attemptId),
                (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        responses: {
                            ...old.responses,
                            [variables.questionId]: variables.answer,
                        },
                    };
                }
            );

            return { previousData };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.attempts.detail(variables.attemptId),
                    context.previousData
                );
            }
        },
        onSettled: (_, __, variables) => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({
                queryKey: queryKeys.attempts.detail(variables.attemptId),
            });
        },
    });
}
