import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { courseId } = await request.json();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if course exists and is published
        const { data: course, error: courseError } = await supabase
            .from("courses")
            .select("id, price, is_published")
            .eq("id", courseId)
            .single();

        if (courseError || !course) {
            return NextResponse.json(
                { error: "Course not found" },
                { status: 404 }
            );
        }

        if (!course.is_published) {
            return NextResponse.json(
                { error: "Course is not published" },
                { status: 400 }
            );
        }

        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .single();

        if (existingEnrollment) {
            return NextResponse.json(
                { error: "Already enrolled in this course" },
                { status: 400 }
            );
        }

        // For free courses, enroll directly
        if (course.price === 0) {
            const { data: enrollment, error: enrollError } = await supabase
                .from("enrollments")
                .insert({
                    user_id: user.id,
                    course_id: courseId,
                    status: "active",
                    enrolled_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (enrollError) {
                console.error("Enrollment error:", enrollError);
                return NextResponse.json(
                    { error: "Failed to enroll in course" },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                enrollment,
                message: "Successfully enrolled in course",
            });
        } else {
            // For paid courses, return payment required
            return NextResponse.json({
                success: false,
                paymentRequired: true,
                price: course.price,
            });
        }
    } catch (error) {
        console.error("Enrollment API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
