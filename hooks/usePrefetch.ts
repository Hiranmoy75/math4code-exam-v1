"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Prefetch Utilities
 * Functions to prefetch data on hover or navigation
 */

export function usePrefetch() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return {
        /**
         * Prefetch course details on hover
         */
        prefetchCourse: (courseId: string) => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.courses.detail(courseId),
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from("courses")
                        .select("*")
                        .eq("id", courseId)
                        .single();

                    if (error) throw error;
                    return data;
                },
                staleTime: 1000 * 60 * 10, // 10 minutes
            });
        },

        /**
         * Prefetch exam details on hover
         */
        prefetchExam: (examId: string) => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.exams.detail(examId),
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from("exams")
                        .select("*")
                        .eq("id", examId)
                        .single();

                    if (error) throw error;
                    return data;
                },
                staleTime: 1000 * 60 * 10,
            });
        },

        /**
         * Prefetch test series details on hover
         */
        prefetchTestSeries: (seriesId: string) => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.testSeries.detail(seriesId),
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from("test_series")
                        .select("*")
                        .eq("id", seriesId)
                        .single();

                    if (error) throw error;
                    return data;
                },
                staleTime: 1000 * 60 * 10,
            });
        },

        /**
         * Prefetch exam sections (for exam player)
         */
        prefetchExamSections: (examId: string) => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.exams.sections(examId),
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from("sections")
                        .select("id, title, duration_minutes, total_marks, section_order")
                        .eq("exam_id", examId)
                        .order("section_order", { ascending: true });

                    if (error) throw error;
                    return data;
                },
                staleTime: 1000 * 60 * 15, // 15 minutes - sections rarely change
            });
        },
    };
}
