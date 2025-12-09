import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayment } from "@/lib/phonepe";

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
        const { courseId } = await req.json();

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
                    { error: "Unauthorized (Invalid Token)" },
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
                { error: "Unauthorized" },
                { status: 401, headers: corsHeaders }
            );
        }

        // Fetch course price
        const { data: course, error: courseError } = await supabase
            .from("courses")
            .select("price, title")
            .eq("id", courseId)
            .single();

        if (courseError || !course) {
            return NextResponse.json(
                { error: "Course not found" },
                { status: 404, headers: corsHeaders }
            );
        }

        console.log("Course found:", course.title, "Price:", course.price);

        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
            .from("enrollments")
            .select("id, status")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .single();

        if (existingEnrollment && existingEnrollment.status === "active") {
            return NextResponse.json(
                { error: "Already enrolled" },
                { status: 400, headers: corsHeaders }
            );
        }

        // Handle Free Course - create enrollment directly
        if (course.price === 0) {
            let enrollmentId = existingEnrollment?.id;

            if (!existingEnrollment) {
                const { data: newEnrollment, error } = await supabase
                    .from("enrollments")
                    .insert({
                        user_id: user.id,
                        course_id: courseId,
                        status: "active",
                    })
                    .select()
                    .single();

                if (error) {
                    console.error("Free enrollment creation error:", error);
                    throw error;
                }
                enrollmentId = newEnrollment.id;
            } else {
                const { error } = await supabase
                    .from("enrollments")
                    .update({ status: "active" })
                    .eq("id", enrollmentId);

                if (error) {
                    console.error("Free enrollment activation error:", error);
                    throw error;
                }
            }

            console.log("Free course enrolled successfully");
            return NextResponse.json(
                { success: true },
                { headers: corsHeaders }
            );
        }

        // For Paid Courses - Initiate Payment FIRST, then create enrollment
        console.log("Initiating PhonePe payment for amount:", course.price);

        // Create a unique Merchant Transaction ID
        // Format: MT_{timestamp}_{random} to ensure uniqueness and no special chars
        // We use the same format as the initiate API for consistency
        const merchantTransactionId = `MT${Date.now()}${Math.floor(Math.random() * 1000)}`;

        console.log(`Creating Payment Record for User: ${user.id}, Course: ${courseId}, TxnID: ${merchantTransactionId}`);

        // Create payment record in course_payments table
        const { error: paymentError } = await supabase
            .from("course_payments")
            .insert({
                user_id: user.id,
                course_id: courseId,
                amount: course.price,
                transaction_id: merchantTransactionId, // Store the exact ID
                status: "pending",
                payment_method: "PHONEPE"
            });

        if (paymentError) {
            console.error("Payment record creation error:", paymentError);
            return NextResponse.json({
                error: "Failed to initialize payment record",
                details: paymentError
            }, { status: 500, headers: corsHeaders });
        }

        // Initiate Payment using shared utility
        // Pass the EXACT merchantTransactionId we just stored AND the userId
        const paymentResponse = await createPayment(merchantTransactionId, course.price, user.id);

        console.log("PhonePe response:", JSON.stringify(paymentResponse, null, 2));

        if (!paymentResponse.success || !paymentResponse.data?.redirectUrl) {
            console.error("Payment initiation failed:", paymentResponse);

            // Update payment status to failed
            await supabase
                .from("course_payments")
                .update({ status: "failed", metadata: paymentResponse })
                .eq("transaction_id", merchantTransactionId);

            return NextResponse.json({
                error: paymentResponse.error || "Payment initiation failed. Please check your PhonePe configuration.",
                details: paymentResponse
            }, { status: 500, headers: corsHeaders });
        }

        return NextResponse.json(
            {
                url: paymentResponse.data.redirectUrl,
                transactionId: merchantTransactionId
            },
            { headers: corsHeaders }
        );

    } catch (error: any) {
        console.error("Buy Course Error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            details: error.toString()
        }, { status: 500, headers: corsHeaders });
    }
}
