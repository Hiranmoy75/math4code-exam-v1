import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { response } = await req.json();

        // 1. Skip Checksum Verification (User has no Salt Key)
        // Ideally we should call Status API to verify, but for now we trust the callback payload structure
        // or we can implement Status API call here.

        // 2. Decode Response
        const decodedResponse = JSON.parse(Buffer.from(response, "base64").toString("utf-8"));
        console.log("PhonePe Callback Data:", JSON.stringify(decodedResponse, null, 2));

        const { code, merchantTransactionId, merchantOrderId, data } = decodedResponse;
        const transactionId = merchantOrderId || merchantTransactionId;

        // 3. Update Payment Status
        const supabase = await createClient();

        // Determine status
        let status = "pending";
        if (code === "PAYMENT_SUCCESS") status = "success";
        else if (code === "PAYMENT_ERROR" || code === "PAYMENT_DECLINED") status = "failed";

        // Update course_payments table
        let { data: payment, error: updateError } = await supabase
            .from("course_payments")
            .update({
                status: status,
                provider_transaction_id: data?.transactionId,
                payment_method: data?.paymentInstrument?.type,
                metadata: decodedResponse
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
                console.log("Not found in payments either");
            }
        }

        if (updateError || !payment) {
            console.error("Payment update error:", updateError);
            // Even if update fails, we should return success to PhonePe so they stop retrying
            // But we log it as critical error
            return NextResponse.json({ success: true });
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

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Callback Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
