"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queryKeys";
import toast from "react-hot-toast";

interface ToggleMarkForReviewParams {
    attemptId: string;
    questionId: string;
    marked: boolean;
}

export function useToggleMarkForReview() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ attemptId, questionId, marked }: ToggleMarkForReviewParams) => {
            // This would typically update a separate table or field
            // For now, we'll use local state with optimistic updates
            return { attemptId, questionId, marked };
        },
        // Optimistic update for instant UI feedback
        onMutate: async (variables) => {
            const queryKey = queryKeys.attempts.detail(variables.attemptId);

            await queryClient.cancelQueries({ queryKey });
            const previousData = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    markedForReview: {
                        ...old.markedForReview,
                        [variables.questionId]: variables.marked,
                    },
                };
            });

            return { previousData };
        },
        onError: (err, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.attempts.detail(variables.attemptId),
                    context.previousData
                );
            }
            toast.error("Failed to update mark status");
        },
    });
}
