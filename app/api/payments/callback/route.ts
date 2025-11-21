import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "";
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
const PHONEPE_API_URL = process.env.PHONEPE_API_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { transactionId, code, merchantId } = body;

        if (!transactionId) {
            return NextResponse.json(
                { success: false, error: "Transaction ID missing" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify payment status with PhonePe
        const statusUrl = `${PHONEPE_API_URL}/pg/v1/status/${merchantId}/${transactionId}`;

        const checksumString = `/pg/v1/status/${merchantId}/${transactionId}` + PHONEPE_SALT_KEY;
        const checksum = crypto.createHash("sha256").update(checksumString).digest("hex");
        const xVerify = `${checksum}###${PHONEPE_SALT_INDEX}`;

        const statusResponse = await fetch(statusUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": xVerify,
                "X-MERCHANT-ID": merchantId,
            },
        });

        const statusData = await statusResponse.json();

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

            return NextResponse.json({
                success: true,
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
                message: "Payment failed",
            });
        }
    } catch (error) {
        console.error("Payment callback error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
