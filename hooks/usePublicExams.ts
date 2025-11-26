import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface PublicExam {
    id: string;
    title: string;
    description: string | null;
    duration_minutes: number;
    max_attempts: number | null;
    passing_score: number | null;
    created_at: string;
    course_id: string | null;
    test_series_id: string | null;
}

export const usePublicExams = () => {
    const supabase = createClient();

    return useQuery({
        queryKey: ["public-exams"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("exams")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as PublicExam[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const usePublicExamsByCourse = (courseId?: string) => {
    const supabase = createClient();

    return useQuery({
        queryKey: ["public-exams", "course", courseId],
        queryFn: async () => {
            if (!courseId) return [];

            const { data, error } = await supabase
                .from("exams")
                .select("*")
                .eq("course_id", courseId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as PublicExam[];
        },
        enabled: !!courseId,
        staleTime: 1000 * 60 * 5,
    });
};

export const usePublicExamsByTestSeries = (testSeriesId?: string) => {
    const supabase = createClient();

    return useQuery({
        queryKey: ["public-exams", "test-series", testSeriesId],
        queryFn: async () => {
            if (!testSeriesId) return [];

            const { data, error } = await supabase
                .from("exams")
                .select("*")
                .eq("test_series_id", testSeriesId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as PublicExam[];
        },
        enabled: !!testSeriesId,
        staleTime: 1000 * 60 * 5,
    });
};
