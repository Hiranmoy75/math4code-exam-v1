import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPaymentStatus } from "@/lib/phonepe";

export async function POST(req: Request) {
    try {
        const { transactionId } = await req.json();

        if (!transactionId) {
            return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
        }

        console.log("Checking status for:", transactionId);

        // 1. Call PhonePe Status API
        const statusResponse = await checkPaymentStatus(transactionId);

        // 2. Determine Status
        let status = "pending";
        // PhonePe v2 Status API returns { state: "COMPLETED" | "FAILED" | "PENDING", ... }
        // or sometimes { code: "PAYMENT_SUCCESS", ... } depending on exact endpoint version behavior
        // Let's handle both common patterns just in case, but v2 usually uses 'state'

        const state = statusResponse.state;

        if (state === "COMPLETED" || state === "PAYMENT_SUCCESS") {
            status = "success";
        } else if (state === "FAILED" || state === "PAYMENT_ERROR" || state === "PAYMENT_DECLINED") {
            status = "failed";
        }

        console.log("Determined Status:", status, "from State:", state);

        // 3. Update Database
        const supabase = await createClient();

        // Try updating course_payments first
        let { data: payment, error: updateError } = await supabase
            .from("course_payments")
            .update({
                status: status,
                metadata: statusResponse
            })
            .eq("transaction_id", transactionId)
            .select()
            .single();

        let isTestSeries = false;

        // If not found in course_payments, try payments (test series)
        if (!payment) {
            const { data: tsPayment, error: tsError } = await supabase
                .from("payments")
                .update({ status: status })
                .eq("phonepe_transaction_id", transactionId)
                .select()
                .single();

            if (tsPayment) {
                payment = tsPayment;
                isTestSeries = true;
                updateError = null;
            } else if (tsError) {
                // Keep the original error if both fail, or log it
                console.log("Not found in payments either");
            }
        }

        if (updateError || !payment) {
            console.error("Payment update error:", updateError);
            return NextResponse.json({ error: "Failed to update payment record" }, { status: 500 });
        }

        // 4. If Success, Activate Enrollment
        if (status === "success") {
            if (isTestSeries) {
                // Test Series Enrollment
                const { data: existingEnrollment } = await supabase
                    .from("test_series_enrollments")
                    .select("id")
                    .eq("student_id", payment.user_id)
                    .eq("test_series_id", payment.series_id)
                    .single();

                if (!existingEnrollment) {
                    await supabase.from("test_series_enrollments").insert({
                        student_id: payment.user_id,
                        test_series_id: payment.series_id,
                        enrolled_at: new Date().toISOString()
                    });
                }
            } else {
                // Course Enrollment
                const { data: existingEnrollment } = await supabase
                    .from("enrollments")
                    .select("id")
                    .eq("user_id", payment.user_id)
                    .eq("course_id", payment.course_id)
                    .single();

                if (!existingEnrollment) {
                    // Create new enrollment
                    await supabase.from("enrollments").insert({
                        user_id: payment.user_id,
                        course_id: payment.course_id,
                        status: "active",
                        payment_id: payment.id
                    });
                } else {
                    // Update existing enrollment
                    await supabase
                        .from("enrollments")
                        .update({
                            status: "active",
                            payment_id: payment.id
                        })
                        .eq("id", existingEnrollment.id);
                }
            }
        }

        return NextResponse.json({ status: status, data: statusResponse });

    } catch (error: any) {
        console.error("Status Check Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
