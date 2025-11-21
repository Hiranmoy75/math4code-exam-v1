"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface StudentStats {
    totalExams: number;
    averageScore: number;
    totalTimeSpent: number;
    rank: number;
}

export function useStudentStats(userId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: ["student-stats", userId],
        queryFn: async (): Promise<StudentStats> => {
            if (!userId) {
                return {
                    totalExams: 0,
                    averageScore: 0,
                    totalTimeSpent: 0,
                    rank: 0,
                };
            }

            // Get all exam attempts for this student (submitted or graded)
            const { data: attempts, error: attemptsError } = await supabase
                .from("exam_attempts")
                .select("id, started_at, submitted_at")
                .eq("student_id", userId)
                .in("status", ["submitted", "graded"]);

            if (attemptsError) throw attemptsError;

            const totalExams = attempts?.length || 0;

            // Calculate total time spent (difference between started_at and submitted_at)
            let totalTimeSpent = 0;
            if (attempts && attempts.length > 0) {
                totalTimeSpent = attempts.reduce((sum, attempt) => {
                    if (attempt.started_at && attempt.submitted_at) {
                        const start = new Date(attempt.started_at).getTime();
                        const end = new Date(attempt.submitted_at).getTime();
                        const durationSeconds = (end - start) / 1000;
                        return sum + durationSeconds;
                    }
                    return sum;
                }, 0);
            }

            const totalHours = Math.round(totalTimeSpent / 3600); // Convert seconds to hours

            // Get results for completed exams
            const { data: results, error: resultsError } = await supabase
                .from("results")
                .select("obtained_marks, total_marks, percentage")
                .in(
                    "attempt_id",
                    attempts?.map((a) => a.id) || []
                );

            if (resultsError) throw resultsError;

            // Calculate average score percentage
            let averageScore = 0;
            if (results && results.length > 0) {
                const totalPercentage = results.reduce((sum, result) => {
                    // Use percentage if available, otherwise calculate it
                    const percentage = result.percentage ||
                        (result.total_marks > 0 ? (result.obtained_marks / result.total_marks) * 100 : 0);
                    return sum + percentage;
                }, 0);
                averageScore = Math.round(totalPercentage / results.length);
            }

            // Get rank - count students with better average percentage
            // This is simplified - in production you'd want a more sophisticated ranking system
            const { data: allResults } = await supabase
                .from("results")
                .select("attempt_id, percentage, obtained_marks, total_marks");

            let rank = 1;
            if (allResults && allResults.length > 0) {
                // Group by student and calculate their average
                const studentAverages = new Map<string, number>();

                for (const result of allResults) {
                    const { data: attempt } = await supabase
                        .from("exam_attempts")
                        .select("student_id")
                        .eq("id", result.attempt_id)
                        .single();

                    if (attempt) {
                        const studentId = attempt.student_id;
                        const percentage = result.percentage ||
                            (result.total_marks > 0 ? (result.obtained_marks / result.total_marks) * 100 : 0);

                        if (!studentAverages.has(studentId)) {
                            studentAverages.set(studentId, percentage);
                        } else {
                            const current = studentAverages.get(studentId)!;
                            studentAverages.set(studentId, (current + percentage) / 2);
                        }
                    }
                }

                // Count how many students have better average
                const betterStudents = Array.from(studentAverages.entries())
                    .filter(([id, avg]) => id !== userId && avg > averageScore)
                    .length;

                rank = betterStudents + 1;
            }

            return {
                totalExams,
                averageScore,
                totalTimeSpent: totalHours,
                rank,
            };
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
