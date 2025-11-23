import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { response } = await req.json();

        // 1. Verify Checksum
        const xVerify = req.headers.get("x-verify");
        if (!xVerify) {
            return NextResponse.json({ error: "Missing checksum" }, { status: 400 });
        }

        const saltKey = process.env.PHONEPE_SALT_KEY!;
        const saltIndex = process.env.PHONEPE_SALT_INDEX!;

        const calculatedChecksum = crypto
            .createHash("sha256")
            .update(response + saltKey)
            .digest("hex") + "###" + saltIndex;

        if (calculatedChecksum !== xVerify) {
            return NextResponse.json({ error: "Invalid checksum" }, { status: 400 });
        }

        // 2. Decode Response
        const decodedResponse = JSON.parse(Buffer.from(response, "base64").toString("utf-8"));
        console.log("PhonePe Callback Data:", JSON.stringify(decodedResponse, null, 2));

        const { code, merchantTransactionId, data } = decodedResponse;

        // 3. Update Payment Status
        const supabase = await createClient();

        // Determine status
        let status = "pending";
        if (code === "PAYMENT_SUCCESS") status = "success";
        else if (code === "PAYMENT_ERROR" || code === "PAYMENT_DECLINED") status = "failed";

        // Update course_payments table
        const { data: payment, error: updateError } = await supabase
            .from("course_payments")
            .update({
                status: status,
                provider_transaction_id: data?.transactionId,
                payment_method: data?.paymentInstrument?.type,
                metadata: decodedResponse
            })
            .eq("transaction_id", merchantTransactionId)
            .select()
            .single();

        if (updateError || !payment) {
            console.error("Payment update error:", updateError);
            // Even if update fails, we should return success to PhonePe so they stop retrying
            // But we log it as critical error
            return NextResponse.json({ success: true });
        }

        // 4. If Success, Activate Enrollment
        if (status === "success") {
            // Check if enrollment already exists
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

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Callback Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
