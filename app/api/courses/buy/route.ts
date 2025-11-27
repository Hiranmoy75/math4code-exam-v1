import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayment } from "@/lib/phonepe";

export async function POST(req: Request) {
    try {
        const { courseId } = await req.json();
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch course price
        const { data: course, error: courseError } = await supabase
            .from("courses")
            .select("price, title")
            .eq("id", courseId)
            .single();

        if (courseError) {
            console.error("Course fetch error:", courseError);
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
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
            return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
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
            return NextResponse.json({ success: true });
        }

        // For Paid Courses - Initiate Payment FIRST, then create enrollment
        console.log("Initiating PhonePe payment for amount:", course.price);

        // Create a short transaction ID (max 38 chars for PhonePe)
        // Format: ENR_timestamp_random (e.g., ENR_1700123456_ABC123)
        const timestamp = Date.now().toString();
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderId = `ENR_${timestamp}_${randomStr}`;

        console.log("Order ID:", orderId, "Length:", orderId.length);

        // Create payment record in course_payments table
        const { error: paymentError } = await supabase
            .from("course_payments")
            .insert({
                user_id: user.id,
                course_id: courseId,
                amount: course.price,
                transaction_id: orderId,
                status: "pending",
                payment_method: "PHONEPE"
            });

        if (paymentError) {
            console.error("Payment record creation error:", paymentError);
            return NextResponse.json({
                error: "Failed to initialize payment record",
                details: paymentError
            }, { status: 500 });
        }

        const paymentResponse = await createPayment(orderId, course.price);

        console.log("PhonePe response:", JSON.stringify(paymentResponse, null, 2));

        if (!paymentResponse.success || !paymentResponse.data?.redirectUrl) {
            console.error("Payment initiation failed:", paymentResponse);

            // Update payment status to failed
            await supabase
                .from("course_payments")
                .update({ status: "failed", metadata: paymentResponse })
                .eq("transaction_id", orderId);

            return NextResponse.json({
                error: paymentResponse.error || "Payment initiation failed. Please check your PhonePe configuration.",
                details: paymentResponse
            }, { status: 500 });
        }

        return NextResponse.json({ url: paymentResponse.data.redirectUrl });

    } catch (error: any) {
        console.error("Buy Course Error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            details: error.toString()
        }, { status: 500 });
    }
}
