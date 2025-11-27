import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayment } from "@/lib/phonepe";

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

        // Initiate Payment using shared utility (OAuth)
        const paymentResponse = await createPayment(transactionId, amount);

        if (paymentResponse.success && paymentResponse.data?.redirectUrl) {
            return NextResponse.json({
                success: true,
                paymentUrl: paymentResponse.data.redirectUrl,
                transactionId: transactionId,
            });
        } else {
            // Update payment status to failed
            await supabase
                .from("payments")
                .update({ status: "failed" })
                .eq("id", payment.id);

            console.error("PhonePe error:", paymentResponse);
            return NextResponse.json(
                { success: false, error: paymentResponse.error || "PhonePe payment initiation failed" },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Payment initiation error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
