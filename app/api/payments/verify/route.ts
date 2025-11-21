import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "";
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "";
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
const PHONEPE_API_URL = process.env.PHONEPE_API_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const transactionId = searchParams.get("txnId");

        if (!transactionId) {
            return NextResponse.json(
                { success: false, error: "Transaction ID missing" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get payment record
        const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .select("*")
            .eq("phonepe_transaction_id", transactionId)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json(
                { success: false, error: "Payment record not found" },
                { status: 404 }
            );
        }

        // If already processed, return current status
        if (payment.status === "success" || payment.status === "failed") {
            return NextResponse.json({
                success: payment.status === "success",
                status: payment.status,
                message: payment.status === "success" ? "Payment successful" : "Payment failed",
            });
        }

        // Check status with PhonePe
        const statusUrl = `${PHONEPE_API_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}`;

        const checksumString = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}` + PHONEPE_SALT_KEY;
        const checksum = crypto.createHash("sha256").update(checksumString).digest("hex");
        const xVerify = `${checksum}###${PHONEPE_SALT_INDEX}`;

        console.log("Checking PhonePe status for:", transactionId);

        const statusResponse = await fetch(statusUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": xVerify,
                "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
            },
        });

        const statusData = await statusResponse.json();
        console.log("PhonePe status response:", statusData);

        // Update payment status based on PhonePe response
        if (statusData.success && statusData.code === "PAYMENT_SUCCESS") {
            // Update payment to success
            await supabase
                .from("payments")
                .update({
                    status: "success",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", payment.id);

            // Check if already enrolled
            const { data: existingEnrollment } = await supabase
                .from("test_series_enrollments")
                .select("id")
                .eq("test_series_id", payment.series_id)
                .eq("student_id", payment.user_id)
                .single();

            if (!existingEnrollment) {
                // Enroll student in test series
                const { error: enrollError } = await supabase
                    .from("test_series_enrollments")
                    .insert({
                        test_series_id: payment.series_id,
                        student_id: payment.user_id,
                        enrolled_at: new Date().toISOString(),
                    });

                if (enrollError) {
                    console.error("Enrollment error:", enrollError);
                }
            }

            return NextResponse.json({
                success: true,
                status: "success",
                message: "Payment successful and enrollment completed",
            });
        } else {
            // Update payment to failed
            await supabase
                .from("payments")
                .update({
                    status: "failed",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", payment.id);

            return NextResponse.json({
                success: false,
                status: "failed",
                message: statusData.message || "Payment failed",
            });
        }
    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
