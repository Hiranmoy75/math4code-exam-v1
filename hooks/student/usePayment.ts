"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface InitiatePaymentParams {
    seriesId: string;
    amount: number;
    userId: string;
}

interface PaymentResponse {
    success: boolean;
    paymentUrl?: string;
    transactionId?: string;
    error?: string;
}

export function useInitiatePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: InitiatePaymentParams): Promise<PaymentResponse> => {
            const response = await fetch("/api/payments/initiate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Payment initiation failed");
            }

            return response.json();
        },
        onSuccess: (data) => {
            if (data.success && data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                toast.error("Failed to initiate payment");
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "Payment initiation failed");
        },
    });
}

export function useEnrollFreeSeries() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ seriesId, userId }: { seriesId: string; userId: string }) => {
            const { data, error } = await supabase
                .from("test_series_enrollments")
                .insert({
                    test_series_id: seriesId,
                    student_id: userId,
                    enrolled_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["student-test-series"] });
            queryClient.invalidateQueries({ queryKey: ["my-test-series"] });
            toast.success("Successfully enrolled in free series!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Enrollment failed");
        },
    });
}
