"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { invalidations } from "@/lib/invalidations";
import toast from "react-hot-toast";

interface EnrollTestSeriesParams {
    seriesId: string;
    userId: string;
}

export function useEnrollTestSeries() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ seriesId, userId }: EnrollTestSeriesParams) => {
            // Check if already enrolled
            const { data: existing } = await supabase
                .from("test_series_enrollments")
                .select("id")
                .eq("student_id", userId)
                .eq("test_series_id", seriesId)
                .single();

            if (existing) {
                throw new Error("Already enrolled in this test series");
            }

            // Create enrollment
            const { data, error } = await supabase
                .from("test_series_enrollments")
                .insert({
                    student_id: userId,
                    test_series_id: seriesId,
                    enrolled_at: new Date().toISOString(),
                    status: "active",
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            invalidations.afterTestSeriesEnrollment(
                queryClient,
                variables.userId,
                variables.seriesId
            );
            toast.success("Successfully enrolled in test series!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to enroll in test series");
        },
    });
}
