import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";



export async function POST(req: Request) {
    try {
        const { response } = await req.json();

        // 1. Decode Response
        const decodedResponse = JSON.parse(Buffer.from(response, "base64").toString("utf-8"));
        // console.log("🔔 PhonePe Callback Received:", JSON.stringify(decodedResponse, null, 2));

        const { code, merchantTransactionId, merchantOrderId, data } = decodedResponse;
        const transactionId = merchantOrderId || merchantTransactionId;

        if (!transactionId) {
            console.error("❌ Callback received without Transaction ID");
            return NextResponse.json({ success: true }); // Acknowledge to stop retries
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("❌ CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY in callback.");
            return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
        }

        // 2. Update Payment Status
        // Use Service Role to allow updating status and enrolling users without authentication
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Determine status
        let status = "pending";
        if (code === "PAYMENT_SUCCESS") status = "success";
        else if (code === "PAYMENT_ERROR" || code === "PAYMENT_DECLINED") status = "failed";

        // console.log(`📝 Callback Status for ${transactionId}: ${status}`);

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
                updateError = null;
            } else if (tsError) {
                // console.log("❌ Transaction not found in payments either:", transactionId);
            }
        }

        if (updateError || !payment) {
            console.error("Payment update error:", updateError);
            return NextResponse.json({ success: true });
        }

        // 3. If Success, Activate Enrollment
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
                    // console.log("✅ Test Series Enrollment Created (Callback)");
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
                    const { error: enrollError } = await supabase.from("enrollments").insert({
                        user_id: payment.user_id,
                        course_id: payment.course_id,
                        status: "active",
                        payment_id: payment.id
                    });
                    if (enrollError) console.error("❌ Callback Enrollment Insert Failed:", enrollError);
                    // else console.log("✅ Course Enrollment Created (Callback)");
                } else {
                    // Update existing enrollment
                    await supabase
                        .from("enrollments")
                        .update({
                            status: "active",
                            payment_id: payment.id
                        })
                        .eq("id", existingEnrollment.id);
                    // console.log("✅ Course Enrollment Updated (Callback)");
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Callback Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
