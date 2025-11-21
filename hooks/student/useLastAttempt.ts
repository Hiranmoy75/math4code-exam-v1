"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface LastAttempt {
    attemptId: string;
    examId: string;
    examTitle: string;
    status: "in_progress" | "completed";
    startedAt: string;
}

export function useLastAttempt(userId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: ["last-attempt", userId],
        queryFn: async (): Promise<LastAttempt | null> => {
            if (!userId) return null;

            // Get the most recent in-progress attempt
            const { data: attempt, error } = await supabase
                .from("exam_attempts")
                .select(`
          id,
          exam_id,
          status,
          started_at,
          exams (
            id,
            title
          )
        `)
                .eq("student_id", userId)
                .eq("status", "in_progress")
                .order("started_at", { ascending: false })
                .limit(1)
                .single();

            if (error || !attempt) return null;

            const exam = attempt.exams as any;

            return {
                attemptId: attempt.id,
                examId: attempt.exam_id,
                examTitle: exam?.title || "Untitled Exam",
                status: attempt.status as "in_progress" | "completed",
                startedAt: attempt.started_at,
            };
        },
        enabled: !!userId,
        staleTime: 1000 * 30, // 30 seconds
    });
}
