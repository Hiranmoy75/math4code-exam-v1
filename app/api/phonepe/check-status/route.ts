import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import axios from "axios";

export async function POST(req: Request) {
    try {
        const { transactionId } = await req.json();
        const supabase = await createClient();

        // 1. Get payment record
        const { data: payment } = await supabase
            .from("course_payments")
            .select("*")
            .eq("transaction_id", transactionId)
            .single();

        if (!payment) {
            return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
        }

        // If already success, return success
        if (payment.status === "success") {
            return NextResponse.json({ success: true, status: "success" });
        }

        // 2. Check status with PhonePe
        const merchantId = process.env.PHONEPE_MERCHANT_ID!;
        const saltKey = process.env.PHONEPE_SALT_KEY!;
        const saltIndex = process.env.PHONEPE_SALT_INDEX!;

        const stringToHash = `/pg/v1/status/${merchantId}/${transactionId}` + saltKey;
        const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
        const xVerify = `${sha256}###${saltIndex}`;

        const url = `${process.env.PHONEPE_BASE_URL}/pg/v1/status/${merchantId}/${transactionId}`;

        const response = await axios.get(url, {
            headers: {
                "Content-Type": "application/json",
                "X-MERCHANT-ID": merchantId,
                "X-VERIFY": xVerify,
            },
        });

        const { code, data } = response.data;
        console.log("PhonePe Status Check Response:", JSON.stringify(response.data, null, 2));

        let status = "pending";
        if (code === "PAYMENT_SUCCESS") status = "success";
        else if (code === "PAYMENT_ERROR" || code === "PAYMENT_DECLINED") status = "failed";

        // 3. Update Database
        if (status !== payment.status) {
            await supabase
                .from("course_payments")
                .update({
                    status: status,
                    provider_transaction_id: data?.transactionId,
                    payment_method: data?.paymentInstrument?.type,
                    metadata: response.data
                })
                .eq("transaction_id", transactionId);

            // 4. Activate Enrollment if Success
            if (status === "success") {
                const { data: existingEnrollment } = await supabase
                    .from("enrollments")
                    .select("id")
                    .eq("user_id", payment.user_id)
                    .eq("course_id", payment.course_id)
                    .single();

                if (!existingEnrollment) {
                    await supabase.from("enrollments").insert({
                        user_id: payment.user_id,
                        course_id: payment.course_id,
                        status: "active",
                        payment_id: payment.id
                    });
                } else {
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

        return NextResponse.json({
            success: status === "success",
            status: status
        });

    } catch (error: any) {
        console.error("Status Check Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
