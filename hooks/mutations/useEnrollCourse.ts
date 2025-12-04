"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { invalidations } from "@/lib/invalidations";
import toast from "react-hot-toast";

interface EnrollCourseParams {
    courseId: string;
    userId: string;
}

export function useEnrollCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ courseId, userId }: EnrollCourseParams) => {
            const supabase = createClient();

            // Check if already enrolled - use maybeSingle() to avoid 406 error
            const { data: existingEnrollment } = await supabase
                .from("enrollments")
                .select("id, user_id, course_id")
                .eq("user_id", userId)
                .eq("course_id", courseId)
                .maybeSingle();

            if (existingEnrollment) {
                throw new Error("You are already enrolled in this course");
            }

            // Create enrollment
            const { data, error } = await supabase
                .from("enrollments")
                .insert({
                    user_id: userId,
                    course_id: courseId,
                    enrolled_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            invalidations.afterCourseEnrollment(
                queryClient,
                variables.userId,
                variables.courseId
            );
            toast.success("Successfully enrolled in course!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to enroll in course");
        },
    });
}
