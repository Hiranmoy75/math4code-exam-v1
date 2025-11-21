"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface TestSeriesProgress {
    id: string;
    title: string;
    description: string | null;
    progress: number;
    completedExams: number;
    totalExams: number;
    nextExamDate: string | null;
    nextExamName: string | null;
}

export function useStudentTestSeries(userId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: ["student-test-series", userId],
        queryFn: async (): Promise<TestSeriesProgress[]> => {
            if (!userId) return [];

            // Get enrolled test series IDs
            const { data: enrollments, error: enrollError } = await supabase
                .from("test_series_enrollments")
                .select("test_series_id")
                .eq("student_id", userId);

            if (enrollError) {
                console.error("Enrollment error:", enrollError);
                throw enrollError;
            }

            if (!enrollments || enrollments.length === 0) {
                console.log("No enrollments found for user:", userId);
                return [];
            }

            const enrolledIds = enrollments.map((e) => e.test_series_id);
            console.log("Enrolled IDs:", enrolledIds);

            // Get test series details
            const { data: testSeries, error: seriesError } = await supabase
                .from("test_series")
                .select("id, title, description")
                .in("id", enrolledIds);

            if (seriesError) {
                console.error("Series error:", seriesError);
                throw seriesError;
            }

            if (!testSeries) {
                console.log("No test series found");
                return [];
            }

            console.log("Test series found:", testSeries);

            // For each series, fetch exams and attempts
            const seriesData: TestSeriesProgress[] = await Promise.all(
                testSeries.map(async (series) => {
                    // Get all exams in this series
                    const { data: seriesExams, error: examsError } = await supabase
                        .from("test_series_exams")
                        .select(`
              exam_id,
              exams (
                id,
                title,
                start_time
              )
            `)
                        .eq("test_series_id", series.id);

                    if (examsError) {
                        console.error("Exams error:", examsError);
                        throw examsError;
                    }

                    const totalExams = seriesExams?.length || 0;
                    const examIds = seriesExams?.map((se: any) => se.exam_id) || [];

                    // Get completed exams for this student (use submitted or graded status)
                    const { data: completedAttempts, error: attemptsError } = await supabase
                        .from("exam_attempts")
                        .select("exam_id, status")
                        .eq("student_id", userId)
                        .in("status", ["submitted", "graded"])
                        .in("exam_id", examIds);

                    if (attemptsError) {
                        console.error("Attempts error:", attemptsError);
                        throw attemptsError;
                    }

                    // Count unique completed exams
                    const uniqueCompletedExams = new Set(
                        completedAttempts?.map((a) => a.exam_id) || []
                    );
                    const completedExams = uniqueCompletedExams.size;

                    const progress = totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0;

                    // Find next upcoming exam
                    const now = new Date();
                    const upcomingExams = seriesExams
                        ?.map((se: any) => se.exams)
                        ?.filter((exam: any) => exam?.start_time && new Date(exam.start_time) > now)
                        ?.sort((a: any, b: any) =>
                            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                        );

                    const nextExam = upcomingExams?.[0];

                    return {
                        id: series.id,
                        title: series.title,
                        description: series.description,
                        progress,
                        completedExams,
                        totalExams,
                        nextExamDate: nextExam?.start_time || null,
                        nextExamName: nextExam?.title || null,
                    };
                })
            );

            console.log("Final series data:", seriesData);
            return seriesData;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
        retry: 1,
    });
}
