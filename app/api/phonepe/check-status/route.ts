import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPaymentStatus } from "@/lib/phonepe";

// CORS headers for mobile app
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: Request) {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const { transactionId } = await req.json();

        if (!transactionId) {
            return NextResponse.json(
                { error: "Transaction ID is required" },
                { status: 400, headers: corsHeaders }
            );
        }

        console.log("🔍 Verifying Payment for Transaction ID:", transactionId);

        // Check for Authorization header (for mobile app)
        const authHeader = req.headers.get('Authorization');
        let supabase;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            // Mobile app request with Bearer token
            const token = authHeader.split(' ')[1];
            const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

            supabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    global: {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                }
            );
        } else {
            // Web app request with cookies
            supabase = await createClient();
        }

        // 1. Call PhonePe Status API
        // We pass the transactionId exactly as it was created (merchantTransactionId)
        const statusResponse = await checkPaymentStatus(transactionId);

        // 2. Determine Status
        let status = "pending";
        const state = statusResponse.state || statusResponse.code; // Handle both v1/v2 response structures just in case

        if (state === "COMPLETED" || state === "PAYMENT_SUCCESS") {
            status = "success";
        } else if (state === "FAILED" || state === "PAYMENT_ERROR" || state === "PAYMENT_DECLINED") {
            status = "failed";
        }

        console.log(`📝 Status for ${transactionId}: ${status} (State: ${state})`);

        // 3. Update Database
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
                console.error("❌ Transaction not found in DB:", transactionId);
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
                    console.log("✅ Test Series Enrollment Created");
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
                    console.log("✅ Course Enrollment Created");
                } else {
                    // Update existing enrollment
                    await supabase
                        .from("enrollments")
                        .update({
                            status: "active",
                            payment_id: payment.id
                        })
                        .eq("id", existingEnrollment.id);
                    console.log("✅ Course Enrollment Updated");
                }
            }
        }

        return NextResponse.json({ status: status, data: statusResponse }, { headers: corsHeaders });

    } catch (error: any) {
        console.error("Status Check Error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            debug: {
                transactionId: (req as any).body?.transactionId, // Note: body already read
                env: process.env.PHONEPE_ENV,
                merchantId: process.env.PHONEPE_MERCHANT_ID ? "SET" : "MISSING"
            }
        }, { status: 500 });
    }
}
