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
        const { transactionId, courseId } = await req.json();

        if (!transactionId) {
            return NextResponse.json(
                { success: false, error: "Transaction ID is required" },
                { status: 400, headers: corsHeaders }
            );
        }

        // Check for Authorization header (for mobile app)
        const authHeader = req.headers.get('Authorization');
        let supabase;
        let user;

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

            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !authUser) {
                return NextResponse.json(
                    { success: false, error: "Unauthorized" },
                    { status: 401, headers: corsHeaders }
                );
            }
            user = authUser;
        } else {
            // Web app request with cookies
            supabase = await createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();
            user = authUser;
        }

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401, headers: corsHeaders }
            );
        }

        // 1. Check payment status from PhonePe
        const statusResponse = await checkPaymentStatus(transactionId);

        // 2. Determine payment status
        let status = "pending";
        const response = statusResponse as any;
        let state = null;

        if (response.state) {
            state = response.state;
        } else if (response.success && response.data) {
            state = response.data.state;
        } else if (response.code) {
            state = response.code;
        }

        if (state === "COMPLETED" || state === "PAYMENT_SUCCESS") {
            status = "success";
        } else if (state === "FAILED" || state === "PAYMENT_ERROR" || state === "PAYMENT_DECLINED") {
            status = "failed";
        }

        // 3. Update payment record in database
        const { data: payment, error: updateError } = await supabase
            .from("course_payments")
            .update({
                status: status,
                metadata: statusResponse
            })
            .eq("transaction_id", transactionId)
            .select()
            .single();

        if (updateError || !payment) {
            console.error("❌ Failed to update payment record:", updateError);
            return NextResponse.json(
                { success: false, error: "Payment record not found" },
                { status: 404, headers: corsHeaders }
            );
        }

        // 4. Verify the payment belongs to the requesting user
        if (payment.user_id !== user.id) {
            console.error("❌ Payment user mismatch:", payment.user_id, "vs", user.id);
            return NextResponse.json(
                { success: false, error: "Unauthorized access to payment" },
                { status: 403, headers: corsHeaders }
            );
        }

        // 5. If payment successful, create/activate enrollment
        if (status === "success") {
            const { data: existingEnrollment } = await supabase
                .from("enrollments")
                .select("id, status")
                .eq("user_id", user.id)
                .eq("course_id", payment.course_id)
                .single();

            if (!existingEnrollment) {
                // Create new enrollment
                const { error: enrollError } = await supabase
                    .from("enrollments")
                    .insert({
                        user_id: user.id,
                        course_id: payment.course_id,
                        status: "active",
                        payment_id: payment.id,
                        enrolled_at: new Date().toISOString(),
                        progress: 0,
                        completed: false
                    });

                if (enrollError) {
                    console.error("❌ Failed to create enrollment:", enrollError);
                    return NextResponse.json(
                        { success: false, error: "Failed to create enrollment" },
                        { status: 500, headers: corsHeaders }
                    );
                }
            } else if (existingEnrollment.status !== "active") {
                // Activate existing enrollment
                const { error: activateError } = await supabase
                    .from("enrollments")
                    .update({
                        status: "active",
                        payment_id: payment.id,
                        enrolled_at: new Date().toISOString()
                    })
                    .eq("id", existingEnrollment.id);

                if (activateError) {
                    console.error("❌ Failed to activate enrollment:", activateError);
                    return NextResponse.json(
                        { success: false, error: "Failed to activate enrollment" },
                        { status: 500, headers: corsHeaders }
                    );
                }
            }

            return NextResponse.json(
                {
                    success: true,
                    message: "Payment verified and enrollment activated",
                    status: status,
                    state: state
                },
                { headers: corsHeaders }
            );
        } else if (status === "failed") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Payment failed",
                    status: status,
                    state: state
                },
                { headers: corsHeaders }
            );
        } else {
            // Pending status
            return NextResponse.json(
                {
                    success: false,
                    message: "Payment is still pending",
                    status: status,
                    state: state
                },
                { headers: corsHeaders }
            );
        }

    } catch (error: any) {
        console.error("❌ Payment verification error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Internal server error"
            },
            { status: 500, headers: corsHeaders }
        );
    }
}
