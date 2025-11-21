import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

// PhonePe configuration
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "";
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "";
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
const PHONEPE_API_URL = process.env.PHONEPE_API_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox";

export async function POST(request: NextRequest) {
    try {
        const { seriesId, amount, userId } = await request.json();

        if (!seriesId || !amount || !userId) {
            return NextResponse.json(
                { success: false, error: "Missing required parameters" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get series details
        const { data: series, error: seriesError } = await supabase
            .from("test_series")
            .select("*")
            .eq("id", seriesId)
            .single();

        if (seriesError || !series) {
            return NextResponse.json(
                { success: false, error: "Test series not found" },
                { status: 404 }
            );
        }

        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
            .from("test_series_enrollments")
            .select("id")
            .eq("test_series_id", seriesId)
            .eq("student_id", userId)
            .single();

        if (existingEnrollment) {
            return NextResponse.json(
                { success: false, error: "Already enrolled in this series" },
                { status: 400 }
            );
        }

        // Create payment record
        const transactionId = `TXN_${Date.now()}_${userId.substring(0, 8)}`;

        const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .insert({
                user_id: userId,
                series_id: seriesId,
                amount: amount,
                status: "pending",
                phonepe_transaction_id: transactionId,
            })
            .select()
            .single();

        if (paymentError) {
            console.error("Payment creation error:", paymentError);
            return NextResponse.json(
                { success: false, error: "Failed to create payment record" },
                { status: 500 }
            );
        }

        // Prepare PhonePe payment request
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const callbackUrl = `${baseUrl}/api/payments/callback`;
        const redirectUrl = `${baseUrl}/student/payment/verify?txnId=${transactionId}`;

        const paymentPayload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId: transactionId,
            merchantUserId: userId.substring(0, 36), // Max 36 chars
            amount: Math.round(amount * 100), // Convert to paise
            redirectUrl: redirectUrl,
            redirectMode: "REDIRECT",
            callbackUrl: callbackUrl,
            paymentInstrument: {
                type: "PAY_PAGE",
            },
        };

        console.log("Payment payload:", paymentPayload);

        // Encode payload to base64
        const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

        // Generate checksum
        const checksumString = base64Payload + "/pg/v1/pay" + PHONEPE_SALT_KEY;
        const checksum = crypto.createHash("sha256").update(checksumString).digest("hex");
        const xVerify = `${checksum}###${PHONEPE_SALT_INDEX}`;

        console.log("Initiating PhonePe payment...");

        // Make request to PhonePe
        const phonePeResponse = await fetch(`${PHONEPE_API_URL}/pg/v1/pay`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": xVerify,
            },
            body: JSON.stringify({
                request: base64Payload,
            }),
        });

        const phonePeData = await phonePeResponse.json();
        console.log("PhonePe response:", phonePeData);

        if (phonePeData.success && phonePeData.data?.instrumentResponse?.redirectInfo?.url) {
            return NextResponse.json({
                success: true,
                paymentUrl: phonePeData.data.instrumentResponse.redirectInfo.url,
                transactionId: transactionId,
            });
        } else {
            // Update payment status to failed
            await supabase
                .from("payments")
                .update({ status: "failed" })
                .eq("id", payment.id);

            console.error("PhonePe error:", phonePeData);
            return NextResponse.json(
                { success: false, error: phonePeData.message || "PhonePe payment initiation failed" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Payment initiation error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
